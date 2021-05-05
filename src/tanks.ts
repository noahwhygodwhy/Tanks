import { Camera } from './camera.js';
import { mat4, mat3, vec3, vec2, common } from './gl-matrix-es6.js';
import { bufferLights, light } from './light.js';
import {TankMap} from "./map.js"
import { mapProgram, shellProgram } from './shader.js';
import {Tank} from "./tank.js"

var canvasID = "webGLCanvas"
var overlayCanvasID = "overlayCanvas"
var menuID = "menu"

window.onload = main; 


export var gl : WebGL2RenderingContext
export var gui : CanvasRenderingContext2D
export var canvas:HTMLCanvasElement
export var overlayCanvas:HTMLCanvasElement
export var menu:HTMLDivElement

export var programs:{[name:string]:WebGLProgram} = {}
//export var program : WebGLProgram
export var projection:mat4
export var view:mat4


export const aspectRatio = 16/9;//TODO: get rid of
// var zoom:number;



export var theCam:Camera
var theMap:TankMap

// var theTank:Tank

var pT:number
var dT:number

var fired:boolean = false;

export var players:Array<Tank>;
var playerTurn:number = 0;

export var pressedKeys:{[name:string]:boolean} = {"w":false,"s":false,"a":false,"d":false,"r":false,"f":false}

export var MAX_POINT_LIGHTS = 8
export var MAX_SPOT_LIGHTS = 8
export var MAX_DIRECTIONAL_LIGHTS = 2

export var pointLightBufferOffset:number;
export var spotLightBufferOffset:number;
export var directionalLightBufferOffset:number;


function initializeRenderer()
{
    console.log("init renderer");

    pT = 0;
    dT = 0;

    console.log("canvas: ", canvas);

    let maybeGl = canvas.getContext("webgl2");
    
    console.log("maybegl:",maybeGl)


    if(maybeGl === null || maybeGl === undefined)
    {
        //TODO: make it more obvious
        console.log("no webgl :(")
        throw("No webGL")
    }
    gl = maybeGl
    //let x = gl.createTexture()

    projection = mat4.create()
    view = mat4.create()

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    //gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    //gl.depthMask(false)

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    programs = {"map":mapProgram(), "shell":shellProgram()}


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


// var fps = document.querySelector("#fps");
// var fpsNode = document.createTextNode("");
// if(fps != null)
// {
//     fps.appendChild(fpsNode);
// }

// function doFPS(dT:number)
// {
//     frameTimes[frameIndex] = dT/1000;

//     var totalFrameTime = frameTimes.reduce((a, b) => a+b, 0);
//     var fps = frameTimes.length / totalFrameTime;
//     fpsNode.nodeValue = fps.toFixed(2);


//     frameIndex = (frameIndex+1)%frameTimes.length;
// }



export function useProgram(program:WebGLProgram):void
{
    gl.useProgram(program);


    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    let lightUniformIndex = gl.getUniformBlockIndex(program, "Lights")
    gl.uniformBlockBinding(program, lightUniformIndex, 1)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, light.lubo)
    
    bufferLights();

    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, theCam.getView() as Float32Array); 
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), theCam.getPos() as Float32Array);

    //var orthoWidth = 20;

    //orthoWidth = Math.pow(2, mapWidth);

    let orthoWidth = 20*(theCam.getZoom())

    mat4.ortho(projection, -orthoWidth, orthoWidth, -orthoWidth/aspectRatio, orthoWidth/aspectRatio, -3000, 4000);
    //mat4.perspective(projection, common.toRadian(70), gl.canvas.width / gl.canvas.height, 0.1, 10000)
  
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, projection as Float32Array);

}


function draw(cT:number)
{
    dT = cT-pT;
    pT = cT;

    // doFPS(dT);

    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    players.forEach(t=>{t.tick(dT)});
    players.forEach(t=>{t.draw()});

    theMap.tick(dT);
    if(fired && theMap.allShellsDone())
    {
        fired = false;
        playerTurn = (playerTurn+1)%players.length;
        players[playerTurn].turnOn();
    }
    theMap.draw();
    drawMenu(cT, dT);

    requestAnimationFrame(draw);
}



function resizeCallback()
{
    //menu.style.zIndex = "-1";
    if(window.innerWidth > aspectRatio*window.innerHeight)
    {
        canvas.width = window.innerHeight*aspectRatio;
        canvas.height = window.innerHeight;
        overlayCanvas.width = window.innerHeight*aspectRatio;
        overlayCanvas.height = window.innerHeight;

        menu.style.width = (window.innerHeight*aspectRatio).toFixed(0) + "px";
        menu.style.height = window.innerHeight.toFixed(0) + "px";

    }
    else
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerWidth/aspectRatio;
        overlayCanvas.width = window.innerWidth;
        overlayCanvas.height = window.innerWidth/aspectRatio;

        menu.style.width = window.innerWidth + "px";
        menu.style.height = (window.innerWidth/aspectRatio) + "px";
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


export function removeTank(t:Tank):void
{
    players.splice(players.findIndex(e=>e===t), 1);
}




function drawMenu(cT:number, dT:number)
{
    gui.clearRect(0, 0, gui.canvas.width, gui.canvas.height);

    let sX = 50;
    let sY = canvas.height-50;
    let spaceBetweenLines = 20;

    let fontSize = gui.canvas.height/20;

    players.forEach((p, i)=>{
        gui.font = fontSize+"px comicsans";
        let theText = "Tank " + i + ": " + p.health.toFixed(1) + "hp";
        let textHeight = gui.measureText(theText).actualBoundingBoxAscent

        gui.fillStyle = "rgb("+(p.color[0]*255)+"," + (p.color[1]*255)+"," + (p.color[2]*255) + ")"
        console.log("rgb("+p.color[0]+",",p.color[1]+",",p.color[2] + ")");
        gui.fillText(theText, sX, sY-textHeight);
        sY -= textHeight+spaceBetweenLines;
    })





}


declare global {
    interface Window { startGameFn: any; }
}

function main()
{


    let a:number|null = null;
    let b:number = a!;
    console.log(b);


    console.log("here2");

    //init stuff
    canvas = <HTMLCanvasElement> document.getElementById(canvasID)
    overlayCanvas = <HTMLCanvasElement> document.getElementById(overlayCanvasID)
    menu = <HTMLDivElement> document.getElementById(menuID)//TODO do I actually need?


    initializeRenderer()
    //TODO: message if webgl isn't availalbe.

    
    gui = overlayCanvas.getContext("2d")!; //!!!!!

    

    resizeCallback();


    window.addEventListener('resize', resizeCallback);

    window.startGameFn = startGame;
}

function hexToVec(input:string):vec3
{
    let r = parseInt(input.substring(1, 3), 16);
    let g = parseInt(input.substring(3, 5), 16);
    let b = parseInt(input.substring(5, 7), 16);

    return vec3.scale(vec3.create(), vec3.fromValues(r, g, b), 1/255);
}



export function startGame(settings:any)
{
    console.log(settings);

    console.log("STARTING GAME FN");

    theMap = new TankMap(programs["map"], vec3.fromValues(1.0, 0.5, 0.0), settings["extremety"], settings["mapWidth"], settings["mapHeight"], settings["smoothness"], settings["tesselation"]);

    players = new Array<Tank>()
    let angleBetween = 360/settings["playerQuantity"];
    for(let i = 0; i < settings["playerQuantity"]; i++)
    {
        let x = (Math.cos(common.toRadian(angleBetween*i))*((theMap.getWidth()/2)-1))+(theMap.getWidth()/2)-1
        let y = (Math.sin(common.toRadian(angleBetween*i))*((theMap.getWidth()/2)-1))+(theMap.getWidth()/2)

        console.log("pushing player");
        console.log(theMap.getWidth())
        players.push(new Tank(programs["map"], x, y, 0, 0.2, hexToVec(settings["players"][i]["color"]), settings["players"][i]["name"], theMap));
    }

    mapCenter = theMap.getPosition(theMap.getWidth()/2, theMap.getWidth()/2)!;//TODO: theMap.points[Math.floor(theMap.points.length/2)][Math.floor(theMap.points.length/2)][2];
    theCam = new Camera(20, mapCenter[2], mapCenter);

    document.onkeydown = keyDown;
    document.onkeyup = keyUp;
    document.onkeypress = okp;
    document.onmouseup = omu;
    document.onmousedown = omd;
    document.onmousemove = omm;
    document.onwheel = oms;

    playerTurn = 0;
    players[playerTurn].turnOn();
    requestAnimationFrame(draw);
}


function okp(event:KeyboardEvent)
{
    if(event.key == " " && !fired)
    {
        players[playerTurn].fire();
        players[playerTurn].turnOff();
        fired = true;
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


