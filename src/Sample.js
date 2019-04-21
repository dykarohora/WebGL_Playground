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
    createVBO(vertices, colors) {
        const vertexVbo = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vertexVbo);
        this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(vertices), this.context.STATIC_DRAW);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
        this.vertexVbo = vertexVbo;
        const colorVbo = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, colorVbo);
        this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(colors), this.context.STATIC_DRAW);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
        this.colorVbo = colorVbo;
        return vertexVbo;
    }
    bindVBO() {
        const attLocation = new Array(2);
        attLocation[0] = this.context.getAttribLocation(this.program, 'position');
        attLocation[1] = this.context.getAttribLocation(this.program, 'color');
        const attStride = new Array(2);
        attStride[0] = 3;
        attStride[1] = 4;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexVbo);
        this.context.enableVertexAttribArray(attLocation[0]);
        this.context.vertexAttribPointer(attLocation[0], attStride[0], this.context.FLOAT, false, 0, 0);
        this.context.bindBuffer(this.context.ARRAY_BUFFER, this.colorVbo);
        this.context.enableVertexAttribArray(attLocation[1]);
        this.context.vertexAttribPointer(attLocation[1], attStride[1], this.context.FLOAT, false, 0, 0);
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
    app.createProgram(vertexShader, fragmentShader);
    const vertexPositions = [1.0, 1.0, 0.0, 1.0, 0.0, 0.0, -3.0, 0.0, 0.0];
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
    app.createVBO(vertexPositions, vertexColor);
    app.bindVBO();
    const mMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const pMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const mvpMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    Matrix_1.default.lookAt(new Float32Array([1.0, 1.0, 1.0]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]), vMatrix);
    Matrix_1.default.perspective(90, c.width / c.height, 0.1, 100, pMatrix);
    Matrix_1.default.multiply(pMatrix, vMatrix, mvpMatrix);
    Matrix_1.default.multiply(mvpMatrix, mMatrix, mvpMatrix);
    app.bindMVP(mvpMatrix);
    app.draw();
};
//# sourceMappingURL=Sample.js.map