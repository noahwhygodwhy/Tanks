import {perlin} from "./perlin.js"
import {mat4, vec2, vec3} from "./gl-matrix-es6.js"
import e from "express";









function adjustment(maxHeight:number, extremety:number, k:number):number
{
    var randomBetweenNegativeOneAndOne = ((Math.random()-0.5)*2)
    //console.log("randomBetweenNegativeOneAndOne", randomBetweenNegativeOneAndOne);
    return randomBetweenNegativeOneAndOne*maxHeight*extremety*extremety/((k*k)+1);
}




function gaussianBlur(input:Array<Array<number>>):Array<Array<number>>
{

    var kernal=[[1, 4, 6, 4, 1],
                [4, 16, 24, 16, 4],
                [6, 24, 36, 24, 6],
                [4, 16, 24, 16, 4],
                [1, 4, 6, 4, 1]]
    var div = 256;

    var output = new Array<Array<number>>(input.length);
    function gaussian(tlX:number, tlY:number):number
    {
        var toReturn = 0;
        //console.log("tlX:",tlX)
        //console.log("tlY:",tlY)
        for(var a = 0; a < 5; a++)
        {
            for(var b = 0; b < 5; b++)
            {
                //console.log("b:",b, "a:",a);
                toReturn+=input[tlX+a-2][tlY+b-2]*kernal[a][b];
                
            }
        }
        return toReturn/div;
        
    }
    for(var x = 0; x < input.length; x++)
    {
        output[x] = new Array<number>(input.length);
        for(var y = 0; y < input.length; y++)
        {
            if(y < 2 || x < 2 || y > input.length-3 || x>input.length-3)
            {
                output[x][y] = input[x][y];
            }
            else
            {
                output[x][y] = gaussian(x, y);
            }
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
    console.log(outputString)
}






//width must be n where the width of the map is 2^n
//height should be //TODO:
//pointCount doesn't matter naymore
//noise doesn't matter
function createMap(width:number, height:number, extremety:number, scaleFactor:vec3):Array<Array<vec3>>
{

    var trueWidth = Math.pow(2, width);
    var toReturn = Array<Array<vec3>>(trueWidth);
    var ds = getDiamondSquare(width, height/2, extremety);
    printDS(ds);
    ds = gaussianBlur(ds);
    printDS(ds);


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
            toReturn[x][y][0] *= scaleFactor[0]
            toReturn[x][y][1] *= scaleFactor[1]
            toReturn[x][y][2] *= scaleFactor[2]
            // }
        }
    }
    return toReturn;
}




function pointsToVertices(points:Array<vec2>, width:number, height:number):Float32Array
{
    var toReturn = new Float32Array(12*(points.length-1));
    var k = 0;
    for(var i = 0; i < points.length-1; i++)
    {
        var curr = points[i];
        var next = points[i+1];

        //first triangle
        toReturn[k] = curr[0];
        toReturn[k+1] = curr[1];

        toReturn[k+2] = curr[0];
        toReturn[k+3] = 0;

        toReturn[k+4] = next[0];
        toReturn[k+5] = 0;

        toReturn[k+6] = curr[0];
        toReturn[k+7] = curr[1];

        toReturn[k+8] = next[0];
        toReturn[k+9] = 0;

        toReturn[k+10] = next[0];
        toReturn[k+11] = curr[1];

        
        k = k+12;
    }

    /*toReturn[k] = 0;
    toReturn[k+1] = 0;
    toReturn[k+2] = 1;
    toReturn[k+3] = 0;
    toReturn[k+4] = 0;
    toReturn[k+5] = 1;*/
    
    return toReturn;
}




function vertIt(points:Array<Array<vec3>>):Float32Array
{
    console.log("vert it");
    var toReturn = new Float32Array(points.length*points.length*3)
    
    var width = points.length;
    var index = 0;
    for(var y = 0; y < points.length; y++)
    {
        for(var x = 0; x < points.length; x++)
        {
            // toReturn[(((y*width)+x)*3)+0] = points[y][x][0];
            // toReturn[(((y*width)+x)*3)+1] = points[y][x][1];
            // toReturn[(((y*width)+x)*3)+2] = points[y][x][2];
            toReturn[index++] = points[y][x][0];
            toReturn[index++] = points[y][x][1];
            toReturn[index++] = points[y][x][2];

            //console.log("adding point", [points[y][x][0], points[y][x][1], points[y][x][2]])
        }
    }

    return toReturn;
}

function indexIt(width:number):Int32Array
{
    console.log("width: ", width)
    console.log("int32array length", 6*width);
    var toReturn = new Int32Array(6*width*width);



    function tdti(a:number, b:number):number
    {
        return (a*width)+b;
    }

    var index = 0;
    for(var x = 0; x < width-1; x++)
    {
        for(var y = 0; y < width-1; y++)
        {
            toReturn[index++] = (y*width)+x;
            toReturn[index++] = ((y+1)*width)+x;
            toReturn[index++] = ((y+1)*width)+x+1;

            toReturn[index++] = (y*width)+x;
            toReturn[index++] = ((y+1)*width)+x+1;
            toReturn[index++] = (y*width)+x+1;



            // var tdti1 = tdti(y, x)
            // //var tdti6 = tdti1*6

            // toReturn[index++] = tdti1
            // toReturn[index++] = tdti1+x;
            // toReturn[index++] = tdti1+x+1;

            // toReturn[index++] = tdti1
            // toReturn[index++] = tdti1+x+1;
            // toReturn[index++] = tdti1+1;
        }
    }

    return toReturn;
}


export class TankMap
{
    points:Array<Array<vec3>>
    vertices:Float32Array
    indices: Int32Array

    color:vec3;


    vao:WebGLVertexArrayObject|null
    vbo:WebGLBuffer|null
    ebo:WebGLBuffer|null

    transformMatrix:mat4



    constructor(gl:WebGL2RenderingContext, program:WebGLProgram, color:vec3, extremety:number, width:number, height:number)
    {





        console.log("map constructor");
        console.log("gl:", gl);

        //console.log("scale factor: ", scaleFactor)
        this.transformMatrix = mat4.create();
        //mat4.scale(this.transformMatrix, this.transformMatrix, vec3.fromValues(scaleFactor, scaleFactor, 1));
        this.color = color;

        var scaleFactor = 1024.0/Math.pow(2, width);
        mat4.translate(this.transformMatrix, this.transformMatrix, vec3.fromValues(-Math.pow(2, width)/2*scaleFactor,-Math.pow(2, width)/2*scaleFactor,0))

        this.points = createMap(width, height, extremety, vec3.fromValues(scaleFactor, scaleFactor, 2));
        this.vertices = vertIt(this.points);

        this.indices = indexIt(Math.pow(2, width));

        
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
    

        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPos"));
        gl.vertexAttribPointer(gl.getAttribLocation(program, "aPos"), 3, gl.FLOAT, false, 0, 0);

        this.ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        

        

    }
    

    draw(gl:WebGL2RenderingContext, program:WebGLProgram):void
    {
        //gl.useProgram(program)
        
        gl.uniform3fv(gl.getUniformLocation(program, "color"), new Float32Array(this.color));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, new Float32Array(this.transformMatrix))
        
        //gl.uniform1f(gl.getUniformLocation(program, "gl_PointSize"), 5);

        gl.bindVertexArray(this.vao);
        //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);

        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
        
        //gl.drawArrays(gl.POINTS, 0, this.vertices.length/3)

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

}