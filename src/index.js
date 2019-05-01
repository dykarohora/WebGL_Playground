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
        this.context.enable(this.context.CULL_FACE);
        this.context.enable(this.context.DEPTH_TEST);
        this.context.depthFunc(this.context.LEQUAL);
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
    setTorusVerticesAndIndicesAndColors(row, column, innerRad, outerRad) {
        const vertices = new Array();
        const colors = new Array();
        const indices = new Array();
        for (let i = 0; i <= row; i++) {
            const r = ((Math.PI * 2) / row) * i;
            const rr = Math.cos(r);
            const ry = Math.sin(r);
            for (let ii = 0; ii <= column; ii++) {
                const tr = ((Math.PI * 2) / column) * ii;
                const tx = (rr * innerRad + outerRad) * Math.cos(tr);
                const ty = ry * innerRad;
                const tz = (rr * innerRad + outerRad) * Math.sin(tr);
                vertices.push(tx, ty, tz);
            }
        }
    }
    setVerticesAndIndicesAndColors(vertices, indices, colors) {
        this.setVertices(vertices);
        this.setColors(colors);
        this.setIndices(indices);
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
        // this.context.drawArrays(this.context.TRIANGLES, 0, 3)
        this.context.drawElements(this.context.TRIANGLES, 6, this.context.UNSIGNED_SHORT, 0);
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
    createIbo(data) {
        const ibo = this.context.createBuffer();
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, ibo);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, new Int16Array(data), this.context.STATIC_DRAW);
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }
    setVertices(positions) {
        const vPositionBuffer = this.createVbo(positions);
        const vAttLocation = this.context.getAttribLocation(this.program, 'position');
        const vStride = 3;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vPositionBuffer);
        this.context.enableVertexAttribArray(vAttLocation);
        this.context.vertexAttribPointer(vAttLocation, vStride, this.context.FLOAT, false, 0, 0);
    }
    setIndices(indices) {
        const indexBuffer = this.createIbo(indices);
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, indexBuffer);
    }
    setColors(colors) {
        const vColorBuffer = this.createVbo(colors);
        const vAttLocation = this.context.getAttribLocation(this.program, 'color');
        const vStride = 4;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vColorBuffer);
        this.context.enableVertexAttribArray(vAttLocation);
        this.context.vertexAttribPointer(vAttLocation, vStride, this.context.FLOAT, false, 0, 0);
    }
    hsva(h, s, v, a) {
        if (s > 1 || v > 1 || a > 1) {
            throw new Error('invalid arguments');
        }
        const th = h % 360;
        const i = Math.floor(th / 60);
        const f = th / 60 - i;
        const m = v * (1 - s);
        const n = v * (1 - s * f);
        const k = v * (1 - s * (1 - f));
        const color = new Array();
        if (!(s > 0) && !(s < 0)) {
            color.push(v, v, v, a);
        }
        else {
            const r = new Array(v, n, m, m, k, v);
            const g = new Array(k, v, v, n, m, m);
            const b = new Array(m, m, k, v, v, n);
            color.push(r[i], g[i], b[i], a);
        }
        return color;
    }
}
onload = () => {
    const c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
    const app = new AppMain(c);
    app.clearColor();
    app.createProgram('vs', 'fs');
    const vertexPositions = [
        0.0,
        1.0,
        0.0,
        1.0,
        0.0,
        0.0,
        -1.0,
        0.0,
        0.0,
        0.0,
        -1.0,
        0.0
    ];
    const indices = [0, 2, 1, 1, 2, 3];
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
        1.0,
        1.0,
        1.0,
        1.0,
        1.0
    ];
    app.setVerticesAndIndicesAndColors(vertexPositions, indices, vertexColor);
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
        Matrix_1.default.translate(mMatrix, new Float32Array([x, y + 1.0, -1.0]), mMatrix);
        app.setModelMatrix(mMatrix);
        app.draw();
        Matrix_1.default.identity(mMatrix);
        const scaleFactor = Math.sin(rad) + 3.0;
        Matrix_1.default.translate(mMatrix, new Float32Array([-1.0, -1.0, 0.0]), mMatrix);
        Matrix_1.default.scale(mMatrix, new Float32Array([scaleFactor, scaleFactor, 0]), mMatrix);
        app.setModelMatrix(mMatrix);
        app.draw();
        Matrix_1.default.identity(mMatrix);
        Matrix_1.default.translate(mMatrix, new Float32Array([1.0, -1.0, -1.0]), mMatrix);
        Matrix_1.default.rotate(mMatrix, rad, new Float32Array([0, 1, 0]), mMatrix);
        app.setModelMatrix(mMatrix);
        app.draw();
    });
};
//# sourceMappingURL=index.js.map