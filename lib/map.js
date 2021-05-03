import { mat4, vec2, vec3, vec4 } from "./gl-matrix-es6.js";
import { lights, light_directional } from "./light.js";
//TODO: eliminate dependency on passed gl/program arguments
import { gl, useProgram } from "./tanks.js";
function adjustment(maxHeight, extremety, k) {
    let randomBetweenNegativeOneAndOne = ((Math.random() - 0.5) * 2);
    //console.log("randomBetweenNegativeOneAndOne", randomBetweenNegativeOneAndOne);
    return randomBetweenNegativeOneAndOne * maxHeight * extremety * extremety / ((k * k) + 1);
}
function tesselate(input) {
    let output = new Array((input.length * 2) - 1);
    //console.log("output size: ", output.length);
    for (let x = 0; x < output.length; x++) {
        output[x] = new Array(output.length);
    }
    for (let x = 0; x < input.length; x++) {
        for (let y = 0; y < input.length; y++) {
            output[x * 2][y * 2] = input[x][y];
            //console.log("accessing ", x*2, y*2);
            if (x != input.length - 1) {
                output[(x * 2) + 1][y * 2] = (input[x][y] + input[x + 1][y]) / 2;
                if (y != input.length - 1) {
                    output[(x * 2) + 1][(y * 2) + 1] = (input[x][y] + input[x + 1][y + 1]) / 2; //TODO: might need to average all 4
                }
            }
            if (y != input.length - 1) {
                output[x * 2][(y * 2) + 1] = (input[x][y] + input[x][y + 1]) / 2;
            }
        }
    }
    return output;
}
function gaussianBlur(input) {
    let kernal = [[1, 4, 6, 4, 1],
        [4, 16, 24, 16, 4],
        [6, 24, 36, 24, 6],
        [4, 16, 24, 16, 4],
        [1, 4, 6, 4, 1]];
    let output = new Array(input.length);
    function gaussian(tlX, tlY) {
        let toReturn = 0;
        //console.log("tlX:",tlX)
        //console.log("tlY:",tlY)
        let div = 0;
        for (let a = 0; a < 5; a++) {
            for (let b = 0; b < 5; b++) {
                //console.log("b:",b, "a:",a);
                if (input[tlX + a - 2] != undefined) {
                    if (input[tlX + a - 2][tlY + b - 2] != undefined) {
                        toReturn += input[tlX + a - 2][tlY + b - 2] * kernal[a][b];
                        div += kernal[a][b];
                    }
                    //console.log(input[tlX+a-2][tlY+b-2]);
                }
                // toReturn+=input[tlX+a-2][tlY+b-2]*kernal[a][b];
                // console.log(input[tlX+a-2][tlY+b-2]);
            }
        }
        return toReturn / div;
    }
    for (let x = 0; x < input.length; x++) {
        output[x] = new Array(input.length);
        for (let y = 0; y < input.length; y++) {
            // if(y < 2 || x < 2 || y > input.length-3 || x>input.length-3)
            // {
            //     output[x][y] = input[x][y];
            // }
            // else
            // {
            //     output[x][y] = gaussian(x, y);
            // }
            output[x][y] = gaussian(x, y);
        }
    }
    return output;
}
function diamondRound(k, sideWidth, toReturn, extremety, maxHeight) {
    // console.log("D")
    // console.log("k:", k)
    // console.log("power: ", Math.pow(2, k))
    // console.log("rounds:", Math.pow(Math.pow(2, k)-1, 2))
    for (let i = 0; i < Math.pow(2, k); i++) {
        for (let j = 0; j < Math.pow(2, k); j++) {
            //console.log("i: ", i)
            //console.log("j: ", j)
            let newVal = ((toReturn[sideWidth * (i)][sideWidth * (j)] +
                toReturn[sideWidth * (i)][sideWidth * (j + 1)] +
                toReturn[sideWidth * (i + 1)][sideWidth * (j)] +
                toReturn[sideWidth * (i + 1)][sideWidth * (j + 1)]) / 4.0);
            newVal += adjustment(maxHeight, extremety, k);
            //newVal+=((Math.random()-0.5)*2)*((maxHeight*extremety)/k)//TODO:miiiight need to be a log not a division by k, mess around with it
            //newVal+=1;
            //console.log((sideWidth/2)+(sideWidth*i), (sideWidth/2)+(sideWidth*j), "<=", newVal.toFixed(2))
            toReturn[(sideWidth / 2) + (sideWidth * i)][(sideWidth / 2) + (sideWidth * j)] = newVal;
        }
    }
    return toReturn;
    //todo:
}
function squareRound(k, sideWidth, toReturn, extremety, maxHeight) {
    //console.log("S");
    // for(let i = 0; i < k+1; i++)
    // {
    //     for(let j = 0; j <k+1; j++)
    //     {
    for (let i = 0; i < Math.pow(2, k); i++) {
        for (let j = 0; j < Math.pow(2, k); j++) {
            let left = [sideWidth * (i), sideWidth * (j + 0.5)];
            let right = [sideWidth * (i + 1), sideWidth * (j + 0.5)];
            let top = [sideWidth * (i + 0.5), sideWidth * (j)];
            let bottom = [sideWidth * (i + 0.5), sideWidth * (j + 1)];
            [left, right, bottom, top].forEach(e => {
                let div = 0;
                let sum = 0;
                let originX = e[0];
                let originY = e[1];
                let leftX = originX - (sideWidth / 2);
                let rightX = originX + (sideWidth / 2);
                let topY = originY - (sideWidth / 2);
                let bottomY = originY + (sideWidth / 2);
                //console.log([originX, originY], "from", [leftX, originY], [rightX, originY], [originX, topY], [originX, bottomY]);
                [leftX, rightX].forEach(f => {
                    if (f >= sideWidth * i && f <= sideWidth * (i + 1)) {
                        sum += toReturn[f][originY];
                        div++;
                    }
                });
                [topY, bottomY].forEach(f => {
                    if (f >= sideWidth * j && f <= sideWidth * (j + 1)) {
                        sum += toReturn[originX][f];
                        div++;
                    }
                });
                let newVal = (sum / div);
                newVal += adjustment(maxHeight, extremety, k);
                //newVal+=1;
                //console.log(originX, originY, "<=", newVal.toFixed(2))
                //console.log("would be adding", (((Math.random()-0.5)*2)*((maxHeight*extremety)))/((k*5)+1))//needs to get smaller as k gets bigger
                //newVal+=((Math.random()-0.5)*2)*((maxHeight*extremety)/(k+1))
                toReturn[originX][originY] = newVal;
            });
        }
    }
    return toReturn;
    //todo:
}
//(n^2)+1 should be <= number of points you want in the map
//midpoint being the height of the map/2
//extremety being a value from 0 to 1
function getDiamondSquare(n, midpoint, extremety) {
    let pointCount = Math.pow(2, n) + 1;
    let toReturn = new Array(pointCount);
    for (let i = 0; i < pointCount; i++) {
        toReturn[i] = new Array();
        for (let j = 0; j < pointCount; j++) {
            toReturn[i][j] = 0; //TODO: remove inner fill for testing
        }
    }
    //toReturn.fill(new Array<number>(pointCount).fill(0));//TODO: remove inner fill for testing
    toReturn[0][0] = midpoint;
    toReturn[0][pointCount - 1] = midpoint;
    toReturn[pointCount - 1][0] = midpoint;
    toReturn[pointCount - 1][pointCount - 1] = midpoint;
    for (let i = 0; i < n; i++) {
        let sideWidth = (pointCount - 1) / (Math.pow(2, i));
        //printDS(toReturn);
        toReturn = diamondRound(i, sideWidth, toReturn, extremety, midpoint);
        //printDS(toReturn);
        toReturn = squareRound(i, sideWidth, toReturn, extremety, midpoint);
    }
    return toReturn;
}
function printDS(ds) {
    // console.log("width: ", ds.length);
    let outputString = "";
    ds.forEach(e => {
        outputString += "[";
        e.forEach(f => {
            outputString += (f.toFixed(2) + ",").padStart(7, "_");
        });
        outputString += "]\n";
    });
    // console.log(outputString)
}
function makeTwoTris(points, x, y) {
    if ((x + y) % 2 == 0) {
        let tri1 = [points[x][y], points[x + 1][y + 1], points[x][y + 1]];
        let tri2 = [points[x][y], points[x + 1][y], points[x + 1][y + 1]];
        return [tri1, tri2];
    }
    else {
        let tri1 = [points[x][y], points[x + 1][y], points[x][y + 1]];
        let tri2 = [points[x + 1][y], points[x + 1][y + 1], points[x][y + 1]];
        return [tri1, tri2];
    }
}
//width must be n where the width of the map is 2^n
//height should be //TODO:
//pointCount doesn't matter naymore
//noise doesn't matter
function createMap(width, height, extremety, smoothness, tesselation) {
    let trueWidth = Math.pow(2, width) + 1;
    let toReturn = Array(trueWidth);
    let ds = getDiamondSquare(width, height / 2, extremety);
    //printDS(ds);
    for (let i = 0; i < smoothness; i++) {
        ds = gaussianBlur(ds);
    }
    //ds = gaussianBlur(ds);
    //printDS(ds);
    for (let i = 0; i < tesselation; i++) {
        ds = tesselate(ds);
    }
    //printDS(ds);
    for (let x = 0; x < ds.length; x++) {
        toReturn[x] = Array(trueWidth);
        for (let y = 0; y < ds.length; y++) {
            // if(y == 0 || y == ds.length || x == 0 || x == ds.length)
            // {
            //     toReturn[x][y] = vec3.fromValues(x-(trueWidth/2), y-(trueWidth/2), -2000) //mayyybe?
            // }
            // else
            // {
            toReturn[x][y] = vec3.fromValues(x, y, (ds[x][y] - (height / 2)));
            let scaleFactor = 1 / (Math.pow(2, tesselation));
            toReturn[x][y][0] *= scaleFactor;
            toReturn[x][y][1] *= scaleFactor;
            // }
        }
    }
    return toReturn;
}
function vertIt(points) {
    // console.log("vert it");
    let toReturn = new Float32Array((points.length - 1) * (points.length - 1) * 2 * 3 * 6);
    let index = 0;
    for (let x = 0; x < points.length - 1; x++) {
        for (let y = 0; y < points.length - 1; y++) {
            //TODO: alternate triangle direction 
            // let tri1 = [points[x][y], points[x+1][y+1], points[x][y+1]];
            // let tri2 = [points[x][y], points[x+1][y], points[x+1][y+1]];
            let tris = makeTwoTris(points, x, y);
            tris.forEach(t => {
                let n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), t[0], t[1]), vec3.subtract(vec3.create(), t[0], t[2])));
                t.forEach(p => {
                    toReturn[index++] = p[0];
                    toReturn[index++] = p[1];
                    toReturn[index++] = p[2];
                    toReturn[index++] = n[0];
                    toReturn[index++] = n[1];
                    toReturn[index++] = n[2];
                });
            });
        }
    }
    return toReturn;
}
function normalizeToSumToOne(i) {
    let sum = i[0] + i[1] + i[2];
    let mult = 1 / sum;
    return vec3.scale(vec3.create(), i, mult);
}
function getBarry(tri, point) {
    // console.log("getbarry");
    // console.log("tri", tri);
    // console.log("point:", point);
    function sign(a, b, p) {
        return (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
    }
    let x = sign(point, tri[0], tri[1]);
    let y = sign(point, tri[1], tri[2]);
    let z = sign(point, tri[2], tri[0]);
    //console.log("x, y, z:", [x, y, z]);
    return normalizeToSumToOne(vec3.fromValues(x, y, z));
    // console.log("normalized")
    // return vec3.fromValues(x, y, z);
}
export class TankMap {
    constructor(program, color, extremety, width, height, smoothness, tesselation) {
        this.program = program;
        this.shells = new Array();
        this.width = Math.pow(2, width) + 1;
        this.sun = new light_directional(gl, vec4.fromValues(0.1, 0.1, 0.1, 1.0), vec4.fromValues(0.5, 0.5, 0.5, 1.0), vec4.fromValues(0.1, 0.1, 0.1, 1.0), vec3.normalize(vec3.fromValues(0, 0, 0), vec3.fromValues(0.0, 0.0, -1.0)));
        lights.push(this.sun);
        this.tesselationFactor = Math.pow(2, tesselation);
        this.transformMatrix = mat4.create();
        this.color = color;
        //let scaleFactor = 1024.0/Math.pow(2, width);
        this.points = createMap(width, height, extremety, smoothness, tesselation);
        this.vertices = vertIt(this.points);
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.bufferVertices();
    }
    getWidth() {
        return this.width;
    }
    bufferVertices() {
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "aPos"), 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, "aNormal"));
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    addShell(sh) {
        this.shells.push(sh);
    }
    removeShell(sh) {
        // console.log("removing shell");
        this.shells.splice(this.shells.findIndex(e => e === sh), 1);
    }
    allShellsDone() {
        return this.shells.length == 0;
    }
    detectHits() {
        // console.log("detecting hits");
        this.shells.forEach((sh, index, obj) => {
            let position = this.getPosition(sh.position[0], sh.position[1]);
            if (position == null) {
                // console.log("outside of bounds");
                this.removeShell(sh);
                return;
            }
            let terrainHeight = position[2];
            if (sh.position[2] <= terrainHeight) {
                // console.log("colide");
                this.hit(sh.position[0], sh.position[1], sh.position[2], sh.boomRadius);
                sh.colide(sh.position, this);
                //obj.splice(index, 1);
            }
        });
    }
    //this is what is called when a hit is registered, not to see if a hit should be registered
    //it puts a hole in the map
    //x and y are floats
    //r could also be a float
    hit(hitX, hitY, hitZ, hitR) {
        // console.log("HIT at ", [hitX,hitY,hitZ], "radius:", hitR);
        function inSphere(vertX, vertY, vertZ) {
            let term1 = Math.pow(vertX - hitX, 2);
            let term2 = Math.pow(vertY - hitY, 2);
            let term3 = Math.pow(vertZ - hitZ, 2);
            let vertR = Math.sqrt((term1 + term2 + term3));
            return vertR <= hitR;
        }
        function inCylinder(vertX, vertY) {
            let term1 = Math.pow(vertX - hitX, 2);
            let term2 = Math.pow(vertY - hitY, 2);
            let vertR = Math.sqrt((term1 + term2));
            return vertR <= hitR;
        }
        function getLoweredZ(vertX, vertY) {
            let term1 = Math.pow(vertX - hitX, 2);
            let term2 = Math.pow(vertY - hitY, 2);
            //console.log("sqrt interior:", term1+term2-Math.pow(hitR, 2));
            let theRoot = Math.sqrt(-(term1 + term2 - Math.pow(hitR, 2)));
            return (-theRoot) + hitZ;
        }
        function getPartiallyLoweredZ(vertX, vertY, vertZ) {
            if (vertZ < hitZ) {
                return 0;
            }
            let distX = Math.pow(hitX - vertX, 2);
            let distY = Math.pow(hitY - vertY, 2);
            let dist = Math.sqrt(distX + distY);
            let theRoot = Math.sqrt(Math.pow(hitR, 2) - dist);
            return theRoot;
        }
        for (let x = Math.floor((hitX - hitR) * this.tesselationFactor) - 1; x < Math.ceil((hitX + hitR) * this.tesselationFactor) + 1; x++) {
            for (let y = Math.floor((hitY - hitR) * this.tesselationFactor) - 1; y < Math.ceil((hitY + hitR) * this.tesselationFactor) + 1; y++) {
                if (x >= 0 && y >= 0 && y < this.points.length && x < this.points.length) {
                    if (inCylinder(this.points[x][y][0], this.points[x][y][1])) {
                        if (inSphere(this.points[x][y][0], this.points[x][y][1], this.points[x][y][2])) {
                            this.points[x][y][2] = getLoweredZ(this.points[x][y][0], this.points[x][y][1]);
                        }
                        else {
                            let lowerValue = getPartiallyLoweredZ(this.points[x][y][0], this.points[x][y][1], this.points[x][y][2]);
                            this.points[x][y][2] = this.points[x][y][2] - lowerValue; //getPartiallyLoweredZ(this.points[x][y][0], this.points[x][y][1]);
                        }
                    }
                }
            }
        }
        this.vertices = vertIt(this.points);
        this.bufferVertices();
    }
    tick(dT) {
        // console.log("map tick");
        // console.log("num of shells: ", this.shells.length);
        this.shells.forEach(e => { e.tick(dT); });
        this.detectHits();
        //nothing for now
    }
    draw() {
        useProgram(this.program);
        //gl.useProgram(program)
        gl.uniform3fv(gl.getUniformLocation(this.program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "model"), false, new Float32Array(this.transformMatrix));
        //gl.uniform1f(gl.getUniformLocation(program, "gl_PointSize"), 5);
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        //gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
        let normalMat = mat4.create();
        mat4.invert(normalMat, this.transformMatrix);
        mat4.transpose(normalMat, normalMat);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "normalMat"), false, normalMat);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 6);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.shells.forEach(e => { e.draw(); });
    }
    gta(coord) {
        return coord * this.tesselationFactor;
    }
    getTriangle(unscaledX, unscaledY, scaledX, scaledY) {
        function allPositive(a) {
            return a[0] >= 0 && a[1] >= 0 && a[2] >= 0;
        }
        let arrayX = Math.floor(scaledX);
        let arrayY = Math.floor(scaledY);
        //console.log("arrayX: ", arrayX);
        //console.log("arrayY: ", arrayY);
        let tris = makeTwoTris(this.points, arrayX, arrayY);
        //[[this.points[arrayX][arrayY], this.points[arrayX+1][arrayY+1], this.points[arrayX][arrayY+1]],[this.points[arrayX][arrayY], this.points[arrayX+1][arrayY], this.points[arrayX+1][arrayY+1]]];
        // console.log(tris);
        let goodTri = Array(3);
        tris.forEach(tri => {
            let b = getBarry(tri, vec2.fromValues(unscaledX, unscaledY));
            if (allPositive(b)) {
                //console.log("returning good triangle");
                //console.log("b:", b);
                goodTri = tri;
                return tri;
            }
        });
        return goodTri;
    }
    getPosition(xcoord, ycoord) {
        if (xcoord < 0 || ycoord < 0 || xcoord > this.width - 1 || ycoord > this.width - 1) {
            return null;
        }
        let scaledX = this.gta(xcoord);
        let scaledY = this.gta(ycoord);
        let tri = this.getTriangle(xcoord, ycoord, scaledX, scaledY);
        let b = getBarry(tri, vec2.fromValues(xcoord, ycoord));
        return vec3.fromValues(xcoord, ycoord, tri[0][2] * b[1] + tri[1][2] * b[2] + tri[2][2] * b[0]);
    }
    getUp(xcoord, ycoord) {
        let scaledX = this.gta(xcoord);
        let scaledY = this.gta(ycoord);
        let t = this.getTriangle(xcoord, ycoord, scaledX, scaledY);
        let n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), t[0], t[1]), vec3.subtract(vec3.create(), t[0], t[2])));
        return n;
    }
}
