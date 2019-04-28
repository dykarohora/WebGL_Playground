import Matrix from './Matrix'

class AppMain {
  private readonly context: WebGLRenderingContext

  private vertexShader: WebGLShader
  private fragmentShader: WebGLShader
  private program: WebGLProgram
  private vertexVbo: WebGLBuffer
  private colorVbo: WebGLBuffer

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

  public createVBO(vertices: number[], colors: number[]): WebGLBuffer {
    const vertexVbo = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, vertexVbo)
    this.context.bufferData(
      this.context.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.context.STATIC_DRAW
    )
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null)
    this.vertexVbo = vertexVbo

    const colorVbo = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, colorVbo)
    this.context.bufferData(
      this.context.ARRAY_BUFFER,
      new Float32Array(colors),
      this.context.STATIC_DRAW
    )
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null)
    this.colorVbo = colorVbo
    return vertexVbo
  }

  public bindVBO() {
    const attLocation = new Array(2)
    attLocation[0] = this.context.getAttribLocation(this.program, 'position')
    attLocation[1] = this.context.getAttribLocation(this.program, 'color')

    const attStride = new Array(2)
    attStride[0] = 3
    attStride[1] = 4

    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexVbo)
    this.context.enableVertexAttribArray(attLocation[0])
    this.context.vertexAttribPointer(
      attLocation[0],
      attStride[0],
      this.context.FLOAT,
      false,
      0,
      0
    )

    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.colorVbo)
    this.context.enableVertexAttribArray(attLocation[1])
    this.context.vertexAttribPointer(
      attLocation[1],
      attStride[1],
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
  app.createProgram(vertexShader, fragmentShader)

  const vertexPositions = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0]
  const vertexColor = [
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    1.0,
    0.0,
    1.0,
    0.0,
    0.0,
    1.0,
    1.0
  ]

  app.createVBO(vertexPositions, vertexColor)
  app.bindVBO()

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

  Matrix.perspective(60, c.width / c.height, 0.1, 100, pMatrix)

  Matrix.multiply(pMatrix, vMatrix, mvpMatrix)
  Matrix.multiply(mvpMatrix, mMatrix, mvpMatrix)

  app.bindMVP(mvpMatrix)
  app.draw()
}
