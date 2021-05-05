import { mat4, vec3, common } from "./gl-matrix-es6.js";
import { gl, programs, removeTank, useProgram } from "./tanks.js";
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
// function scalePoints(points:Array<vec3>, scaleFactor:number):Array<vec3>
// {
//     let toReturn = Array<vec3>(points.length)
//     let i = 0;
//     points.forEach(e=>{toReturn[i++] = vec3.multiply(vec3.create(), e, vec3.fromValues(scaleFactor, scaleFactor, scaleFactor))});
//     return toReturn;
// }
export function vertIt(points) {
    //console.log("vert it");
    let toReturn = new Float32Array(points.length * 6);
    let index = 0;
    for (let x = 0; x < points.length; x += 3) {
        //6 poinsts at a time, two triangles, calculating the normals for each trio
        let t = [points[x], points[x + 1], points[x + 2]];
        let n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), t[0], t[1]), vec3.subtract(vec3.create(), t[0], t[2])));
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
// function drawVector(program:WebGLProgram, startingPos:vec3, vec:vec3, length:number, color:vec3)
// {
//     let vao:WebGLVertexArrayObject|null
//     let vbo:WebGLBuffer|null
//     let points = [startingPos, vec3.add(vec3.create(), startingPos, vec3.multiply(vec3.create(), vec, vec3.fromValues(length, length, length)))];
//     let vectorvertices = new Float32Array(points.length*6);
//     let i = 0;
//     points.forEach(p=>{
//         vectorvertices[i++] =p[0]
//         vectorvertices[i++] =p[1]
//         vectorvertices[i++] =p[2]
//         vectorvertices[i++] = 0
//         vectorvertices[i++] = 0
//         vectorvertices[i++] = 1
//     });
//     vao = gl.createVertexArray();
//     vbo = gl.createBuffer();
//     gl.uniform3fv(gl.getUniformLocation(program, "color"), new Float32Array(color));
//     gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, new Float32Array(mat4.create()))
//     // let normalMat = mat4.create()
//     // mat4.invert(normalMat, mat4.create())
//     // mat4.transpose(normalMat, normalMat)
//     // let normalMatLoc = gl.getUniformLocation(program, "normalMat")
//     // gl.uniformMatrix4fv(normalMatLoc, false, normalMat as Float32List);
//     gl.bindVertexArray(vao);
//     gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vectorvertices), gl.STATIC_DRAW);
//     gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
//     gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 24, 0);
//     gl.enableVertexAttribArray(gl.getAttribLocation(program, "aNormal"));
//     gl.vertexAttribPointer(gl.getAttribLocation(program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
//     gl.lineWidth(10);
//     gl.drawArrays(gl.LINES, 0, vectorvertices.length/6)
//     gl.bindVertexArray(null);
//     gl.bindBuffer(gl.ARRAY_BUFFER, null); 
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
// }
export class Tank {
    constructor(program, xcoord, ycoord, angle, scale, color, name, map) {
        console.log("tank constructor");
        this.name = name;
        this.health = 100.0;
        this.myTurn = false;
        this.angle = angle;
        this.scale = scale;
        console.log("scale:", this.scale);
        this.map = map;
        // console.log("tank get position");
        // console.log("===================================")
        this.position = map.getPosition(xcoord, ycoord);
        console.log("position:", this.position);
        // console.log("position: ", this.position);   
        // console.log("===================================")
        this.up = map.getUp(xcoord, ycoord);
        // console.log("up: ", this.up)
        this.color = color;
        this.program = program;
        this.barrel = new Barrel(program, scale, color);
        this.transformMatrix = mat4.create();
        this.normalMat = mat4.create();
        this.updateTMat();
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
        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "aPos"), 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, "aNormal"));
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    getBarrelAngle() {
        return this.barrel.getBarrelAngle();
    }
    moveBarrel(degrees) {
        this.barrel.moveBarrel(degrees);
    }
    turnOn() {
        this.myTurn = true;
    }
    turnOff() {
        this.myTurn = false;
    }
    tick(dT) {
        //console.log(pressedKeys)
        if (this.myTurn) {
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
            let anything = false;
            for (let key in pressedKeys) {
                anything = anything || pressedKeys[key];
            }
            if (anything) {
                this.updateTMat();
            }
        }
    }
    updateTMat() {
        let kindaForward = vec3.rotateZ(vec3.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 0), common.toRadian(this.angle));
        let right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), kindaForward, this.up));
        let forward = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), right, this.up));
        this.transformMatrix = mat4.fromValues(right[0], right[1], right[2], 0, this.up[0], this.up[1], this.up[2], 0, forward[0], forward[1], forward[2], 0, this.position[0], this.position[1], this.position[2], 1);
        mat4.rotateX(this.transformMatrix, this.transformMatrix, common.toRadian(-90));
        mat4.scale(this.transformMatrix, this.transformMatrix, vec3.fromValues(this.scale, this.scale, this.scale));
        //console.log(this.normalMat);
        mat4.invert(this.normalMat, this.transformMatrix);
        mat4.transpose(this.normalMat, this.normalMat);
    }
    forward(dT) {
        let dist = dT * tankSpeed;
        let xDist = Math.cos(common.toRadian(this.angle + 90)) * dist;
        let yDist = Math.sin(common.toRadian(this.angle + 90)) * dist;
        //console.log("dist:",dist);
        let newPos = this.map.getPosition(this.position[0] + xDist, this.position[1] + yDist);
        if (newPos != null) {
            this.position = newPos;
        }
        this.up = this.map.getUp(this.position[0], this.position[1]);
    }
    backward(dT) {
        let dist = -dT * tankSpeed;
        let xDist = Math.cos(common.toRadian(this.angle + 90)) * dist;
        let yDist = Math.sin(common.toRadian(this.angle + 90)) * dist;
        let newPos = this.map.getPosition(this.position[0] + xDist, this.position[1] + yDist);
        if (newPos != null) {
            this.position = newPos;
        }
        this.up = this.map.getUp(this.position[0], this.position[1]);
    }
    right(dT) {
        this.angle += dT * -100;
    }
    left(dT) {
        this.angle += dT * 100;
    }
    fire() {
        console.log(this.name);
        console.log("firing");
        //console.log("this.position: ", this.position);
        let sh = new Shell(programs["shell"], vec3.add(vec3.create(), this.position, vec3.fromValues(0, 0, barrelZOffset * this.scale)), vec3.scale(vec3.create(), this.barrel.getFireVector(this.transformMatrix), 5), 2, 3, 50);
        this.map.addShell(sh);
    }
    getHurt(damage) {
        console.log("get hurt, damage:", damage);
        this.health -= damage;
        console.log("new health:", this.health);
        if (this.health <= 0) {
            removeTank(this);
        }
    }
    draw() {
        useProgram(this.program);
        // drawVector(this.program, this.position, this.up, 5, vec3.fromValues(0, 0, 1));
        // drawVector(this.program, this.position, forward, 5, vec3.fromValues(0, 1, 0));
        // drawVector(this.program, this.position, right, 5, vec3.fromValues(1, 0, 0));
        // drawVector(this.program, this.position, vec3.fromValues(0, 0, 1), 5, vec3.fromValues(1, 1, 1));
        // drawVector(this.program, this.position, vec3.fromValues(0, 0, -1), 5, vec3.fromValues(1, 1, 1));
        gl.uniform3fv(gl.getUniformLocation(this.program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "model"), false, new Float32Array(this.transformMatrix));
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "normalMat"), false, this.normalMat);
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 6);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.barrel.draw(this.transformMatrix);
    }
}
