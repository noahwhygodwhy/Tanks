import { mat4, vec3, common } from "./gl-matrix-es6.js";
import { gl, program } from "./tanks.js";
import { Barrel, barrelZOffset } from "./barrel.js";
import { pressedKeys } from "./tanks.js";
import { Shell } from "./shell.js";
const tankSpeed = 4;
function v(a, b, c) {
    return vec3.fromValues(a, b, c);
}
const bodyPoints = [
    //leftSide
    v(-1, 2, 0), v(-1, -2, 0), v(-1, -2, 0.7),
    v(-1, 2, 0), v(-1, -2, 0.7), v(-1, 2, 0.7),
    v(-1, -2, 0.7), v(-1, 1.1, 1.4), v(-1, 2, 0.7),
    v(-1, -2, 0.7), v(-1, -1.1, 1.4), v(-1, 1.1, 1.4),
    //rightSide
    v(1, 2, 0), v(1, -2, 0.7), v(1, -2, 0),
    v(1, 2, 0), v(1, 2, 0.7), v(1, -2, 0.7),
    v(1, -2, 0.7), v(1, 2, 0.7), v(1, 1.1, 1.4),
    v(1, -2, 0.7), v(1, 1.1, 1.4), v(1, -1.1, 1.4),
    //top strip
    v(-1, 2, 0), v(1, 2, 0.7), v(1, 2, 0),
    v(-1, 2, 0), v(-1, 2, 0.7), v(1, 2, 0.7),
    v(-1, 2, 0.7), v(-1, 1.1, 1.4), v(1, 1.1, 1.4),
    v(-1, 2, 0.7), v(1, 1.1, 1.4), v(1, 2, 0.7),
    v(-1, 1.1, 1.4), v(-1, -1.1, 1.4), v(1, -1.1, 1.4),
    v(-1, 1.1, 1.4), v(1, -1.1, 1.4), v(1, 1.1, 1.4),
    v(-1, -1.1, 1.4), v(-1, -2, 0.7), v(1, -2, 0.7),
    v(-1, -1.1, 1.4), v(1, -2, 0.7), v(1, -1.1, 1.4),
    v(-1, -2, 0), v(1, -2, 0), v(1, -2, 0.7),
    v(-1, -2, 0), v(1, -2, 0.7), v(-1, -2, 0.7),
    //bottom
    v(1, 2, 0), v(1, -2, 0), v(-1, -2, 0),
    v(-1, -2, 0), v(-1, 2, 0), v(1, 2, 0),
];
function scalePoints(points, scaleFactor) {
    var toReturn = Array(points.length);
    var i = 0;
    points.forEach(e => { toReturn[i++] = vec3.multiply(vec3.create(), e, vec3.fromValues(scaleFactor, scaleFactor, scaleFactor)); });
    return toReturn;
}
export function vertIt(points) {
    console.log("vert it");
    var toReturn = new Float32Array(points.length * 6);
    var index = 0;
    for (var x = 0; x < points.length; x += 3) {
        //6 poinsts at a time, two triangles, calculating the normals for each trio
        var t = [points[x], points[x + 1], points[x + 2]];
        //console.log(vec3.subtract(vec3.create(), t[0], t[1]))
        //console.log(vec3.subtract(vec3.create(), t[0], t[2]))
        var n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), t[0], t[1]), vec3.subtract(vec3.create(), t[0], t[2])));
        //console.log("normal: ", n)
        t.forEach(p => {
            toReturn[index++] = p[0];
            toReturn[index++] = p[1];
            toReturn[index++] = p[2];
            toReturn[index++] = n[0];
            toReturn[index++] = n[1];
            toReturn[index++] = n[2];
        });
    }
    return toReturn;
}
function drawVector(startingPos, vec, length, color) {
    var vao;
    var vbo;
    var points = [startingPos, vec3.add(vec3.create(), startingPos, vec3.multiply(vec3.create(), vec, vec3.fromValues(length, length, length)))];
    var vertices = new Float32Array(points.length * 6);
    var i = 0;
    points.forEach(p => {
        vertices[i++] = p[0];
        vertices[i++] = p[1];
        vertices[i++] = p[2];
        vertices[i++] = 0;
        vertices[i++] = 0;
        vertices[i++] = 1;
    });
    vao = gl.createVertexArray();
    vbo = gl.createBuffer();
    gl.uniform3fv(gl.getUniformLocation(program, "color"), new Float32Array(color));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, new Float32Array(mat4.create()));
    var normalMat = mat4.create();
    mat4.invert(normalMat, mat4.create());
    mat4.transpose(normalMat, normalMat);
    var normalMatLoc = gl.getUniformLocation(program, "normalMat");
    gl.uniformMatrix4fv(normalMatLoc, false, normalMat);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
    gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "aNormal"));
    gl.vertexAttribPointer(gl.getAttribLocation(program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
    gl.lineWidth(10);
    gl.drawArrays(gl.LINES, 0, vertices.length / 6);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
export class Tank {
    constructor(xcoord, ycoord, angle, scale, color, map) {
        this.angle = angle;
        this.map = map;
        console.log("tank get position");
        console.log("===================================");
        this.position = map.getPosition(xcoord, ycoord);
        console.log("position: ", this.position);
        console.log("===================================");
        this.up = map.getUp(xcoord, ycoord);
        console.log("up: ", this.up);
        this.color = color;
        this.barrel = new Barrel(scale, color);
        this.transformMatrix = mat4.create();
        this.scale = scale;
        //this.points = scalePoints(bodyPoints);
        this.vertices = vertIt(bodyPoints);
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.bufferVertices();
    }
    bufferVertices() {
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aNormal"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    getBarrelAngle() {
        return this.barrel.getBarrelAngle();
    }
    moveBarrel(degrees) {
        this.barrel.moveBarrel(degrees);
    }
    tick(dT) {
        //console.log(pressedKeys)
        if (pressedKeys["w"]) {
            //console.log("forward");
            this.forward(dT / 1000);
        }
        else if (pressedKeys["s"]) {
            this.backward(dT / 1000);
        }
        if (pressedKeys["a"]) {
            this.left(dT / 1000);
        }
        if (pressedKeys["d"]) {
            this.right(dT / 1000);
        }
        if (pressedKeys["r"]) {
            this.barrel.moveBarrel(dT / 50);
        }
        if (pressedKeys["f"]) {
            this.barrel.moveBarrel(dT / -50);
        }
    }
    forward(dT) {
        var dist = dT * tankSpeed;
        var xDist = Math.cos(common.toRadian(this.angle + 90)) * dist;
        var yDist = Math.sin(common.toRadian(this.angle + 90)) * dist;
        //console.log("dist:",dist);
        this.position = this.map.getPosition(this.position[0] + xDist, this.position[1] + yDist);
        this.up = this.map.getUp(this.position[0], this.position[1]);
    }
    backward(dT) {
        var dist = -dT * tankSpeed;
        var xDist = Math.cos(common.toRadian(this.angle + 90)) * dist;
        var yDist = Math.sin(common.toRadian(this.angle + 90)) * dist;
        this.position = this.map.getPosition(this.position[0] + xDist, this.position[1] + yDist);
        this.up = this.map.getUp(this.position[0], this.position[1]);
    }
    right(dT) {
        this.angle += dT * -100;
    }
    left(dT) {
        this.angle += dT * 100;
    }
    fire() {
        console.log("firing");
        //console.log("this.position: ", this.position);
        var sh = new Shell(vec3.add(vec3.create(), this.position, vec3.fromValues(0, 0, barrelZOffset * this.scale)), vec3.scale(vec3.create(), this.barrel.getFireVector(this.transformMatrix), 5), 2, 3);
        this.map.addShell(sh);
    }
    draw() {
        //console.log("tank draw");
        //gl.useProgram(program)
        //TODO: calculate transform matrix here, based on position, angle, and "up"
        var kindaForward = vec3.fromValues(0, 1, 0);
        vec3.rotateZ(kindaForward, kindaForward, vec3.fromValues(0, 0, 0), common.toRadian(this.angle));
        var right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), kindaForward, this.up));
        var forward = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), right, this.up));
        //column major version
        // this.transformMatrix = mat4.fromValues(
        //     right[0], this.up[0], forward[0], 0,
        //     right[1], this.up[1], forward[1], 0,
        //     right[2], this.up[2], forward[2], 0,
        //     this.position[0], this.position[1], this.position[2], 1
        //     )
        this.transformMatrix = mat4.fromValues(right[0], right[1], right[2], 0, this.up[0], this.up[1], this.up[2], 0, forward[0], forward[1], forward[2], 0, this.position[0], this.position[1], this.position[2], 1);
        // this.transformMatrix = mat4.fromValues(
        //     right[0], this.up[0], forward[0], this.position[0],
        //     right[1], this.up[1], forward[1], this.position[1],
        //     right[2], this.up[2], forward[2], this.position[2],
        //     0, 0, 0, 1
        //     )
        // mat4.transpose(this.transformMatrix, this.transformMatrix);
        mat4.rotateX(this.transformMatrix, this.transformMatrix, common.toRadian(-90));
        // this.transformMatrix = mat4.fromValues(
        //     right[0], right[1], right[2], this.position[0],
        //     this.up[0], this.up[1], this.up[2], this.position[1],
        //     forward[0], forward[1], forward[2], this.position[2],
        //     0, 0,0, 1
        //     )
        mat4.scale(this.transformMatrix, this.transformMatrix, vec3.fromValues(this.scale, this.scale, this.scale));
        drawVector(this.position, this.up, 5, vec3.fromValues(0, 0, 1));
        drawVector(this.position, forward, 5, vec3.fromValues(0, 1, 0));
        drawVector(this.position, right, 5, vec3.fromValues(1, 0, 0));
        drawVector(this.position, vec3.fromValues(0, 0, 1), 5, vec3.fromValues(1, 1, 1));
        drawVector(this.position, vec3.fromValues(0, 0, -1), 5, vec3.fromValues(1, 1, 1));
        //mat4.translate(this.transformMatrix, mat4.create(), this.position);
        //console.log(this.transformMatrix)
        //throw("HI");
        gl.uniform3fv(gl.getUniformLocation(program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, new Float32Array(this.transformMatrix));
        //gl.uniform1f(gl.getUniformLocation(program, "gl_PointSize"), 5);
        gl.bindVertexArray(this.vao);
        //gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
        var normalMat = mat4.create();
        mat4.invert(normalMat, this.transformMatrix);
        mat4.transpose(normalMat, normalMat);
        var normalMatLoc = gl.getUniformLocation(program, "normalMat");
        gl.uniformMatrix4fv(normalMatLoc, false, normalMat);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 6);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this.barrel.draw(this.transformMatrix);
    }
}
