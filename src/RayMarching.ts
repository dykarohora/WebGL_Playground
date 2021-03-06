enum ShaderType {
  Vertex,
  Fragment
}

class App {
  private readonly context: WebGLRenderingContext

  private vertexShader: WebGLShader
  private fragmentShader: WebGLShader

  private program: WebGLProgram

  private uniLocations: WebGLUniformLocation[] = []

  private startTime: number
  private tempTime: number
  private time: number
  private fps: number

  private width: number
  private height: number

  private mouseX: number
  private mouseY: number

  public constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('webgl')
    this.startTime = new Date().getTime()
    this.time = 0
    this.tempTime = 0
    this.fps = 1000 / 30
    this.width = canvas.width
    this.height = canvas.height
    this.mouseX = 0.5
    this.mouseY = 0.5

    canvas.addEventListener('mousemove', this.mouseMove.bind(this), true)
  }

  public createProgram(vertexShaderId: string, fragmentShaderid: string) {
    this.vertexShader = this.createShader(vertexShaderId, ShaderType.Vertex)
    this.fragmentShader = this.createShader(
      fragmentShaderid,
      ShaderType.Fragment
    )

    this.program = this.context.createProgram()
    this.context.attachShader(this.program, this.vertexShader)
    this.context.attachShader(this.program, this.fragmentShader)
    this.context.linkProgram(this.program)

    if (
      this.context.getProgramParameter(this.program, this.context.LINK_STATUS)
    ) {
      this.context.useProgram(this.program)

      this.uniLocations[0] = this.context.getUniformLocation(
        this.program,
        'time'
      )
      this.uniLocations[1] = this.context.getUniformLocation(
        this.program,
        'mouse'
      )
      this.uniLocations[2] = this.context.getUniformLocation(
        this.program,
        'resolution'
      )
    } else {
      const programLog = this.context.getProgramInfoLog(this.program)
      throw new Error(programLog)
    }
  }

  public setPositionAndIndex(positions: number[], indices: number[]) {
    const vPosition = this.createVbo(positions)
    const vIndex = this.createIbo(indices)

    const vAttLocation = this.context.getAttribLocation(
      this.program,
      'position'
    )

    this.context.bindBuffer(this.context.ARRAY_BUFFER, vPosition)
    this.context.enableVertexAttribArray(vAttLocation)
    this.context.vertexAttribPointer(
      vAttLocation,
      3,
      this.context.FLOAT,
      false,
      0,
      0
    )
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, vIndex)
  }

  public render() {
    this.time = (new Date().getTime() - this.startTime) * 0.001

    this.context.clearColor(0, 0, 0, 1)
    this.context.clear(this.context.COLOR_BUFFER_BIT)

    this.context.uniform1f(this.uniLocations[0], this.time + this.tempTime)
    this.context.uniform2fv(this.uniLocations[1], [this.mouseX, this.mouseY])
    this.context.uniform2fv(this.uniLocations[2], [this.width, this.height])

    this.context.drawElements(
      this.context.TRIANGLES,
      6,
      this.context.UNSIGNED_SHORT,
      0
    )
    this.context.flush()
    setTimeout(this.render.bind(this), this.fps)
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

  private createIbo(data: number[]): WebGLBuffer {
    const ibo = this.context.createBuffer()
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, ibo)
    this.context.bufferData(
      this.context.ELEMENT_ARRAY_BUFFER,
      new Int16Array(data),
      this.context.STATIC_DRAW
    )
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, null)
    return ibo
  }

  private mouseMove(e: MouseEvent) {
    this.mouseX = e.offsetX / this.width
    this.mouseY = e.offsetY / this.height
  }
}

window.onload = () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  canvas.width = 1024
  canvas.height = 1024

  const app = new App(canvas)
  app.createProgram('vs', 'fs')

  const position = [
    -1.0,
    1.0,
    0.0,
    1.0,
    1.0,
    0.0,
    -1.0,
    -1.0,
    0.0,
    1.0,
    -1.0,
    0.0
  ]
  const index = [0, 2, 1, 1, 2, 3]

  app.setPositionAndIndex(position, index)
  app.render()
}
