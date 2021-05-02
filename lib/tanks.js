import { mat4, vec3 } from './gl-matrix-es6.js';
import { light } from './light.js';
import { TankMap } from "./map.js";
import { mapProgram, shellProgram } from './shader.js';
import { Tank } from "./tank.js";
var canvasID = "webGLCanvas";
var overlayCanvasID = "overlayCanvas";
var menuID = "menu";
window.onload = main;
export var gl;
export var gui;
export var canvas;
export var overlayCanvas;
export var menu;
export var programs = {};
//export var program : WebGLProgram
export var projection;
export var view;
export const aspectRatio = 16 / 9;
// var zoom:number;
export var theCam;
var theMap;
var theTank;
var pT;
var dT;
var mapWidth = 6;
var mapHeight = 600;
var mapExtremety = 0.3;
var mapSmoothness = 4;
var mapTesseltation = 2;
export var pressedKeys = { "w": false, "s": false, "a": false, "d": false, "r": false, "f": false };
export var MAX_POINT_LIGHTS = 8;
export var MAX_SPOT_LIGHTS = 8;
export var MAX_DIRECTIONAL_LIGHTS = 2;
export var pointLightBufferOffset;
export var spotLightBufferOffset;
export var directionalLightBufferOffset;
function initializeRenderer() {
    pT = 0;
    dT = 0;
    var maybeGl = canvas.getContext("webgl2");
    console.log("init renderer");
    console.log(gl);
    if (maybeGl === null || maybeGl === undefined) {
        //TODO: make it more obvious
        console.log("no webgl :(");
        throw ("No webGL");
    }
    gl = maybeGl;
    //var x = gl.createTexture()
    projection = mat4.create();
    view = mat4.create();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    //gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    //gl.depthMask(false)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    programs = { "map": mapProgram(), "shell": shellProgram() };
    light.lubo = gl.createBuffer();
}
function radians(deg) {
    return deg * Math.PI / 180;
}
var mapCenter = vec3.create();
var hitDone = false;
var frameTimes = Array(60).fill(0);
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
function draw(cT) {
    dT = cT - pT;
    pT = cT;
    // doFPS(dT);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    theTank.tick(dT),
        theTank.draw();
    theMap.tick(dT);
    theMap.draw();
    requestAnimationFrame(draw);
}
function resizeCallback() {
    //menu.style.zIndex = "-1";
    if (window.innerWidth > aspectRatio * window.innerHeight) {
        canvas.width = window.innerHeight * aspectRatio;
        canvas.height = window.innerHeight;
        overlayCanvas.width = window.innerHeight * aspectRatio;
        overlayCanvas.height = window.innerHeight;
        menu.style.width = (window.innerHeight * aspectRatio).toFixed(0) + "px";
        menu.style.height = window.innerHeight.toFixed(0) + "px";
        menu.setAttribute("width", String(window.innerHeight * aspectRatio));
        menu.setAttribute("height", String(window.innerHeight));
    }
    else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerWidth / aspectRatio;
        overlayCanvas.width = window.innerWidth;
        overlayCanvas.height = window.innerWidth / aspectRatio;
        // menu.style.width = window.innerWidth.toFixed(0) + "px";
        // menu.style.height = (window.innerWidth/aspectRatio).toFixed(0) + "px";
        // menu.setAttribute("width", String(window.innerWidth));
        // menu.setAttribute("height", String(window.innerWidth/aspectRatio));
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
function drawMenu() {
    gui.clearRect(0, 0, gui.canvas.width, gui.canvas.height);
    // gui.fillStyle = "blue";
    // gui.fillRect(0, 0, gui.canvas.width, gui.canvas.height)
    requestAnimationFrame(drawMenu);
}
function main() {
    var a = null;
    var b = a;
    console.log(b);
    console.log("here2");
    //init stuff
    canvas = document.getElementById(canvasID);
    overlayCanvas = document.getElementById(overlayCanvasID);
    menu = document.getElementById(menuID); //TODO do I actually need?
    initializeRenderer();
    //TODO: message if webgl isn't availalbe.
    gui = overlayCanvas.getContext("2d"); //!!!!!
    resizeCallback();
    window.addEventListener('resize', resizeCallback);
    //TODO: everything below this line happens after menu
    theMap = new TankMap(programs["map"], vec3.fromValues(1.0, 0.5, 0.0), mapExtremety, mapWidth, mapHeight, mapSmoothness, mapTesseltation);
    theTank = new Tank(programs["map"], (theMap.getWidth() / 2) + 0.2, theMap.getWidth() / 2, 0, 0.2, vec3.fromValues(1.0, 0, 0), theMap);
    requestAnimationFrame(drawMenu);
    // document.onkeydown = keyDown;
    // document.onkeyup = keyUp;
    // // window.addEventListener("onkeydown", (e:KeyboardEvent)=> keyDown(e));
    // // window.addEventListener("onkeyup", (e)=> keyUp(e));
    // mapCenter = theMap.getPosition(theMap.getWidth()/2, theMap.getWidth()/2);//TODO: theMap.points[Math.floor(theMap.points.length/2)][Math.floor(theMap.points.length/2)][2];
    // theCam = new Camera(20, mapCenter[2], mapCenter);
    // document.onkeypress = okp;
    // document.onmouseup = omu;
    // document.onmousedown = omd;
    // document.onmousemove = omm;
    // document.onwheel = oms;
    // requestAnimationFrame(draw);
}
function okp(event) {
    if (event.key == " ") {
        theTank.fire();
    }
}
function omd(event) {
    theCam.mouseDown(event);
}
function omu(event) {
    theCam.mouseUp(event);
}
function omm(event) {
    theCam.mouseMove(event);
}
function oms(event) {
    theCam.onScroll(event);
}
function keyDown(e) {
    pressedKeys[e.key] = true;
}
function keyUp(e) {
    pressedKeys[e.key] = false;
}
