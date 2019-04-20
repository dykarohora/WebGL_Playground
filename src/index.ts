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
}

onload = (): void => {
  const c: HTMLCanvasElement = document.getElementById(
    'canvas'
  ) as HTMLCanvasElement

  c.width = 500
  c.height = 300

  const app = new AppMain(c)
  app.clearColor()

  app.createShader('vs')
  app.createShader('fs')
}
