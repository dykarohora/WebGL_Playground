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
        // シェーダーのアタッチ
        this.vertexShader = this.createShader(vertexShaderId, ShaderType.Vertex);
        this.fragmentShader = this.createShader(fragmentShaderId, ShaderType.Fragment);
        this.program = this.context.createProgram();
        this.context.attachShader(this.program, this.vertexShader);
        this.context.attachShader(this.program, this.fragmentShader);
        this.context.linkProgram(this.program);
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
    setPositions(positions) {
        const vPositionBuffer = this.createVbo(positions);
        const vAttLocation = this.context.getAttribLocation(this.program, 'position');
        const vStride = 3;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vPositionBuffer);
        this.context.enableVertexAttribArray(vAttLocation);
        this.context.vertexAttribPointer(vAttLocation, vStride, this.context.FLOAT, false, 0, 0);
    }
    bindMVP(mvpMatrix) {
        const uniLocation = this.context.getUniformLocation(this.program, 'mvpMatrix');
        this.context.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    }
    draw() {
        this.context.drawArrays(this.context.TRIANGLES, 0, 3);
        this.context.flush();
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
    app.setPositions(vertexPositions);
    const mMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const pMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const mvpMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    Matrix_1.default.lookAt(new Float32Array([0.0, 1.0, 3.0]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]), vMatrix);
    Matrix_1.default.perspective(60, c.width / c.height, 0.1, 100, pMatrix);
    Matrix_1.default.multiply(pMatrix, vMatrix, mvpMatrix);
    Matrix_1.default.multiply(mvpMatrix, mMatrix, mvpMatrix);
    app.bindMVP(mvpMatrix);
    app.draw();
};
//# sourceMappingURL=index.js.map