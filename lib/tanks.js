import { mat4, vec3 } from './gl-matrix-es6.js';
import { bufferLights, light } from './light.js';
import { TankMap } from "./map.js";
var canvasID = "c";
window.onload = main;
var gl;
var program;
var projection;
var view;
var theMap;
var pT;
var dT;
export var MAX_POINT_LIGHTS = 8;
export var MAX_SPOT_LIGHTS = 8;
export var MAX_DIRECTIONAL_LIGHTS = 2;
export var pointLightBufferOffset;
export var spotLightBufferOffset;
export var directionalLightBufferOffset;
var vertSource = `#version 300 es

precision mediump float;

//vert attributes
in vec3 aPos;
in vec3 aNormal;


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
    frag_pos = vec3(model*vec4(aPos, 1.0f));

    gl_PointSize = 5.0f;
    gl_Position = projection*view*model*vec4(aPos, 1.0f);
}
`;
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

    for(int i = 0; i < min(nrPointLights, MAX_POINT_LIGHTS_REPLACE); i++)
    {
        result+=calcPointLight(light_points[i], normal, viewDir);
    }
    for(int i = 0; i < min(nrSpotLights, MAX_SPOT_LIGHTS_REPLACE); i++)
    {
        result+=calcSpotLight(light_spots[i], normal, viewDir);
    }
    for(int i = 0; i < min(nrDirectionalLights, MAX_DIRECTIONAL_LIGHTS_REPLACE); i++)
    {
        result+=calcDirectionalLight(light_directionals[i], normal, viewDir);
    }
    
    result.a = 1.0;
    result += vec4(0.1, 0.1, 0.1, 0.0);
    FragColor = result;





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
`;
var mapWidth = 800;
var mapHeight = 600;
function makeShader(source, type) {
    var shader = gl.createShader(type);
    if (shader === null) {
        console.log("error making shader");
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log("problem creating shader\n");
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}
function makeProgram() {
    console.log("make program");
    console.log(gl);
    var program = gl.createProgram();
    if (program === null) {
        console.log("error making shader program");
        throw ("error");
    }
    fragSource = fragSource.replace(/MAX_DIRECTIONAL_LIGHTS_REPLACE/g, "" + MAX_DIRECTIONAL_LIGHTS);
    fragSource = fragSource.replace(/MAX_SPOT_LIGHTS_REPLACE/g, "" + MAX_SPOT_LIGHTS);
    fragSource = fragSource.replace(/MAX_POINT_LIGHTS_REPLACE/g, "" + MAX_POINT_LIGHTS);
    //console.log(fragSource)
    var fragShader = makeShader(fragSource, gl.FRAGMENT_SHADER);
    var vertShader = makeShader(vertSource, gl.VERTEX_SHADER);
    if (vertShader === null || fragShader === null) {
        throw ("error");
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log("problem creating program\n");
    gl.deleteProgram(program);
    throw ("error");
}
function initializeRenderer(canvas) {
    pT = 0;
    dT = 0;
    var maybeGl = canvas.getContext("webgl2");
    console.log("init renderer");
    console.log(gl);
    if (maybeGl === null || maybeGl === undefined) {
        console.log("no webgl :(");
        throw ("No webGL");
    }
    gl = maybeGl;
    //var x = gl.createTexture()
    program = makeProgram();
    projection = mat4.create();
    view = mat4.create();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    //gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    //gl.depthMask(false)
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    light.lubo = gl.createBuffer();
}
function draw(cT) {
    //console.log(cT)
    dT = cT - pT;
    pT = cT;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    //var camPos = vec3.fromValues(camX, camY, camZ);
    bufferLights(gl, program);
    var camPos = vec3.fromValues((Math.sin(cT / 4000) * 700), (Math.cos(cT / 4000) * 700), 200);
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), camPos);
    mat4.lookAt(view, camPos, [0, 0, 0], [0, 0, 1]);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, view);
    var projectionLoc = gl.getUniformLocation(program, "projection");
    mat4.ortho(projection, -960, 960, -540, 540, -3000, 4000);
    gl.uniformMatrix4fv(projectionLoc, false, projection);
    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    var lightUniformIndex = gl.getUniformBlockIndex(program, "Lights");
    gl.uniformBlockBinding(program, lightUniformIndex, 1);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, light.lubo);
    theMap.tick(dT);
    theMap.draw(gl, program);
    requestAnimationFrame(draw);
}
function main() {
    console.log("here2");
    //init stuff
    var canvas = document.getElementById(canvasID);
    initializeRenderer(canvas);
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.95;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.95;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    });
    theMap = new TankMap(gl, program, vec3.fromValues(1.0, 0.5, 0.0), 0.9, 6, 600);
    requestAnimationFrame(draw);
}
