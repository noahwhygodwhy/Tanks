
import {mat4, common, vec3, vec4} from './gl-matrix-es6.js'

import {MAX_POINT_LIGHTS, MAX_DIRECTIONAL_LIGHTS, MAX_SPOT_LIGHTS} from "./tanks.js"

import {pointLightBufferOffset, spotLightBufferOffset, directionalLightBufferOffset} from "./tanks.js"
//buffer consists of three 4 byte ints, and then 3 variable sized light arrays sized to the maximum number of lights


export var lights:Array<light> = new Array<light>();

// export var pointLights: Array<light_point> = new Array<light_point>();
// export var spotLights: Array<light_spot> = new Array<light_spot>();
// export var directionalLights: Array<light_directional> = new Array<light_directional>();


//TODO: https://stackoverflow.com/questions/44629165/bind-multiple-uniform-buffer-objects

export function bufferLights(gl:WebGL2RenderingContext, program:WebGLProgram)
{
    //console.log("bufferLights")
    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
                                // v //don't ask, i don't know, it just works
    let totalLightBufferSize = /*20+8+8+12+*/16+(light_point.sizeInBuffer()*MAX_POINT_LIGHTS)+(light_spot.sizeInBuffer() * MAX_SPOT_LIGHTS) + (light_directional.sizeInBuffer()*MAX_DIRECTIONAL_LIGHTS);
    // console.log("totalLightBufferSize:" + totalLightBufferSize)
    // console.log("light_point.sizeInBuffer(): " + light_point.sizeInBuffer())
    // console.log("UNIFORM_BLOCK_DATA_SIZE:"+gl.UNIFORM_BLOCK_DATA_SIZE);
    gl.bufferData(gl.UNIFORM_BUFFER, totalLightBufferSize, gl.STATIC_DRAW);
    //gl.bufferData(gl.UNIFORM_BUFFER, 12, gl.DYNAMIC_DRAW);


    let pointLightIndex = 0;
    let directionalLightIndex = 0;
    let spotLightIndex = 0;
    for(let i = 0; i < lights.length; i++)
    {
        if(lights[i] instanceof light_point)
        {
            lights[i].bufferAt(gl, program, pointLightBufferOffset + (light_point.sizeInBuffer()*pointLightIndex++))
        }
        else if(lights[i] instanceof light_spot)
        {
            lights[i].bufferAt(gl, program, spotLightBufferOffset + (light_spot.sizeInBuffer()*spotLightIndex++))
        }
        else if(lights[i] instanceof light_directional)
        {
            lights[i].bufferAt(gl, program, directionalLightBufferOffset + (light_directional.sizeInBuffer()*directionalLightIndex++))
        }
        else
        {
            console.error("buffering a bad light?");
        }
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Int32Array([pointLightIndex, spotLightIndex, directionalLightIndex]))
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)
}


// export function resetLightIndexes()
// {
//     pointLightIndex = 0;
//     directionalLightIndex = 0;
//     spotLightIndex = 0;
// }

// export function setNrLights(gl:WebGLRenderingContext, program:WebGLProgram)
// {
//     gl.uniform1i(gl.getUniformLocation(program, "nrPointLights"), pointLightIndex)
//     gl.uniform1i(gl.getUniformLocation(program, "nrSpotLights"), spotLightIndex)
//     gl.uniform1i(gl.getUniformLocation(program, "nrDirectionalLights"), directionalLightIndex)
// }

export abstract class light
{

    static lubo:WebGLBuffer|null;
    
    ambient:vec4;
    diffuse:vec4;
    specular:vec4;
    bufferPosition:number;


    constructor(gl:WebGLRenderingContext, ambient:vec4, 
            diffuse:vec4, 
            specular:vec4)
    {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.bufferPosition = 0;
    }
    use(gl:WebGLRenderingContext, program:WebGLProgram)
    {
        console.error("lights use should not be called");
    }
    bufferAt(gl:WebGL2RenderingContext,program:WebGLProgram, index:number)
    {        
       this.bufferPosition = index;
    }
    static sizeInBuffer()
    {
        return 48;
    }
}

export class light_directional extends light
{
    direction:vec3;
    constructor(gl:WebGLRenderingContext, ambient:vec4, 
            diffuse:vec4, 
            specular:vec4, direction:vec3)
    {
        super(gl, ambient, diffuse, specular);
        this.direction = direction;
    }
    // use(gl:WebGLRenderingContext, program:WebGLProgram)
    // {
    //     gl.uniform3fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].direction"), this.direction as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].ambient"), this.ambient as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].diffuse"), this.diffuse as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_directionals["+directionalLightIndex+"].specular"), this.specular as Float32Array)
    //     directionalLightIndex++;
    // }
    static sizeInBuffer()
    {
        return 16+super.sizeInBuffer();
    }
    bufferAt(gl:WebGL2RenderingContext,program:WebGLProgram, index:number)
    {
        super.bufferAt(gl, program, index);
        gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+0, new Float32Array(this.ambient));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+16, new Float32Array(this.diffuse));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+32, new Float32Array(this.specular));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+48, new Float32Array(this.direction));
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
}

export class light_point extends light
{
    position:vec3;

    constant:number;
    linear:number;
    quadratic:number;

    constructor(gl:WebGLRenderingContext, ambient:vec4, 
            diffuse:vec4, 
            specular:vec4,
            position:vec3)
    {
        super(gl, ambient, diffuse, specular);
        
        this.constant = 1.0; //TODO:
        this.linear = 0.1;
        this.quadratic = 0.03; //yay constants
        this.position = position;

    }
    // use(gl:WebGLRenderingContext, program:WebGLProgram)
    // {

    //     gl.uniform3fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].position"), this.position as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].ambient"), this.ambient as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].diffuse"), this.diffuse as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].specular"), this.specular as Float32Array)

    //     gl.uniform1f(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].constant"), this.constant)
    //     gl.uniform1f(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].linear"), this.linear)
    //     gl.uniform1f(gl.getUniformLocation(program, "light_points["+pointLightIndex+"].quadratic"), this.quadratic)
    //     pointLightIndex++;
    // }
    static sizeInBuffer()
    {
        return 32+super.sizeInBuffer();
    }
    bufferAt(gl:WebGL2RenderingContext,program:WebGLProgram, index:number)
    {
        super.bufferAt(gl, program, index);
        gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+0, new Float32Array(this.ambient));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+16, new Float32Array(this.diffuse));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+32, new Float32Array(this.specular));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+48, new Float32Array(this.position));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+64, new Float32Array([this.constant, this.linear, this.quadratic]));
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
}

export class light_spot extends light
{
    position:vec3;
    direction:vec3;

    constant:number;
    linear:number;
    quadratic:number;
    angleDegrees:number;
    constructor(gl:WebGLRenderingContext, 
            ambient:vec4, 
            diffuse:vec4, 
            specular:vec4,
            position:vec3,
            direction:vec3,
            angleDegrees:number)
    {
        super(gl, ambient, diffuse, specular);
        this.direction = direction;
        this.angleDegrees = angleDegrees;
        this.position = position;
        this.constant = 1.0; //TODO:
        this.linear = 0.1;
        this.quadratic = 0.03; //yay constants
    }
    // use(gl:WebGLRenderingContext, program:WebGLProgram)
    // {
        
    //     gl.uniform3fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].position"), this.position as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].ambient"), this.ambient as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].diffuse"), this.diffuse as Float32Array)
    //     gl.uniform4fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].specular"), this.specular as Float32Array)
    //     gl.uniform3fv(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].direction"), this.direction as Float32Array)

    //     gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].constant"), this.constant)
    //     gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].linear"), this.linear)
    //     gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].quadratic"), this.quadratic)
    //     gl.uniform1f(gl.getUniformLocation(program, "light_spots["+spotLightIndex+"].phi"), Math.cos(common.toRadian(this.angleDegrees)))
    //     spotLightIndex++;
    // }
    bufferAt(gl:WebGL2RenderingContext,program:WebGLProgram, index:number)
    {
        super.bufferAt(gl, program, index);
        gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+0, new Float32Array(this.ambient));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+16, new Float32Array(this.diffuse));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+32, new Float32Array(this.specular));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+48, new Float32Array(this.position));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+64, new Float32Array(this.direction));
        gl.bufferSubData(gl.UNIFORM_BUFFER, index+80, new Float32Array([this.constant, this.linear, this.quadratic, Math.cos(common.toRadian(this.angleDegrees))]));
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
    static sizeInBuffer()
    {
        return 48+super.sizeInBuffer();
    }
}


