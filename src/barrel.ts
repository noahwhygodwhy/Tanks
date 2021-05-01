import {mat4, vec2, vec3, vec4, common} from "./gl-matrix-es6.js"

import {gl, program} from "./tanks.js"

import {vertIt} from "./tank.js"


function v(a:number, b:number, c:number)
{
    return vec3.fromValues(a, b, c);
}

export const barrelZOffset = 1.15;

const maxRotation = 90;
const minRotation = 0;

const barrelPoints:Array<vec3> = [
    //front
    v(-0.25, 3, -0.25), v(-0.25, 3, 0.25), v(0.25, 3, 0.25),
    v(-0.25, 3, -0.25), v(0.25, 3, 0.25), v(0.25, 3, -0.25),
    //back
    v(-0.25, 0, -0.25), v(-0.25, 0, 0.25), v(0.25, 0, 0.25),
    v(-0.25, 0, -0.25), v(0.25, 0, 0.25), v(0.25, 0, -0.25),

    //left
    v(-0.25, 0, -0.25), v(-0.25, 0, 0.25),v(-0.25, 3, -0.25),
    v(-0.25, 0, 0.25), v(-0.25, 3, 0.25), v(-0.25, 3, -0.25),

    //right
    v(0.25, 0, -0.25), v(0.25, 3, -0.25), v(0.25, 0, 0.25),
    v(0.25, 0, 0.25), v(0.25, 3, -0.25), v(0.25, 3, 0.25),

    //top
    v(-0.25, 0, 0.25), v(0.25, 0, 0.25), v(-0.25, 3, 0.25),
    v(0.25, 0, 0.25), v(0.25, 3, 0.25), v(-0.25, 3, 0.25),

    //bottom
    v(-0.25, 0, -0.25), v(-0.25, 3, -0.25), v(0.25, 0, -0.25),
    v(0.25, 0, -0.25), v(-0.25, 3, -0.25), v(0.25, 3, -0.25),
    
    


];



export class Barrel
{

    vertices:Float32Array
    color:vec3;

    angle:number;
    
    vao:WebGLVertexArrayObject|null
    vbo:WebGLBuffer|null

    transformMatrix:mat4
    
    constructor(scale:number, color:vec3)
    {
        this.angle = 0;
        this.color = color;

        this.transformMatrix = mat4.create();

        this.vertices = vertIt(barrelPoints)

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();

        this.bufferVertices();

    }
    
    bufferVertices()
    {
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
    
    getBarrelAngle()
    {
        return this.angle;
    }

    getFireVector(parentTransform:mat4):vec3
    {
        var ttm = mat4.create();

        mat4.translate(ttm, mat4.create(), vec3.fromValues(0, 0, barrelZOffset))
        mat4.rotateX(ttm, ttm, common.toRadian(this.angle))
        mat4.multiply(ttm, parentTransform, ttm);

        return vec3.normalize(vec3.create(), vec3.fromValues(ttm[4], ttm[5], ttm[6]));
    }

    draw(parentTransform:mat4):void
    {
        //console.log("tank draw");
        //gl.useProgram(program)
        


        mat4.translate(this.transformMatrix, mat4.create(), vec3.fromValues(0, 0, barrelZOffset))
        mat4.rotateX(this.transformMatrix, this.transformMatrix, common.toRadian(this.angle))
        mat4.multiply(this.transformMatrix, parentTransform, this.transformMatrix);

        //this.transformMatrix = mat4.multiply(mat4.create(), parentTransform, mat4.translate(mat4.create(), mat4.rotateX(mat4.create(), mat4.create(), common.toRadian(this.angle)), vec3.fromValues(0, 0, barrelZOffset)))


        gl.uniform3fv(gl.getUniformLocation(program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, new Float32Array(this.transformMatrix))
        
        //gl.uniform1f(gl.getUniformLocation(program, "gl_PointSize"), 5);

        gl.bindVertexArray(this.vao);

        //gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);

        var normalMat = mat4.create()
        mat4.invert(normalMat, this.transformMatrix)
        mat4.transpose(normalMat, normalMat)
        
        var normalMatLoc = gl.getUniformLocation(program, "normalMat")
        gl.uniformMatrix4fv(normalMatLoc, false, normalMat as Float32List);
    
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/6)

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    moveBarrel(degrees:number)
    {
        //console.log("new degrees:", Math.max(minRotation, Math.min(maxRotation, this.angle+degrees)))
        this.angle = Math.max(minRotation, Math.min(maxRotation, this.angle+degrees))
        //console.log("new angle:", this.angle);


    }
}