"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Matrix_1 = require("./Matrix");
const Quaternion_1 = require("./Quaternion");
var ShaderType;
(function (ShaderType) {
    ShaderType[ShaderType["Vertex"] = 0] = "Vertex";
    ShaderType[ShaderType["Fragment"] = 1] = "Fragment";
})(ShaderType || (ShaderType = {}));
class AppMain {
    constructor(canvas) {
        this.count = 0;
        this.indexCount = 0;
        this.context = canvas.getContext('webgl');
        this.width = canvas.width;
        this.height = canvas.height;
        this.context.enable(this.context.CULL_FACE);
        this.context.enable(this.context.DEPTH_TEST);
        this.context.depthFunc(this.context.LEQUAL);
        this.context.activeTexture(this.context.TEXTURE0);
        this.context.activeTexture(this.context.TEXTURE1);
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
    setQuad() {
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
        ];
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
        ];
        const indices = [0, 2, 1, 3, 1, 2];
        const textureCoords = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
        this.indexCount = indices.length;
        this.setVertices(vertices);
        this.setColors(colors);
        this.setTextureCoords(textureCoords);
        this.setIndices(indices);
    }
    createTexture(source, unitNumber) {
        const img = new Image();
        img.onload = () => {
            const tex = this.context.createTexture();
            this.context.bindTexture(this.context.TEXTURE_2D, tex);
            this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, img);
            this.context.generateMipmap(this.context.TEXTURE_2D);
            this.context.bindTexture(this.context.TEXTURE_2D, null);
            switch (unitNumber) {
                case 0:
                    this.texture0 = tex;
                    break;
                case 1:
                    this.texture1 = tex;
                    break;
                default:
                    break;
            }
        };
        img.src = source;
    }
    setTexture() {
        const uniLocation0 = this.context.getUniformLocation(this.program, 'texture0');
        const uniLocation1 = this.context.getUniformLocation(this.program, 'texture1');
        this.context.activeTexture(this.context.TEXTURE0);
        this.context.bindTexture(this.context.TEXTURE_2D, this.texture0);
        this.context.uniform1i(uniLocation0, 0);
        this.context.activeTexture(this.context.TEXTURE1);
        this.context.bindTexture(this.context.TEXTURE_2D, this.texture1);
        this.context.uniform1i(uniLocation1, 1);
    }
    setTorusVerticesAndIndicesAndColors(row, column, innerRad, outerRad) {
        const vertices = new Array();
        const colors = new Array();
        const indices = new Array();
        const normals = new Array();
        for (let i = 0; i <= row; i++) {
            const r = ((Math.PI * 2) / row) * i;
            const rr = Math.cos(r);
            const ry = Math.sin(r);
            for (let ii = 0; ii <= column; ii++) {
                const tr = ((Math.PI * 2) / column) * ii;
                const tx = (rr * innerRad + outerRad) * Math.cos(tr);
                const ty = ry * innerRad;
                const tz = (rr * innerRad + outerRad) * Math.sin(tr);
                const rx = rr * Math.cos(tr);
                const rz = rr * Math.sin(tr);
                vertices.push(tx, ty, tz);
                normals.push(rx, ry, rz);
                const tc = this.hsva((360.0 / column) * ii, 1, 1, 1);
                tc.forEach(c => colors.push(c));
            }
        }
        for (let i = 0; i < row; i++) {
            for (let ii = 0; ii < column; ii++) {
                const r = (column + 1) * i + ii;
                indices.push(r, r + column + 1, r + 1);
                indices.push(r + column + 1, r + column + 2, r + 1);
            }
        }
        this.indexCount = indices.length;
        this.setVertices(vertices);
        this.setNormals(normals);
        this.setColors(colors);
        this.setIndices(indices);
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
        const modelMatrixUniLocation = this.context.getUniformLocation(this.program, 'mMatrix');
        this.context.uniformMatrix4fv(modelMatrixUniLocation, false, this.modelMatrix);
        this.bindModelInverseMatrix();
    }
    setDirectionLight(lightDir) {
        this.directionLightDir = lightDir;
        const uniLocation = this.context.getUniformLocation(this.program, 'lightDirection');
        this.context.uniform3fv(uniLocation, this.directionLightDir);
    }
    setPointLight(lightPos) {
        const uniLocation = this.context.getUniformLocation(this.program, 'lightPosition');
        this.context.uniform3fv(uniLocation, lightPos);
    }
    setAmbientLight(lightDir) {
        this.ambientLightDir = lightDir;
        const uniLocation = this.context.getUniformLocation(this.program, 'ambientColor');
        this.context.uniform4fv(uniLocation, this.ambientLightDir);
    }
    setViewDirection(viewDir) {
        this.viewDir = viewDir;
        const uniLocation = this.context.getUniformLocation(this.program, 'eyeDirection');
        this.context.uniform3fv(uniLocation, this.viewDir);
    }
    bindModelInverseMatrix() {
        const invMatrix = Matrix_1.default.identity(Matrix_1.default.create());
        Matrix_1.default.inverse(this.modelMatrix, invMatrix);
        const uniLocation = this.context.getUniformLocation(this.program, 'invMatrix');
        this.context.uniformMatrix4fv(uniLocation, false, invMatrix);
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
        this.context.drawElements(this.context.TRIANGLES, this.indexCount, this.context.UNSIGNED_SHORT, 0);
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
    setTextureCoords(textureCoords) {
        const vTextureCoordBuffer = this.createVbo(textureCoords);
        const vAttLocation = this.context.getAttribLocation(this.program, 'textureCoord');
        const vStride = 2;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vTextureCoordBuffer);
        this.context.enableVertexAttribArray(vAttLocation);
        this.context.vertexAttribPointer(vAttLocation, vStride, this.context.FLOAT, false, 0, 0);
    }
    setNormals(normals) {
        const vNormalsBuffer = this.createVbo(normals);
        const vAttLocation = this.context.getAttribLocation(this.program, 'normal');
        const vStride = 3;
        this.context.bindBuffer(this.context.ARRAY_BUFFER, vNormalsBuffer);
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
        if (s == 0) {
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
    c.height = 500;
    const app = new AppMain(c);
    app.clearColor();
    app.createProgram('vs', 'fs');
    app.setTorusVerticesAndIndicesAndColors(64, 64, 0.5, 1.5);
    const mMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const pMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    const vpMatrix = Matrix_1.default.identity(Matrix_1.default.create());
    Matrix_1.default.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    // 光源方向ベクトル
    // const lightDir = [-0.5, 0.5, 0.5]
    // app.setDirectionLight(lightDir)
    const lightPos = [4, 4, 9];
    app.setPointLight(lightPos);
    // アンビエントライト
    const ambientLightColor = [0.1, 0.1, 0.1, 1.0];
    app.setAmbientLight(ambientLightColor);
    app.setViewDirection([0.0, 0.0, 20.0]);
    const cameraPosition = new Float32Array([0.0, 0.0, 10.0]);
    const cameraUpVec = new Float32Array([0.0, 1.0, 0.0]);
    const quaternion = Quaternion_1.default.identity(Quaternion_1.default.create());
    c.addEventListener('mousemove', (event) => {
        const cw = c.width;
        const ch = c.height;
        // 対角線の長さの逆数
        const wh = 1 / Math.sqrt(cw * cw + ch * ch);
        // マウス座標をcanvasの中心に補正する
        let x = event.clientX - c.offsetLeft - cw * 0.5;
        let y = event.clientY - c.offsetTop - ch * 0.5;
        // canvasの中心からマウス座標までの距離
        let sq = Math.sqrt(x * x + y * y);
        const r = sq * 2.0 * Math.PI * wh;
        if (sq != 1) {
            sq = 1 / sq;
            // -1 〜 1の間に正規化
            x *= sq;
            y *= sq;
        }
        Quaternion_1.default.rotate(r, [y, x, 0.0], quaternion);
    }, true);
    app.startRender(() => {
        app.clearColor();
        const count = app.currentCount;
        Matrix_1.default.lookAt(cameraPosition, new Float32Array([0, 0, 0]), cameraUpVec, vMatrix);
        Matrix_1.default.multiply(pMatrix, vMatrix, vpMatrix);
        app.setViewProjectionMatrix(vpMatrix);
        Matrix_1.default.identity(mMatrix);
        const qMatrix = Matrix_1.default.identity(Matrix_1.default.create());
        Quaternion_1.default.toMatIV(quaternion, qMatrix);
        Matrix_1.default.multiply(mMatrix, qMatrix, mMatrix);
        app.setModelMatrix(mMatrix);
        app.draw();
    });
};
//# sourceMappingURL=index.js.map