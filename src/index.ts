import Matrix from './Matrix'

class AppMain {
  private readonly context: WebGLRenderingContext

  private vertexShader: WebGLShader
  private fragmentShader: WebGLShader
  private program: WebGLProgram
  private vbo: WebGLBuffer

  public constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('webgl')
  }

  public clearColor() {
    this.context.clearColor(0, 0, 0, 1)
    this.context.clearDepth(1.0)
    this.context.clear(
      this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT
    )
  }

  public createShader(id: string): WebGLShader {
    let shader: WebGLShader
    const scriptElement = document.getElementById(id) as HTMLScriptElement

    if (!scriptElement) {
      return
    }

    switch (scriptElement.type) {
      case 'x-shader/x-vertex':
        shader = this.context.createShader(this.context.VERTEX_SHADER)
        this.vertexShader = shader
        break
      case 'x-shader/x-fragment':
        shader = this.context.createShader(this.context.FRAGMENT_SHADER)
        this.fragmentShader = shader
        break
      default:
        break
    }

    this.context.shaderSource(shader, scriptElement.text)
    this.context.compileShader(shader)

    if (this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
      return shader
    } else {
      const compileLog = this.context.getShaderInfoLog(shader)
      throw new Error(compileLog)
    }
  }

  public createProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram {
    const program = this.context.createProgram()
    // シェーダーのアタッチ
    this.context.attachShader(program, vs)
    this.context.attachShader(program, fs)
    // 2つのシェーダーをリンク
    this.context.linkProgram(program)

    if (this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
      // プログラムオブジェクトの有効か
      this.context.useProgram(program)
      this.program = program
      return program
    } else {
      const programLog = this.context.getProgramInfoLog(program)
      throw new Error(programLog)
    }
  }

  public createVBO(data: number[]): WebGLBuffer {
    const vbo = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo)
    this.context.bufferData(
      this.context.ARRAY_BUFFER,
      new Float32Array(data),
      this.context.STATIC_DRAW
    )
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null)
    this.vbo = vbo
    return vbo
  }

  public bindVBO(vbo: WebGLBuffer) {
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vbo)

    const attLocation = this.context.getAttribLocation(this.program, 'position')
    const stride = 3

    this.context.enableVertexAttribArray(attLocation)
    this.context.vertexAttribPointer(
      attLocation,
      stride,
      this.context.FLOAT,
      false,
      0,
      0
    )
  }

  public bindMVP(mvpMatrix: Float32Array) {
    const uniLocation = this.context.getUniformLocation(
      this.program,
      'mvpMatrix'
    )
    this.context.uniformMatrix4fv(uniLocation, false, mvpMatrix)
  }

  public draw() {
    this.context.drawArrays(this.context.TRIANGLES, 0, 3)
    this.context.flush()
  }
}

onload = (): void => {
  const c: HTMLCanvasElement = document.getElementById(
    'canvas'
  ) as HTMLCanvasElement

  c.width = 500
  c.height = 300

  const app = new AppMain(c)
  app.clearColor()

  const vertexShader = app.createShader('vs')
  const fragmentShader = app.createShader('fs')
  const program = app.createProgram(vertexShader, fragmentShader)

  const vertexPositions = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0]

  const vbo = app.createVBO(vertexPositions)
  app.bindVBO(vbo)

  const mMatrix = Matrix.identity(Matrix.create())
  const vMatrix = Matrix.identity(Matrix.create())
  const pMatrix = Matrix.identity(Matrix.create())
  const mvpMatrix = Matrix.identity(Matrix.create())

  Matrix.lookAt(
    new Float32Array([0.0, 1.0, 3.0]),
    new Float32Array([0, 0, 0]),
    new Float32Array([0, 1, 0]),
    vMatrix
  )

  Matrix.perspective(90, c.width / c.height, 0.1, 100, pMatrix)

  Matrix.multiply(pMatrix, vMatrix, mvpMatrix)
  Matrix.multiply(mvpMatrix, mMatrix, mvpMatrix)

  app.bindMVP(mvpMatrix)
  app.draw()
}
