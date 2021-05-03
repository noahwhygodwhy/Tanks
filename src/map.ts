import {mat4, vec2, vec3, vec4} from "./gl-matrix-es6.js"


import {lights, light_directional, light_point} from "./light.js"
import { Shell } from "./shell.js"

import {Tank} from "./tank.js"

//TODO: eliminate dependency on passed gl/program arguments
import {gl, programs} from "./tanks.js"






function adjustment(maxHeight:number, extremety:number, k:number):number
{
    var randomBetweenNegativeOneAndOne = ((Math.random()-0.5)*2)
    //console.log("randomBetweenNegativeOneAndOne", randomBetweenNegativeOneAndOne);
    return randomBetweenNegativeOneAndOne*maxHeight*extremety*extremety/((k*k)+1);
}



function tesselate(input:Array<Array<number>>):Array<Array<number>>
{
    var output = new Array<Array<number>>((input.length*2)-1);
    //console.log("output size: ", output.length);
    
    for(var x = 0; x < output.length; x++)
    {
        output[x] = new Array<number>(output.length);
    }
    for(var x = 0; x < input.length; x++)
    {
        for(var y = 0; y < input.length; y++)
        {
            output[x*2][y*2] = input[x][y]
            //console.log("accessing ", x*2, y*2);

            if(x != input.length-1)
            {
                output[(x*2)+1][y*2] = (input[x][y]+input[x+1][y])/2
                if(y != input.length-1)
                {
                    output[(x*2)+1][(y*2)+1] = (input[x][y]+input[x+1][y+1])/2 //TODO: might need to average all 4
                }
            }
            if(y != input.length-1)
            {
                output[x*2][(y*2)+1] = (input[x][y]+input[x][y+1])/2
            }
        }
    }
    return output;
}


function gaussianBlur(input:Array<Array<number>>):Array<Array<number>>
{

    var kernal=[[1, 4, 6, 4, 1],
                [4, 16, 24, 16, 4],
                [6, 24, 36, 24, 6],
                [4, 16, 24, 16, 4],
                [1, 4, 6, 4, 1]]
    
    var output = new Array<Array<number>>(input.length);
    function gaussian(tlX:number, tlY:number):number
    {
        var toReturn = 0;
        //console.log("tlX:",tlX)
        //console.log("tlY:",tlY)
        var div = 0;
        for(var a = 0; a < 5; a++)
        {
            for(var b = 0; b < 5; b++)
            {
                //console.log("b:",b, "a:",a);
                if(input[tlX+a-2] != undefined)
                {
                    if(input[tlX+a-2][tlY+b-2]!= undefined)
                    {
                        toReturn+=input[tlX+a-2][tlY+b-2]*kernal[a][b];
                        div+=kernal[a][b]
                    }
                    //console.log(input[tlX+a-2][tlY+b-2]);
                }

                // toReturn+=input[tlX+a-2][tlY+b-2]*kernal[a][b];
                // console.log(input[tlX+a-2][tlY+b-2]);
                
            }
        }
        return toReturn/div;
        
    }
    for(var x = 0; x < input.length; x++)
    {
        output[x] = new Array<number>(input.length);
        for(var y = 0; y < input.length; y++)
        {
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


function diamondRound(k:number, sideWidth:number, toReturn:Array<Array<number>>, extremety:number, maxHeight:number):Array<Array<number>>
{
    // console.log("D")
    // console.log("k:", k)
    // console.log("power: ", Math.pow(2, k))
    // console.log("rounds:", Math.pow(Math.pow(2, k)-1, 2))
    for(var i = 0; i < Math.pow(2, k); i++)
    {
        for(var j = 0; j < Math.pow(2, k); j++)
        {

            //console.log("i: ", i)
            //console.log("j: ", j)
            var newVal = ((toReturn[sideWidth*(i)][sideWidth*(j)] +
            toReturn[sideWidth*(i)][sideWidth*(j+1)] + 
            toReturn[sideWidth*(i+1)][sideWidth*(j)] + 
            toReturn[sideWidth*(i+1)][sideWidth*(j+1)])/4.0)

            newVal+=adjustment(maxHeight, extremety, k);
            //newVal+=((Math.random()-0.5)*2)*((maxHeight*extremety)/k)//TODO:miiiight need to be a log not a division by k, mess around with it

            //newVal+=1;
            //console.log((sideWidth/2)+(sideWidth*i), (sideWidth/2)+(sideWidth*j), "<=", newVal.toFixed(2))
            toReturn[(sideWidth/2)+(sideWidth*i)][(sideWidth/2)+(sideWidth*j)] = newVal;


        }
    }

    return toReturn;
    //todo:
}





function squareRound(k:number, sideWidth:number,  toReturn:Array<Array<number>>, extremety:number, maxHeight:number):Array<Array<number>>
{
    //console.log("S");
    // for(var i = 0; i < k+1; i++)
    // {
    //     for(var j = 0; j <k+1; j++)
    //     {
    for(var i = 0; i < Math.pow(2, k); i++)
    {
        for(var j = 0; j < Math.pow(2, k); j++)
        {
            var left = [sideWidth*(i), sideWidth*(j+0.5)];
            var right = [sideWidth*(i+1), sideWidth*(j+0.5)];
            var top = [sideWidth*(i+0.5), sideWidth*(j)];
            var bottom = [sideWidth*(i+0.5), sideWidth*(j+1)];

            [left, right, bottom, top].forEach(e=>
                {
                    var div = 0;
                    var sum = 0;
                    var originX = e[0];
                    var originY = e[1];
                    
                    var leftX = originX-(sideWidth/2);
                    var rightX = originX+(sideWidth/2);
                    var topY = originY-(sideWidth/2);
                    var bottomY = originY+(sideWidth/2);

                    //console.log([originX, originY], "from", [leftX, originY], [rightX, originY], [originX, topY], [originX, bottomY]);

                    [leftX, rightX].forEach(f=>{
                        if(f>=sideWidth*i && f<=sideWidth*(i+1))
                        {                          
                            sum+=toReturn[f][originY];
                            div++;
                        }
                    });
                    [topY, bottomY].forEach(f=>{
                        if(f>=sideWidth*j && f<=sideWidth*(j+1))
                        {
                            sum+=toReturn[originX][f];
                            div++;
                        }
                    });
                    
                    var newVal = (sum/div);
                    newVal+=adjustment(maxHeight, extremety, k);
                    //newVal+=1;
                    //console.log(originX, originY, "<=", newVal.toFixed(2))
                    //console.log("would be adding", (((Math.random()-0.5)*2)*((maxHeight*extremety)))/((k*5)+1))//needs to get smaller as k gets bigger
                    //newVal+=((Math.random()-0.5)*2)*((maxHeight*extremety)/(k+1))
                    
                    toReturn[originX][originY] = newVal;

                })
        }
    }

    return toReturn;
    //todo:
}

//(n^2)+1 should be <= number of points you want in the map
//midpoint being the height of the map/2
//extremety being a value from 0 to 1
function getDiamondSquare(n:number, midpoint:number, extremety:number):Array<Array<number>>
{
    var pointCount = Math.pow(2, n)+1

    var toReturn = new Array<Array<number>>(pointCount);

    for(var i = 0; i < pointCount; i++)
    {
        toReturn[i] = new Array<number>();
        for(var j = 0; j < pointCount; j++)
        {
            toReturn[i][j] = 0 //TODO: remove inner fill for testing
        }
    }

    //toReturn.fill(new Array<number>(pointCount).fill(0));//TODO: remove inner fill for testing


    toReturn[0][0] = midpoint;
    toReturn[0][pointCount-1] = midpoint;
    toReturn[pointCount-1][0] = midpoint;
    toReturn[pointCount-1][pointCount-1] = midpoint;


    for(var i = 0; i < n; i++)
    {

        var sideWidth = (pointCount-1)/(Math.pow(2, i));

        //printDS(toReturn);
        toReturn = diamondRound(i, sideWidth, toReturn, extremety, midpoint);
        //printDS(toReturn);
        toReturn = squareRound(i, sideWidth, toReturn, extremety, midpoint);
    }
    return toReturn;

}


function printDS(ds:Array<Array<number>>):void
{
    // console.log("width: ", ds.length);
    var outputString = ""
    ds.forEach(e=>
    {
        outputString+="[";
        e.forEach(f=>
        {
            outputString+=(f.toFixed(2)+",").padStart(7, "_");
        });
        outputString+="]\n";
    });
    // console.log(outputString)
}




function makeTwoTris(points:Array<Array<vec3>>, x:number, y:number):Array<Array<vec3>>
{
    if((x+y)%2 == 0)
    {
        var tri1 = [points[x][y], points[x+1][y+1], points[x][y+1]];
        var tri2 = [points[x][y], points[x+1][y], points[x+1][y+1]];
        return [tri1, tri2]
    }
    else
    {
        var tri1 = [points[x][y], points[x+1][y], points[x][y+1]];
        var tri2 = [points[x+1][y], points[x+1][y+1], points[x][y+1]];
        return [tri1, tri2]
    }

}


//width must be n where the width of the map is 2^n
//height should be //TODO:
//pointCount doesn't matter naymore
//noise doesn't matter
function createMap(width:number, height:number, extremety:number, smoothness:number, tesselation:number):Array<Array<vec3>>
{

    var trueWidth = Math.pow(2, width)+1;
    var toReturn = Array<Array<vec3>>(trueWidth);
    var ds = getDiamondSquare(width, height/2, extremety);
    //printDS(ds);
    for(var i = 0; i < smoothness; i++)
    {
        ds = gaussianBlur(ds);
    }
    //ds = gaussianBlur(ds);
    //printDS(ds);
    for(var i = 0; i < tesselation; i++)
    {
        ds = tesselate(ds);
    }
    //printDS(ds);
    


    for(var x = 0; x < ds.length; x++)
    {
        toReturn[x] = Array<vec3>(trueWidth);
        for(var y = 0; y < ds.length; y++)
        {
            // if(y == 0 || y == ds.length || x == 0 || x == ds.length)
            // {
            //     toReturn[x][y] = vec3.fromValues(x-(trueWidth/2), y-(trueWidth/2), -2000) //mayyybe?
            // }
            // else
            // {
            toReturn[x][y] = vec3.fromValues(x, y, (ds[x][y]-(height/2)))

            var scaleFactor = 1/(Math.pow(2, tesselation));

            toReturn[x][y][0] *= scaleFactor
            toReturn[x][y][1] *= scaleFactor
            // }
        }
    }
    return toReturn;
}







function vertIt(points:Array<Array<vec3>>):Float32Array
{
    // console.log("vert it");
    var toReturn = new Float32Array((points.length-1)*(points.length-1)*2*3*6)
    
    var index = 0;
    for(var x = 0; x < points.length-1; x++)
    {
        for(var y = 0; y < points.length-1; y++)
        {

            //TODO: alternate triangle direction 
            // var tri1 = [points[x][y], points[x+1][y+1], points[x][y+1]];
            // var tri2 = [points[x][y], points[x+1][y], points[x+1][y+1]];

            var tris = makeTwoTris(points, x, y);

            tris.forEach(t=>
                {
                    var n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), t[0], t[1]), vec3.subtract(vec3.create(), t[0], t[2])));

                    t.forEach(p=>
                        {
                            toReturn[index++] = p[0];
                            toReturn[index++] = p[1];
                            toReturn[index++] = p[2];
                            toReturn[index++] = n[0];
                            toReturn[index++] = n[1];
                            toReturn[index++] = n[2];
                        })
                }
            )
        }
    }

    return toReturn;
}



function normalizeToSumToOne(i:vec3):vec3
{
    var sum = i[0] + i[1] + i[2];
    var mult = 1/sum;
    return vec3.scale(vec3.create(), i, mult);
}


function getBarry(tri:Array<vec3>, point:vec2):vec3
{
    // console.log("getbarry");
    // console.log("tri", tri);
    // console.log("point:", point);

    function sign(a:vec2, b:vec2, p:vec2):number
    {
        return (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
    }
    
    var x = sign(point, tri[0], tri[1]);
    var y = sign(point, tri[1], tri[2]);
    var z = sign(point, tri[2], tri[0]);

    //console.log("x, y, z:", [x, y, z]);
    return normalizeToSumToOne(vec3.fromValues(x, y, z));
    // console.log("normalized")
    // return vec3.fromValues(x, y, z);
}


export class TankMap
{
    points:Array<Array<vec3>>
    vertices:Float32Array

    color:vec3;

    sun:light_directional;

    vao:WebGLVertexArrayObject|null
    vbo:WebGLBuffer|null

    shells:Array<Shell>

    transformMatrix:mat4

    tesselationFactor:number
    program:WebGLProgram
    width:number;

    constructor(program:WebGLProgram, color:vec3, extremety:number, width:number, height:number, smoothness:number, tesselation:number)
    {

        this.program = program

        this.shells = new Array<Shell>();
        this.width = Math.pow(2, width)+1;

        this.sun = new light_directional(
            gl,
            vec4.fromValues(0.1, 0.1, 0.1, 1.0),
            vec4.fromValues(0.5, 0.5, 0.5, 1.0),
            vec4.fromValues(0.1, 0.1, 0.1, 1.0),
            vec3.normalize(vec3.fromValues(0,0,0), vec3.fromValues(0.0, 0.0, -1.0)));
            
        lights.push(this.sun);

        this.tesselationFactor = Math.pow(2, tesselation)


        this.transformMatrix = mat4.create();
        this.color = color;

        //var scaleFactor = 1024.0/Math.pow(2, width);

        this.points = createMap(width, height, extremety, smoothness, tesselation);

        
        
        this.vertices = vertIt(this.points);

        this.vao = gl.createVertexArray();
    
        this.vbo = gl.createBuffer();
        this.bufferVertices()
        

        

    }
    
    getWidth()
    {
        return this.width;
    }



    bufferVertices()
    {
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "aPos"), 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, "aNormal"));
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "aNormal"), 3, gl.FLOAT, false, 24, 12);
       
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    addShell(sh:Shell)
    {
        this.shells.push(sh);
    }


    removeShell(sh:Shell)
    {
        // console.log("removing shell");
        this.shells.splice(this.shells.findIndex(e=>e===sh), 1)
    }
    
    allShellsDone()
    {
        return this.shells.length == 0;
    }

    detectHits()
    {
        // console.log("detecting hits");

        this.shells.forEach((sh, index, obj)=>{
            var position = this.getPosition(sh.position[0], sh.position[1]);
            if(position == null)
            {
                // console.log("outside of bounds");
                this.removeShell(sh)
                return;
            }
            var terrainHeight = position[2];
            if(sh.position[2] <= terrainHeight)
            {
                // console.log("colide");
                this.hit(sh.position[0], sh.position[1], sh.position[2], sh.boomRadius);
                sh.colide(sh.position, this)
                //obj.splice(index, 1);
            }
        })
    }


    //this is what is called when a hit is registered, not to see if a hit should be registered
    //it puts a hole in the map
    //x and y are floats
    //r could also be a float
    hit(hitX:number, hitY:number, hitZ:number, hitR:number)
    {
       // console.log("HIT at ", [hitX,hitY,hitZ], "radius:", hitR);
        function inSphere(vertX:number, vertY:number, vertZ:number):boolean
        {
            var term1 = Math.pow(vertX-hitX, 2);
            var term2 = Math.pow(vertY-hitY, 2);
            var term3 = Math.pow(vertZ-hitZ, 2);
            var vertR = Math.sqrt((term1+term2+term3));
            return vertR<=hitR;
        }
        function inCylinder(vertX:number, vertY:number):boolean
        {
            var term1 = Math.pow(vertX-hitX, 2);
            var term2 = Math.pow(vertY-hitY, 2);
            var vertR = Math.sqrt((term1+term2));
            return vertR<=hitR;
        }
        function getLoweredZ(vertX:number, vertY:number):number
        {
            var term1 = Math.pow(vertX-hitX, 2);
            var term2 = Math.pow(vertY-hitY, 2);
            //console.log("sqrt interior:", term1+term2-Math.pow(hitR, 2));
            var theRoot = Math.sqrt(-(term1+term2-Math.pow(hitR, 2)));
            return (-theRoot)+hitZ;
        }
        function getPartiallyLoweredZ(vertX:number, vertY:number, vertZ:number):number
        {
            if(vertZ < hitZ)
            {
                return 0;
            }

            var distX = Math.pow(hitX-vertX, 2);
            var distY = Math.pow(hitY-vertY, 2);
            var dist = Math.sqrt(distX+distY);
            var theRoot = Math.sqrt(Math.pow(hitR, 2)-dist);
            return theRoot;
        }

        for(var x = Math.floor((hitX-hitR)*this.tesselationFactor)-1; x < Math.ceil((hitX+hitR)*this.tesselationFactor)+1; x++)
        {
            for(var y = Math.floor((hitY-hitR)*this.tesselationFactor)-1; y < Math.ceil((hitY+hitR)*this.tesselationFactor)+1; y++)
            {
                if(x >= 0 && y >= 0 && y < this.points.length && x < this.points.length)
                {
                    if(inCylinder(this.points[x][y][0], this.points[x][y][1]))
                    {
                        if(inSphere(this.points[x][y][0], this.points[x][y][1], this.points[x][y][2]))
                        {
                            this.points[x][y][2] = getLoweredZ(this.points[x][y][0], this.points[x][y][1]);
                        }
                        else
                        {
                            var lowerValue = getPartiallyLoweredZ(this.points[x][y][0], this.points[x][y][1], this.points[x][y][2]);
                            this.points[x][y][2] = this.points[x][y][2]-lowerValue;//getPartiallyLoweredZ(this.points[x][y][0], this.points[x][y][1]);
                        }
                    }
                }
            }
        }

        this.vertices = vertIt(this.points);
        this.bufferVertices();
    }


    tick(dT:number):void
    {
        // console.log("map tick");
        // console.log("num of shells: ", this.shells.length);
        this.shells.forEach(e=>{e.tick(dT)});
        this.detectHits();
            //nothing for now
    }

    draw():void
    {
        //gl.useProgram(program)

        gl.uniform3fv(gl.getUniformLocation(this.program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "model"), false, new Float32Array(this.transformMatrix))
        
        //gl.uniform1f(gl.getUniformLocation(program, "gl_PointSize"), 5);

        gl.bindVertexArray(this.vao);

        //gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);

        var normalMat = mat4.create()
        mat4.invert(normalMat, this.transformMatrix)
        mat4.transpose(normalMat, normalMat)
        
        var normalMatLoc = gl.getUniformLocation(this.program, "normalMat")
        gl.uniformMatrix4fv(normalMatLoc, false, normalMat as Float32List);
    
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/6)

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this.shells.forEach(e=>{e.draw()});
    }


    gta(coord:number)//global to array
    {
        return coord*this.tesselationFactor
    }

    getTriangle(unscaledX:number, unscaledY:number, scaledX:number, scaledY:number):Array<vec3>
    {

        function allPositive(a:vec3):boolean
        {
            return a[0] >= 0 && a[1] >= 0 && a[2] >= 0;
        }

        var arrayX = Math.floor(scaledX)
        var arrayY = Math.floor(scaledY)

        //console.log("arrayX: ", arrayX);
        
        //console.log("arrayY: ", arrayY);

        var tris =  makeTwoTris(this.points, arrayX, arrayY);
        //[[this.points[arrayX][arrayY], this.points[arrayX+1][arrayY+1], this.points[arrayX][arrayY+1]],[this.points[arrayX][arrayY], this.points[arrayX+1][arrayY], this.points[arrayX+1][arrayY+1]]];
   
        // console.log(tris);

        var goodTri = Array<vec3>(3);
        tris.forEach(tri=>{

            var b = getBarry(tri, vec2.fromValues(unscaledX, unscaledY));
            if(allPositive(b))
            {
                //console.log("returning good triangle");
                //console.log("b:", b);
                goodTri= tri;
                return tri;
            }
        })

        return goodTri;
   
    }


    getPosition(xcoord:number, ycoord:number):vec3|null
    {
        if(xcoord < 0 || ycoord < 0 || xcoord>this.width || ycoord>this.width)
        {
            return null;
        }
        var scaledX = this.gta(xcoord);
        var scaledY = this.gta(ycoord);
        var tri = this.getTriangle(xcoord, ycoord, scaledX, scaledY)
        var b = getBarry(tri, vec2.fromValues(xcoord, ycoord));
        return vec3.fromValues(xcoord, ycoord, tri[0][2]*b[1] + tri[1][2]*b[2] + tri[2][2]*b[0]);
    }

    
    getUp(xcoord:number, ycoord:number):vec3
    {
        var scaledX = this.gta(xcoord);
        var scaledY = this.gta(ycoord);

        var t = this.getTriangle(xcoord, ycoord, scaledX, scaledY);

        var n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), t[0], t[1]), vec3.subtract(vec3.create(), t[0], t[2])));
        return n;
    }
}