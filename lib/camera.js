import { mat4, common, vec3 } from './gl-matrix-es6.js';
const minZoom = 0.2;
const maxZoom = 4.0;
export class Camera {
    //minRadius:number;
    constructor(radius, height, lookingAt) {
        //this.minRadius = 5;
        this.zoom = 1.0;
        this.lastX = 0;
        this.lastY = 0;
        this.md = false;
        this.md2 = false;
        this.yaw = 0;
        this.pitch = 0;
        this.radius = radius;
        this.height = height;
        this.pos = vec3.fromValues(0, radius, height);
        this.lookingAt = lookingAt;
        this.worldUp = vec3.fromValues(0, 0, 1);
        this.up = vec3.fromValues(0, 0, 1);
        this.front = vec3.create();
    }
    // setMinRadius(r:number)
    // {
    //     this.minRadius = r;
    // }
    getPos() {
        return this.pos;
    }
    getView() {
        return mat4.lookAt(mat4.create(), this.pos, vec3.add(vec3.create(), this.lookingAt, vec3.fromValues(0, 0, this.height)), this.up);
    }
    getZoom() {
        return this.zoom;
    }
    updateVectors() {
        var x = Math.cos(common.toRadian(this.yaw)) * Math.cos(common.toRadian(this.pitch));
        var z = Math.sin(common.toRadian(this.pitch));
        var y = Math.sin(common.toRadian(this.yaw)) * Math.cos(common.toRadian(this.pitch));
        this.front = vec3.normalize(vec3.create(), vec3.fromValues(x, y, z));
        var right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.front, this.worldUp));
        this.up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), right, this.front));
        this.pos = vec3.add(vec3.create(), this.lookingAt, vec3.add(vec3.create(), vec3.scale(vec3.create(), this.front, -this.radius), vec3.fromValues(0, 0, this.height)));
        //this.pos = vec3.add(vec3.create(), this.lookingAt, vec3.add(vec3.create(), vec3.scale(vec3.create(), this.front, -this.radius*this.zoom), vec3.fromValues(0, 0, this.height)));
    }
    mouseDown(event) {
        var x = event.clientX;
        var y = event.clientY;
        var aabb = event.target.getBoundingClientRect();
        if (aabb.left <= x && x < aabb.right && aabb.top <= y && y < aabb.bottom) {
            this.lastX = x;
            this.lastY = y;
            if (event.button == 0) {
                this.md = true;
            }
            if (event.button == 2) {
                this.md2 = true;
            }
        }
    }
    mouseUp(event) {
        this.md = false;
        this.md2 = false;
    }
    mouseMove(event) {
        var x = event.clientX;
        var y = event.clientY;
        var f = 0.03;
        var moveX = f * (x - this.lastX);
        var moveY = f * (y - this.lastY);
        if (this.md) {
            this.yaw -= moveX;
            this.pitch -= moveY;
        }
        if (this.md2) {
            this.height += moveY;
        }
        this.lastX = x;
        this.lastY = y;
        this.updateVectors();
    }
    onScroll(event) {
        var deltaY = event.deltaY / 500;
        this.zoom = Math.max(minZoom, Math.min(maxZoom, this.zoom + deltaY));
    }
}
