import { bufferLights, light } from "./light.js";
import { MAX_POINT_LIGHTS, MAX_SPOT_LIGHTS, MAX_DIRECTIONAL_LIGHTS, aspectRatio, theCam } from "./tanks.js";
import { gl, projection } from "./tanks.js";
import { mat4 } from './gl-matrix-es6.js';
var mapVertSource = `#version 300 es

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
`;
var mapFragSource = `#version 300 es

precision mediump float;

in vec3 frag_pos;
in vec3 frag_normal;
uniform vec3 viewPos;

uniform vec3 color;
out vec4 FragColor;

uniform mat4 normalMat;

uniform float pointSize;


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
    // if(pointSize == 4.0)
    // {
    //     FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    // }

    //FragColor = vec4(color, 1.0);


}
`;
var shellFragSource = `#version 300 es

precision mediump float;

in vec3 frag_pos;
in vec3 frag_normal;
uniform vec3 viewPos;

uniform vec3 color;
out vec4 FragColor;

uniform mat4 normalMat;

uniform float pointSize;


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


void main()
{
    FragColor = vec4(color, 1.0);
}
`;
export function useProgram(program) {
    gl.useProgram(program);
    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    var lightUniformIndex = gl.getUniformBlockIndex(program, "Lights");
    gl.uniformBlockBinding(program, lightUniformIndex, 1);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, light.lubo);
    bufferLights(gl, program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, theCam.getView());
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), theCam.getPos());
    //var orthoWidth = 20;
    //orthoWidth = Math.pow(2, mapWidth);
    var orthoWidth = 20 * (theCam.getZoom());
    mat4.ortho(projection, -orthoWidth, orthoWidth, -orthoWidth / aspectRatio, orthoWidth / aspectRatio, -3000, 4000);
    //mat4.perspective(projection, common.toRadian(70), gl.canvas.width / gl.canvas.height, 0.1, 10000)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, projection);
}
export function mapProgram() {
    return makeProgram(mapFragSource, mapVertSource);
}
export function shellProgram() {
    return makeProgram(shellFragSource, mapVertSource);
}
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
function makeProgram(fragSource, vertSource) {
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
