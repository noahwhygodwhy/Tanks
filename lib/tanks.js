import { Camera } from './camera.js';
import { mat4, vec3, common } from './gl-matrix-es6.js';
import { bufferLights, light } from './light.js';
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
export const aspectRatio = 16 / 9; //TODO: get rid of
// var zoom:number;
export var theCam;
var theMap;
// var theTank:Tank
var pT;
var dT;
var fired = false;
var players;
var playerTurn = 0;
export var pressedKeys = { "w": false, "s": false, "a": false, "d": false, "r": false, "f": false };
export var MAX_POINT_LIGHTS = 8;
export var MAX_SPOT_LIGHTS = 8;
export var MAX_DIRECTIONAL_LIGHTS = 2;
export var pointLightBufferOffset;
export var spotLightBufferOffset;
export var directionalLightBufferOffset;
function initializeRenderer() {
    console.log("init renderer");
    pT = 0;
    dT = 0;
    console.log("canvas: ", canvas);
    let maybeGl = canvas.getContext("webgl2");
    console.log("maybegl:", maybeGl);
    if (maybeGl === null || maybeGl === undefined) {
        //TODO: make it more obvious
        console.log("no webgl :(");
        throw ("No webGL");
    }
    gl = maybeGl;
    //let x = gl.createTexture()
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
export function useProgram(program) {
    gl.useProgram(program);
    gl.bindBuffer(gl.UNIFORM_BUFFER, light.lubo);
    let lightUniformIndex = gl.getUniformBlockIndex(program, "Lights");
    gl.uniformBlockBinding(program, lightUniformIndex, 1);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, light.lubo);
    bufferLights(gl, program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, theCam.getView());
    gl.uniform3fv(gl.getUniformLocation(program, "viewPos"), theCam.getPos());
    //var orthoWidth = 20;
    //orthoWidth = Math.pow(2, mapWidth);
    let orthoWidth = 20 * (theCam.getZoom());
    mat4.ortho(projection, -orthoWidth, orthoWidth, -orthoWidth / aspectRatio, orthoWidth / aspectRatio, -3000, 4000);
    //mat4.perspective(projection, common.toRadian(70), gl.canvas.width / gl.canvas.height, 0.1, 10000)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, projection);
}
function draw(cT) {
    dT = cT - pT;
    pT = cT;
    // doFPS(dT);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    players.forEach(t => { t.tick(dT); });
    players.forEach(t => { t.draw(); });
    theMap.tick(dT);
    if (fired && theMap.allShellsDone()) {
        fired = false;
        playerTurn = (playerTurn + 1) % players.length;
        players[playerTurn].turnOn();
    }
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
    }
    else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerWidth / aspectRatio;
        overlayCanvas.width = window.innerWidth;
        overlayCanvas.height = window.innerWidth / aspectRatio;
        menu.style.width = window.innerWidth + "px";
        menu.style.height = (window.innerWidth / aspectRatio) + "px";
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
    let a = null;
    let b = a;
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
    window.startGameFn = startGame;
}
function hexToVec(input) {
    let r = parseInt(input.substring(1, 3), 16);
    let g = parseInt(input.substring(3, 5), 16);
    let b = parseInt(input.substring(5, 7), 16);
    return vec3.fromValues(r, g, b);
}
export function startGame(settings) {
    console.log(settings);
    console.log("STARTING GAME FN");
    theMap = new TankMap(programs["map"], vec3.fromValues(1.0, 0.5, 0.0), settings["extremety"], settings["mapWidth"], settings["mapHeight"], settings["smoothness"], settings["tesselation"]);
    players = new Array();
    let angleBetween = 360 / settings["playerQuantity"];
    for (let i = 0; i < settings["playerQuantity"]; i++) {
        let x = (Math.cos(common.toRadian(angleBetween * i)) * ((theMap.getWidth() / 2) - 1)) + (theMap.getWidth() / 2) - 1;
        let y = (Math.sin(common.toRadian(angleBetween * i)) * ((theMap.getWidth() / 2) - 1)) + (theMap.getWidth() / 2);
        players.push(new Tank(programs["map"], x, y, 0, 0.2, hexToVec(settings["players"][i]["color"]), settings["players"][i]["name"], theMap));
    }
    mapCenter = theMap.getPosition(theMap.getWidth() / 2, theMap.getWidth() / 2); //TODO: theMap.points[Math.floor(theMap.points.length/2)][Math.floor(theMap.points.length/2)][2];
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
function okp(event) {
    if (event.key == " " && !fired) {
        players[playerTurn].fire();
        players[playerTurn].turnOff();
        fired = true;
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
