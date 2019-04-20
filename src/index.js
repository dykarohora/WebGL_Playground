"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Matrix_1 = require("./Matrix");
class AppMain {
    constructor(canvas) {
        this.context = canvas.getContext('webgl');
    }
    clearColor() {
        this.context.clearColor(0, 0, 0, 1);
        this.context.clearDepth(1.0);
        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    }
    createShader(id) {
        let shader;
        const scriptElement = document.getElementById(id);
        if (!scriptElement) {
            return;
        }
        switch (scriptElement.type) {
            case 'x-shader/x-vertex':
                shader = this.context.createShader(this.context.VERTEX_SHADER);
                this.vertexShader = shader;
                break;
            case 'x-shader/x-fragment':
                shader = this.context.createShader(this.context.FRAGMENT_SHADER);
                this.fragmentShader = shader;
                break;
            default:
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
    createProgram(vs, fs) {
        const program = this.context.createProgram();
        // シェーダーのアタッチ
        this.context.attachShader(program, vs);
        this.context.attachShader(program, fs);
        // 2つのシェーダーをリンク
        this.context.linkProgram(program);
        if (this.context.getProgramParameter(program, this.context.LINK_STATUS)) {
            // プログラムオブジェクトの有効か
            this.context.useProgram(program);
            this.program = program;
            return program;
        }
        else {
            const programLog = this.context.getProgramInfoLog(program);
            throw new Error(programLog);
        }
    }
    createVBO(data) {
        const vbo = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(data), this.context.STATIC_DRAW);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        return vbo;
    }
    bindVBO(vbo) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vbo);
        const attLocation = this.context.getAttribLocation(this.program, 'position');
        const stride = 3;
        this.context.enableVertexAttribArray(attLocation);
        this.context.vertexAttribPointer(attLocation, stride, this.context.FLOAT, false, 0, 0);
    }
    bindMVP(mvpMatrix) {
        const uniLocation = this.context.getUniformLocation(this.program, 'mvpMatrix');
        this.context.uniformMatrix4fv(uniLocation, false, mvpMatrix);
    }
    draw() {
        this.context.drawArrays(this.context.TRIANGLES, 0, 3);
        this.context.flush();
    }
}
onload = () => {
    const c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
    const app = new AppMain(c);
    app.clearColor();
    const vertexShader = app.createShader('vs');
    const fragmentShader = app.createShader('fs');
    const program = app.createProgram(vertexShader, fragmentShader);
    const vertexPositions = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0];
    const vbo = app.createVBO(vertexPositions);
    app.bindVBO(vbo);
    const mMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const pMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const mvpMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    Matrix_1.default.lookAt(new Float32Array([0.0, 1.0, 3.0]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]), vMatrix);
    Matrix_1.default.perspective(90, c.width / c.height, 0.1, 100, pMatrix);
    Matrix_1.default.multiply(pMatrix, vMatrix, mvpMatrix);
    Matrix_1.default.multiply(mvpMatrix, mMatrix, mvpMatrix);
    app.bindVBO(mvpMatrix);
    app.draw();
};
//# sourceMappingURL=index.js.map