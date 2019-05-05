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

  private width: number
  private height: number

  private viewProjectionMatrix: Float32Array
  private modelMatrix: Float32Array

  private directionLightDir: number[]
  private ambientLightDir: number[]
  private viewDir: number[]

  private count: number = 0
  private indexCount: number = 0

  private texture: WebGLTexture

  public constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('webgl')

    this.width = canvas.width
    this.height = canvas.height

    this.context.enable(this.context.CULL_FACE)
    this.context.enable(this.context.DEPTH_TEST)
    this.context.depthFunc(this.context.LEQUAL)
    this.context.activeTexture(this.context.TEXTURE0)
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

  public setQuad() {
    const vertices = [
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

    const colors = [
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0
    ]

    const indices = [0, 2, 1, 3, 1, 2]

    const textureCoords = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]

    this.indexCount = indices.length
    this.setVertices(vertices)
    this.setColors(colors)
    this.setTextureCoords(textureCoords)
    this.setIndices(indices)
  }

  public createTexture(source: string) {
    const img = new Image()
    img.onload = (): void => {
      const tex = this.context.createTexture()
      this.context.bindTexture(this.context.TEXTURE_2D, tex)
      this.context.texImage2D(
        this.context.TEXTURE_2D,
        0,
        this.context.RGBA,
        this.context.RGBA,
        this.context.UNSIGNED_BYTE,
        img
      )
      this.context.generateMipmap(this.context.TEXTURE_2D)
      this.context.bindTexture(this.context.TEXTURE_2D, null)
      this.texture = tex
    }

    img.src = source
  }

  public setTexture() {
    const uniLocation = this.context.getUniformLocation(this.program, 'texture')
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture)
    this.context.uniform1i(uniLocation, 0)
  }

  public setTorusVerticesAndIndicesAndColors(
    row: number,
    column: number,
    innerRad: number,
    outerRad: number
  ) {
    const vertices = new Array<number>()
    const colors = new Array<number>()
    const indices = new Array<number>()
    const normals = new Array<number>()

    for (let i = 0; i <= row; i++) {
      const r = ((Math.PI * 2) / row) * i
      const rr = Math.cos(r)
      const ry = Math.sin(r)
      for (let ii = 0; ii <= column; ii++) {
        const tr = ((Math.PI * 2) / column) * ii
        const tx = (rr * innerRad + outerRad) * Math.cos(tr)
        const ty = ry * innerRad
        const tz = (rr * innerRad + outerRad) * Math.sin(tr)
        const rx = rr * Math.cos(tr)
        const rz = rr * Math.sin(tr)
        vertices.push(tx, ty, tz)
        normals.push(rx, ry, rz)
        const tc = this.hsva((360.0 / column) * ii, 1, 1, 1)
        tc.forEach(c => colors.push(c))
      }
    }

    for (let i = 0; i < row; i++) {
      for (let ii = 0; ii < column; ii++) {
        const r = (column + 1) * i + ii
        indices.push(r, r + column + 1, r + 1)
        indices.push(r + column + 1, r + column + 2, r + 1)
      }
    }
    this.indexCount = indices.length
    this.setVertices(vertices)
    this.setNormals(normals)
    this.setColors(colors)
    this.setIndices(indices)
  }

  public setVerticesAndIndicesAndColors(
    vertices: number[],
    indices: number[],
    colors: number[]
  ) {
    this.setVertices(vertices)
    this.setColors(colors)
    this.setIndices(indices)
  }

  public setViewProjectionMatrix(matrix: Float32Array) {
    this.viewProjectionMatrix = matrix
  }

  public setModelMatrix(matrix: Float32Array): void {
    this.modelMatrix = matrix
    const mvpMatrix = Matrix.identity(Matrix.create())
    Matrix.multiply(this.viewProjectionMatrix, this.modelMatrix, mvpMatrix)

    const uniLocation = this.context.getUniformLocation(
      this.program,
      'mvpMatrix'
    )
    this.context.uniformMatrix4fv(uniLocation, false, mvpMatrix)

    const modelMatrixUniLocation = this.context.getUniformLocation(
      this.program,
      'mMatrix'
    )
    this.context.uniformMatrix4fv(
      modelMatrixUniLocation,
      false,
      this.modelMatrix
    )
    this.bindModelInverseMatrix()
  }

  public setDirectionLight(lightDir: number[]): void {
    this.directionLightDir = lightDir

    const uniLocation = this.context.getUniformLocation(
      this.program,
      'lightDirection'
    )
    this.context.uniform3fv(uniLocation, this.directionLightDir)
  }

  public setPointLight(lightPos: number[]): void {
    const uniLocation = this.context.getUniformLocation(
      this.program,
      'lightPosition'
    )
    this.context.uniform3fv(uniLocation, lightPos)
  }

  public setAmbientLight(lightDir: number[]): void {
    this.ambientLightDir = lightDir

    const uniLocation = this.context.getUniformLocation(
      this.program,
      'ambientColor'
    )
    this.context.uniform4fv(uniLocation, this.ambientLightDir)
  }

  public setViewDirection(viewDir: number[]) {
    this.viewDir = viewDir

    const uniLocation = this.context.getUniformLocation(
      this.program,
      'eyeDirection'
    )
    this.context.uniform3fv(uniLocation, this.viewDir)
  }

  private bindModelInverseMatrix() {
    const invMatrix = Matrix.identity(Matrix.create())
    Matrix.inverse(this.modelMatrix, invMatrix)
    const uniLocation = this.context.getUniformLocation(
      this.program,
      'invMatrix'
    )
    this.context.uniformMatrix4fv(uniLocation, false, invMatrix)
  }

  public get currentCount(): number {
    return this.count
  }

  public startRender(update: () => void): void {
    setInterval((): void => {
      this.count++
      update()
    }, 1000 / 30)
  }

  public draw(): void {
    // this.context.drawArrays(this.context.TRIANGLES, 0, 3)
    this.context.drawElements(
      this.context.TRIANGLES,
      this.indexCount,
      this.context.UNSIGNED_SHORT,
      0
    )
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

  private setVertices(positions: number[]): void {
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

  private setTextureCoords(textureCoords: number[]): void {
    const vTextureCoordBuffer = this.createVbo(textureCoords)
    const vAttLocation = this.context.getAttribLocation(
      this.program,
      'textureCoord'
    )
    const vStride = 2
    this.context.bindBuffer(this.context.ARRAY_BUFFER, vTextureCoordBuffer)
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

  private setNormals(normals: number[]): void {
    const vNormalsBuffer = this.createVbo(normals)
    const vAttLocation = this.context.getAttribLocation(this.program, 'normal')
    const vStride = 3
    this.context.bindBuffer(this.context.ARRAY_BUFFER, vNormalsBuffer)
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

  private setIndices(indices: number[]): void {
    const indexBuffer = this.createIbo(indices)
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, indexBuffer)
  }

  private setColors(colors: number[]): void {
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

  private hsva(h: number, s: number, v: number, a: number): number[] {
    if (s > 1 || v > 1 || a > 1) {
      throw new Error('invalid arguments')
    }

    const th = h % 360
    const i = Math.floor(th / 60)
    const f = th / 60 - i
    const m = v * (1 - s)
    const n = v * (1 - s * f)
    const k = v * (1 - s * (1 - f))
    const color = new Array<number>()
    if (s == 0) {
      color.push(v, v, v, a)
    } else {
      const r = new Array<number>(v, n, m, m, k, v)
      const g = new Array<number>(k, v, v, n, m, m)
      const b = new Array<number>(m, m, k, v, v, n)
      color.push(r[i], g[i], b[i], a)
    }
    return color
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

  app.setQuad()
  app.createTexture('/hana.png')
  // app.setTorusVerticesAndIndicesAndColors(64, 64, 2.0, 5.0)

  const mMatrix = Matrix.identity(Matrix.create())
  const vMatrix = Matrix.identity(Matrix.create())
  const pMatrix = Matrix.identity(Matrix.create())
  const vpMatrix = Matrix.identity(Matrix.create())

  Matrix.lookAt(
    new Float32Array([0.0, 1.0, 5.0]),
    new Float32Array([0, 0, 0]),
    new Float32Array([0, 1, 0]),
    vMatrix
  )

  Matrix.perspective(45, c.width / c.height, 0.1, 100, pMatrix)
  // ビュープロジェクション行列
  Matrix.multiply(pMatrix, vMatrix, vpMatrix)
  app.setViewProjectionMatrix(vpMatrix)
  // 光源方向ベクトル
  // const lightDir = [-0.5, 0.5, 0.5]
  // app.setDirectionLight(lightDir)
  const lightPos = [4, 4, 9]
  app.setPointLight(lightPos)
  // アンビエントライト
  const ambientLightColor = [0.1, 0.1, 0.1, 1.0]
  app.setAmbientLight(ambientLightColor)

  app.setViewDirection([0.0, 0.0, 20.0])

  app.startRender(() => {
    app.clearColor()
    const count = app.currentCount
    const rad = ((count % 360) * Math.PI * 2) / 180

    Matrix.identity(mMatrix)
    // Matrix.rotate(mMatrix, rad, new Float32Array([0, 1, 1]), mMatrix)

    app.setModelMatrix(mMatrix)
    app.setTexture()
    app.draw()
  })
}
