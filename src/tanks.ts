import { mat4, mat3, vec3, vec2 } from './gl-matrix-es6.js';
import {TankMap} from "./map.js"

var canvasID = "c"

window.onload = main; 


var gl : WebGL2RenderingContext
var program : WebGLProgram
var projection:mat4
var view:mat4


var theMap:TankMap

var pT:number
var dT:number


var vertSource = `#version 300 es

precision mediump float;

//vert attributes
in vec3 aPos;


//transform matrices

uniform mat4 view;
uniform mat4 projection;
uniform mat4 model;


//outs
void main()
{
    gl_PointSize = 5.0f;
    gl_Position = projection*view*model*vec4(aPos, 1.0f);
}
`

var fragSource = `#version 300 es

precision mediump float;

uniform vec3 color;
out vec4 FragColor;

void main()
{
    FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`





var mapWidth:number = 800;
var mapHeight:number = 600;




function makeShader(source:any, type:any) : WebGLShader | null
{
    var shader = gl.createShader(type)

    if(shader === null)
    {
        console.log("error making shader")
        return null
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if(success)
    {
        return shader
    }
    
    console.log("problem creating shader\n");
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null
}


function makeProgram(): WebGLProgram
{
    console.log("make program")
    console.log(gl)

    var program = gl.createProgram();

    if(program === null)
    {
        console.log("error making shader program")
        throw("error")
    }



    //console.log(fragSource)

    var fragShader = makeShader(fragSource, gl.FRAGMENT_SHADER)
    var vertShader = makeShader(vertSource, gl.VERTEX_SHADER)

    if(vertShader === null || fragShader === null)
    {
        throw("error")
    }


    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.log("problem creating program\n");
    gl.deleteProgram(program);
    throw("error")
}

function initializeRenderer(canvas:HTMLCanvasElement)
{

    pT = 0;
    dT = 0;

    var maybeGl = canvas.getContext("webgl2");
    
    console.log("init renderer");
    console.log(gl)


    if(maybeGl === null || maybeGl === undefined)
    {
        console.log("no webgl :(")
        throw("No webGL")
    }
    gl = maybeGl
    //var x = gl.createTexture()
    program = makeProgram()

    projection = mat4.create()
    view = mat4.create()

    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    //gl.depthMask(false)

    gl.useProgram(program)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);




    

}


function draw(cT:number)
{
    //console.log(cT)
    dT = cT-pT;
    pT = cT;


    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);


    //var camPos = vec3.fromValues(camX, camY, camZ);


    mat4.lookAt(view, [(Math.sin(cT/4000)*700), (Math.cos(cT/4000)*700), 200], [0, 0, 0], [0, 0, 1]);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, view as Float32Array); 
    
    var projectionLoc = gl.getUniformLocation(program, "projection")
    mat4.ortho(projection, -960, 960, -540, 540, -3000, 4000);
  
    gl.uniformMatrix4fv(projectionLoc, false, projection as Float32Array);

    theMap.draw(gl, program);


    requestAnimationFrame(draw);
}


function main()
{

    console.log("here2");

    //init stuff
    var canvas = <HTMLCanvasElement> document.getElementById(canvasID)
    initializeRenderer(canvas)


    canvas.width = window.innerWidth*0.95
    canvas.height = window.innerHeight*0.95

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


    window.addEventListener('resize', function()
    {
        canvas.width = window.innerWidth*0.95
        canvas.height = window.innerHeight*0.95
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    });



    theMap = new TankMap(gl, program, vec3.fromValues(1.0, 0.5, 0.0), 0.3, 6, 600);



    requestAnimationFrame(draw);

}

