import Matrix from './Matrix'

enum ShaderType {
  Vertex,
  Fragment
}

class AppMain {
  private readonly context: WebGLRenderingContext

  private vertexShader: WebGLShader
  private fragmentShader: WebGLShader

  private program: WebGLProgram

  private vertexVbo: WebGLBuffer
  private colorVbo: WebGLBuffer

  private width: number
  private height: number

  public constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('webgl')

    this.width = canvas.width
    this.height = canvas.height
  }

  public clearColor() {
    this.context.clearColor(0, 0, 0, 1)
    this.context.clearDepth(1.0)
    this.context.clear(
      this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT
    )
  }

  public createProgram(vertexShaderId: string, fragmentShaderId: string) {
    const program = this.context.createProgram()
    this.vertexShader = this.createShader(vertexShaderId, ShaderType.Vertex)
    this.fragmentShader = this.createShader(
      fragmentShaderId,
      ShaderType.Fragment
    )

    this.context.attachShader(program, this.vertexShader)
    this.context.attachShader(program, this.fragmentShader)
    this.context.linkProgram(program)

    if (this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
      // プログラムオブジェクトの有効か
      this.context.useProgram(program)
      this.program = program
    } else {
      const programLog = this.context.getProgramInfoLog(program)
      throw new Error(programLog)
    }
  }

  public setPositionAndColor(positions: number[], colors: number[]) {
    this.setPositions(positions)
    this.setColors(colors)
  }

  private setPositions(positions: number[]) {
    const vPositionBuffer = this.createVbo(positions)
    const vAttLocation = this.context.getAttribLocation(
      this.program,
      'position'
    )
    const vStride = 3

    this.context.bindBuffer(this.context.ARRAY_BUFFER, vPositionBuffer)
    this.context.enableVertexAttribArray(vAttLocation)
    this.context.vertexAttribPointer(
      vAttLocation,
      vStride,
      this.context.FLOAT,
      false,
      0,
      0
    )
  }

  private setColors(colors: number[]) {
    const vColorBuffer = this.createVbo(colors)
    const vAttLocation = this.context.getAttribLocation(this.program, 'color')
    const vStride = 4

    this.context.bindBuffer(this.context.ARRAY_BUFFER, vColorBuffer)
    this.context.enableVertexAttribArray(vAttLocation)
    this.context.vertexAttribPointer(
      vAttLocation,
      vStride,
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

  private createShader(id: string, shaderType: ShaderType): WebGLShader {
    let shader: WebGLShader
    const scriptElement = document.getElementById(id) as HTMLScriptElement

    if (!scriptElement) {
      throw new Error('Script Element invalid')
    }

    switch (shaderType) {
      case ShaderType.Vertex:
        shader = this.context.createShader(this.context.VERTEX_SHADER)
        break
      case ShaderType.Fragment:
        shader = this.context.createShader(this.context.FRAGMENT_SHADER)
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

  private createVbo(data: number[]): WebGLBuffer {
    const vbo = this.context.createBuffer()
    this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo)
    this.context.bufferData(
      this.context.ARRAY_BUFFER,
      new Float32Array(data),
      this.context.STATIC_DRAW
    )
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null)
    return vbo
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
  app.createProgram('vs', 'fs')

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

  // app.setPositions(vertexPositions)
  app.setPositionAndColor(vertexPositions, vertexColor)

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
