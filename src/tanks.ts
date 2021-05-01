import { Camera } from './camera.js';
import { mat4, mat3, vec3, vec2 } from './gl-matrix-es6.js';
import { bufferLights, light } from './light.js';
import {TankMap} from "./map.js"
import {Tank} from "./tank.js"

var canvasID = "c"

window.onload = main; 


export var gl : WebGL2RenderingContext
export var canvas:HTMLCanvasElement
export var program : WebGLProgram
var projection:mat4
var view:mat4

const aspectRatio = 16/9;
var zoom:number;

var theCam:Camera
var theMap:TankMap
var theTank:Tank

var pT:number
var dT:number

var mapWidth:number = 6;
var mapHeight:number = 600;
// var mapExtremety:number = 0.3;
var mapExtremety:number = 0.3;
var mapSmoothness:number = 4;
var mapTesseltation:number = 0;

export var pressedKeys:{[name:string]:boolean} = {"w":false,"s":false,"a":false,"d":false,"r":false,"f":false}

export var MAX_POINT_LIGHTS = 8
export var MAX_SPOT_LIGHTS = 8
export var MAX_DIRECTIONAL_LIGHTS = 2

export var pointLightBufferOffset:number;
export var spotLightBufferOffset:number;
export var directionalLightBufferOffset:number;

var vertSource = `#version 300 es

precision mediump float;

//vert attributes
in vec3 aPos;
in vec3 aNormal;


uniform float pointSize;

//transform matrices

uniform mat4 view;
uniform mat4 projection;
uniform mat4 model;
uniform mat4 normalMat;
//outs

out vec3 frag_normal;
out vec3 frag_pos;

void main()
{

    frag_normal = mat3(normalMat)*aNormal;
    frag_pos = vec3(vec4(aPos, 1.0f));

    gl_PointSize = pointSize;
    gl_Position = projection*view*model*vec4(aPos, 1.0f);
}
`

var fragSource = `#version 300 es

precision mediump float;

in vec3 frag_pos;
in vec3 frag_normal;
uniform vec3 viewPos;

uniform vec3 color;
out vec4 FragColor;

uniform mat4 normalMat;



struct light_directional
{
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec3 direction;
};

struct light_point{
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec3 position;
    float constant;
    float linear;
    float quadratic;
};
struct light_spot{
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec3 position;
    vec3 direction;
    float constant;
    float linear;
    float quadratic;
    float phi;
};


layout (std140) uniform Lights
{
    int nrPointLights;
    int nrSpotLights;
    int nrDirectionalLights;
    //TODO:
    light_point light_points[MAX_POINT_LIGHTS_REPLACE];
    light_spot light_spots[MAX_SPOT_LIGHTS_REPLACE];
    light_directional light_directionals[MAX_DIRECTIONAL_LIGHTS_REPLACE];
};

vec4 calcDirectionalLight(light_directional light, vec3 normal, vec3 viewDir)
{
    vec4 ambientResult = light.ambient*vec4(color, 1.0);


    float diff = max(dot(normal, light.direction), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*vec4(color, 1.0);

    return vec4(vec3(ambientResult+diffuseResult), 1.0);
}

vec4 calcSpotLight(light_spot light, vec3 normal, vec3 viewDir)
{
    vec4 ambientResult = light.ambient*vec4(color, 1.0);

    vec3 lightDir = normalize(light.position-frag_pos);
    float theta = dot(lightDir, light.direction);
    if(theta>light.phi)
    {
        return vec4(vec3(ambientResult), 1.0f);
    }
    vec3 reflectDir = reflect(-lightDir, normal);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*vec4(color, 1.0);

    float d = distance(light.position, frag_pos);

    float attenuation = 1.0/(1.0 + (0.00001*d) + (0.000003*(d*d)));

    ambientResult *= attenuation;
    diffuseResult *= attenuation;

    return vec4(vec3(ambientResult+diffuseResult), 1.0);
    
}

vec4 calcPointLight(light_point light, vec3 normal, vec3 viewDir)
{


    vec4 ambientResult = light.ambient*vec4(color, 1.0);

    vec3 lightDir = normalize(light.position-frag_pos);
    
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(light.diffuse)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*vec4(color, 1.0);

    float d = distance(light.position, frag_pos);

    float attenuation = 1.0/(1.0 + (0.1*d) + (0.03*(d*d)));

    ambientResult *= attenuation;
    diffuseResult *= attenuation;

    return vec4(vec3(ambientResult+diffuseResult), 1.0);
    
}

void main()
{


    vec4 result = vec4(0.0, 0.0, 0.0, 1.0);

    vec3 normal = normalize(frag_normal);
    vec3 viewDir = normalize(viewPos-frag_pos);

    // for(int i = 0; i < min(nrPointLights, MAX_POINT_LIGHTS_REPLACE); i++)
    // {
    //     result+=calcPointLight(light_points[i], normal, viewDir);
    // }
    // for(int i = 0; i < min(nrSpotLights, MAX_SPOT_LIGHTS_REPLACE); i++)
    // {
    //     result+=calcSpotLight(light_spots[i], normal, viewDir);
    // }
    // for(int i = 0; i < min(nrDirectionalLights, MAX_DIRECTIONAL_LIGHTS_REPLACE); i++)
    // {
    //     result+=calcDirectionalLight(light_directionals[i], normal, viewDir);
    // }
    
    // result.a = 1.0;
    // result += vec4(0.1, 0.1, 0.1, 0.0);
    // FragColor = result;





    //manual diretional light temp

    
    result = vec4(0.0, 0.0, 0.0, 1.0);


    vec4 ambientResult = vec4(0.1, 0.1, 0.1, 1.0)*vec4(color, 1.0);


    float diff = max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);
    vec3 diffuse = vec3(0.5, 0.5, 0.5)*diff;
    vec4 diffuseResult = vec4(diffuse, 1.0)*vec4(color, 1.0);

    result += vec4(vec3(ambientResult+diffuseResult), 1.0);



    FragColor = result;


    //FragColor = vec4(color, 1.0);


}
`







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


    fragSource = fragSource.replace(/MAX_DIRECTIONAL_LIGHTS_REPLACE/g, ""+MAX_DIRECTIONAL_LIGHTS)
    fragSource = fragSource.replace(/MAX_SPOT_LIGHTS_REPLACE/g, ""+MAX_SPOT_LIGHTS)
    fragSource = fragSource.replace(/MAX_POINT_LIGHTS_REPLACE/g, ""+MAX_POINT_LIGHTS)

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

function initializeRenderer()
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

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    //gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    //gl.depthMask(false)

    gl.useProgram(program)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);



    light.lubo = gl.createBuffer();    

}

function radians(deg:number):number
{
    return deg * Math.PI / 180;
}


var mapCenter = vec3.create();
var hitDone = false;



var frameTimes = Array<number>(60).fill(0);
var frameIndex = 0;


var fps = document.querySelector("#fps");
var fpsNode = document.createTextNode("");
if(fps != null)
{
    fps.appendChild(fpsNode);
}

function doFPS(dT:number)
{
    frameTimes[frameIndex] = dT/1000;

    var totalFrameTime = frameTimes.reduce((a, b) => a+b, 0);
    var fps = frameTimes.length / totalFrameTime;
    fpsNode.nodeValue = fps.toFixed(2);


    frameIndex = (frameIndex+1)%frameTimes.length;
}

function draw(cT:number)
{
    //console.log(cT)
    dT = cT-pT;
    pT = cT;




    doFPS(dT);

    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);


    //var camPos = vec3.fromValues(camX, camY, camZ);


    bufferLights(gl, program);

    var realMapWidth = Math.pow(2, mapWidth)+1;



    var camPos = vec3.fromValues((Math.sin(cT/4000)*5)+realMapWidth/2, (Math.cos(cT/4000)*5)+realMapWidth/2, mapCenter[2]+5)
    //camPos = vec3.fromValues(50.0, 50.0, 50.0)
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), camPos as Float32Array);



    //mat4.lookAt(view, camPos, [realMapWidth/2, realMapWidth/2, mapCenter], [0, 0, 1]);
    mat4.lookAt(view, camPos, mapCenter, [0, 0, 1]);

    //TODO:
    view = theCam.getView();

    //mat4.lookAt(view, vec3.fromValues((Math.sin(cT/4000)*5), (Math.cos(cT/4000)*5), 1), [0,0,0], [0, 0, 1]);
    //theMap.points[Math.floor(theMap.points.length/2)][Math.floor(theMap.points.length/2)][2]
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, view as Float32Array); 
    

    var projectionLoc = gl.getUniformLocation(program, "projection")

    //The values for the ortho projection edges are what determine zoom and aspect ratio

    var orthoWidth = 20;
    orthoWidth = Math.pow(2, mapWidth);
    var orthoWidth = 3;


    mat4.ortho(projection, -orthoWidth, orthoWidth, -orthoWidth/aspectRatio, orthoWidth/aspectRatio, -3000, 4000);
    mat4.perspective(projection, radians(70), gl.canvas.width / gl.canvas.height, 0.1, 10000)
  
    gl.uniformMatrix4fv(projectionLoc, false, projection as Float32Array);


    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    var lightUniformIndex = gl.getUniformBlockIndex(program, "Lights")
    gl.uniformBlockBinding(program, lightUniformIndex, 1)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, light.lubo)


    /*if(cT > 5000 && !hitDone)
    {
        theMap.testHit();
        hitDone = true;
    }*/

    //theTank.moveBarrel(0.2);
    theTank.tick(dT),
    theTank.draw();

    //theMap.tick(dT);
    theMap.tick(dT);
    theMap.draw(gl, program);

    //throw("hi you");

    requestAnimationFrame(draw);
}



function resizeCallback()
{
    if(window.innerWidth > aspectRatio*window.innerHeight)
    {
        canvas.width = window.innerHeight*aspectRatio;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerWidth/aspectRatio;
    }


    //canvas.width = window.innerWidth
    //canvas.height = window.innerHeight



    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function main()
{

    console.log("here2");

    //init stuff
    canvas = <HTMLCanvasElement> document.getElementById(canvasID)
    initializeRenderer()


    resizeCallback();


    window.addEventListener('resize', resizeCallback);



    theMap = new TankMap(gl, program, vec3.fromValues(1.0, 0.5, 0.0), mapExtremety, mapWidth, mapHeight, mapSmoothness, mapTesseltation);
    
    
    theTank = new Tank((theMap.getWidth()/2)+0.2, theMap.getWidth()/2,0,  0.2, vec3.fromValues(1.0, 0, 0), theMap);


    document.onkeydown = keyDown;
    document.onkeyup = keyUp;
    
    // window.addEventListener("onkeydown", (e:KeyboardEvent)=> keyDown(e));
    // window.addEventListener("onkeyup", (e)=> keyUp(e));

    mapCenter = theMap.getPosition(theMap.getWidth()/2, theMap.getWidth()/2);//TODO: theMap.points[Math.floor(theMap.points.length/2)][Math.floor(theMap.points.length/2)][2];

    theCam = new Camera(20, mapCenter[2], mapCenter);



    document.onkeypress = okp;
    document.onmouseup = omu;
    document.onmousedown = omd;
    document.onmousemove = omm;
    document.onwheel = oms;

    requestAnimationFrame(draw);

}


function okp(event:KeyboardEvent)
{
    if(event.key == " ")
    {
        theTank.fire();
    }
}

function omd(event:any)
{
    theCam.mouseDown(event);
}
function omu(event:any)
{
    theCam.mouseUp(event);
}
function omm(event:any)
{
    theCam.mouseMove(event);
}

function oms(event:any)
{
    theCam.onScroll(event);
}


function keyDown(e:KeyboardEvent)
{
    pressedKeys[e.key] = true;
}

function keyUp(e:KeyboardEvent)
{
    pressedKeys[e.key] = false;
}



// function keyPress(e:KeyboardEvent)
// {
//     console.log("key press ", e.key);
//     switch(e.key)
//     {
//         case "w":
//             theTank.forward(dT/1000)
//             break;
//         case "s":
//             theTank.backward(dT/1000)
//             break;
//         case "a":
//             theTank.right(dT/1000);
//             break;
//         case "d":
//             theTank.left(dT/1000);
//             break;
//         case "r":
//             theTank.barrelUp(dT/1000);
//             break;
//         case "f":
//             theTank.barrelDown(dT/1000);
//             break;
//     }
// }
