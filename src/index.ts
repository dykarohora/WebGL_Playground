class AppMain {
  private readonly context: WebGLRenderingContext

  public constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('webgl')
  }

  public clearColor() {
    this.context.clearColor(0, 0, 0, 1)
    this.context.clear(this.context.COLOR_BUFFER_BIT)
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
        break
      case 'x-shader/x-fragment':
        shader = this.context.createShader(this.context.FRAGMENT_SHADER)
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
      return program
    } else {
      const programLog = this.context.getProgramInfoLog(program)
      throw new Error(programLog)
    }
  }

  public createVBO(data): WebGLBuffer {
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

  const vertexShader = app.createShader('vs')
  const fragmentShader = app.createShader('fs')

  const program = app.createProgram(vertexShader, fragmentShader)
}
