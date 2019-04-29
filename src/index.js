"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Matrix_1 = require("./Matrix");
var ShaderType;
(function (ShaderType) {
    ShaderType[ShaderType["Vertex"] = 0] = "Vertex";
    ShaderType[ShaderType["Fragment"] = 1] = "Fragment";
})(ShaderType || (ShaderType = {}));
class AppMain {
    constructor(canvas) {
        this.count = 0;
        this.context = canvas.getContext('webgl');
        this.width = canvas.width;
        this.height = canvas.height;
    }
    clearColor() {
        this.context.clearColor(0, 0, 0, 1);
        this.context.clearDepth(1.0);
        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    }
    createProgram(vertexShaderId, fragmentShaderId) {
        const program = this.context.createProgram();
        this.vertexShader = this.createShader(vertexShaderId, ShaderType.Vertex);
        this.fragmentShader = this.createShader(fragmentShaderId, ShaderType.Fragment);
        this.context.attachShader(program, this.vertexShader);
        this.context.attachShader(program, this.fragmentShader);
        this.context.linkProgram(program);
        if (this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
            // プログラムオブジェクトの有効か
            this.context.useProgram(program);
            this.program = program;
        }
        else {
            const programLog = this.context.getProgramInfoLog(program);
            throw new Error(programLog);
        }
    }
    setVerticesAndColor(vertices, colors) {
        this.setVertices(vertices);
        this.setColors(colors);
    }
    setViewProjectionMatrix(matrix) {
        this.viewProjectionMatrix = matrix;
    }
    setModelMatrix(matrix) {
        this.modelMatrix = matrix;
        const mvpMatrix = Matrix_1.default.identity(Matrix_1.default.create());
        Matrix_1.default.multiply(this.viewProjectionMatrix, this.modelMatrix, mvpMatrix);
        const uniLocation = this.context.getUniformLocation(this.program, 'mvpMatrix');
        this.context.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    }
    get currentCount() {
        return this.count;
    }
    startRender(update) {
        setInterval(() => {
            this.count++;
            update();
        }, 1000 / 30);
    }
    draw() {
        this.context.drawArrays(this.context.TRIANGLES, 0, 3);
    }
    createShader(id, shaderType) {
        let shader;
        const scriptElement = document.getElementById(id);
        if (!scriptElement) {
            throw new Error('Script Element invalid');
        }
        switch (shaderType) {
            case ShaderType.Vertex:
                shader = this.context.createShader(this.context.VERTEX_SHADER);
                break;
            case ShaderType.Fragment:
                shader = this.context.createShader(this.context.FRAGMENT_SHADER);
                break;
        }
        this.context.shaderSource(shader, scriptElement.text);
        this.context.compileShader(shader);
        if (this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
            return shader;
        }
        else {
            const compileLog = this.context.getShaderInfoLog(shader);
            throw new Error(compileLog);
        }
    }
    createVbo(data) {
        const vbo = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(data), this.context.STATIC_DRAW);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
        return vbo;
    }
    setVertices(positions) {
        const vPositionBuffer = this.createVbo(positions);
        const vAttLocation = this.context.getAttribLocation(this.program, 'position');
        const vStride = 3;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vPositionBuffer);
        this.context.enableVertexAttribArray(vAttLocation);
        this.context.vertexAttribPointer(vAttLocation, vStride, this.context.FLOAT, false, 0, 0);
    }
    setColors(colors) {
        const vColorBuffer = this.createVbo(colors);
        const vAttLocation = this.context.getAttribLocation(this.program, 'color');
        const vStride = 4;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vColorBuffer);
        this.context.enableVertexAttribArray(vAttLocation);
        this.context.vertexAttribPointer(vAttLocation, vStride, this.context.FLOAT, false, 0, 0);
    }
}
onload = () => {
    const c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
    const app = new AppMain(c);
    app.clearColor();
    app.createProgram('vs', 'fs');
    const vertexPositions = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0];
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
    ];
    app.setVerticesAndColor(vertexPositions, vertexColor);
    const mMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const pMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vpMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    Matrix_1.default.lookAt(new Float32Array([0.0, 1.0, 3.0]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]), vMatrix);
    Matrix_1.default.perspective(60, c.width / c.height, 0.1, 100, pMatrix);
    // ビュープロジェクション行列
    Matrix_1.default.multiply(pMatrix, vMatrix, vpMatrix);
    app.setViewProjectionMatrix(vpMatrix);
    app.startRender(() => {
        app.clearColor();
        const count = app.currentCount;
        const rad = ((count % 360) * Math.PI) / 180;
        const x = Math.cos(rad);
        const y = Math.sin(rad);
        Matrix_1.default.identity(mMatrix);
        Matrix_1.default.translate(mMatrix, new Float32Array([x, y + 1.0, 0.0]), mMatrix);
        app.setModelMatrix(mMatrix);
        app.draw();
        Matrix_1.default.identity(mMatrix);
        Matrix_1.default.translate(mMatrix, new Float32Array([1.0, -1.0, 0.0]), mMatrix);
        Matrix_1.default.rotate(mMatrix, rad, new Float32Array([0, 1, 0]), mMatrix);
        app.setModelMatrix(mMatrix);
        app.draw();
        Matrix_1.default.identity(mMatrix);
        const scaleFactor = Math.sin(rad) + 1.0;
        Matrix_1.default.translate(mMatrix, new Float32Array([-1.0, -1.0, 0]), mMatrix);
        Matrix_1.default.scale(mMatrix, new Float32Array([scaleFactor, scaleFactor, 0]), mMatrix);
    });
};
//# sourceMappingURL=index.js.map