import { mat4, vec3 } from "./gl-matrix-es6.js";
import { gl, program } from "./tanks.js";
const gravity = -1.0;
export class Shell {
    constructor(position, velocity, boomRadius, size) {
        this.color = vec3.fromValues(1, 1, 1);
        this.position = position;
        this.velocity = velocity;
        this.boomRadius = boomRadius;
        this.size = size;
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.transformMatrix = mat4.create();
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 0, 0, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aNormal"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    tick(dT) {
        var seconds = dT / 1000;
        vec3.add(this.position, this.position, vec3.scale(vec3.create(), this.velocity, seconds));
        vec3.add(this.velocity, this.velocity, vec3.fromValues(0, 0, gravity * seconds));
    }
    draw() {
        console.log("shell pos: ", this.position);
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        mat4.translate(this.transformMatrix, mat4.create(), this.position);
        var normalMat = mat4.create();
        mat4.invert(normalMat, this.transformMatrix);
        mat4.transpose(normalMat, normalMat);
        var normalMatLoc = gl.getUniformLocation(program, "normalMat");
        gl.uniformMatrix4fv(normalMatLoc, false, normalMat);
        gl.uniform1f(gl.getUniformLocation(program, "pointSize"), this.size);
        gl.uniform3fv(gl.getUniformLocation(program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, new Float32Array(this.transformMatrix));
        gl.drawArrays(gl.POINTS, 0, 1);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}
