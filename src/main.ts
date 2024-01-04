import {Gluu, AttributeInfo, BufferInfo} from './gluu';

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = new Gluu(canvas);

const vertexShader = `#version 300 es
in vec4 position;

void main() {
    gl_Position = position;
}`;

const fragmentShader = `#version 300 es
precision highp float;

out vec4 color;

void main() {
    color = vec4(1.0, 0.0, 0.0, 1.0);
}`;

const program = ctx.makeProgram(vertexShader, fragmentShader);

const vao = ctx.makeVAO();
vao.bind();

const vbo = ctx.makeVBO(program, [
    {
        name: "position",
        size: 2,
        type: ctx.gl.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0,
    },
], {
    data: new Float32Array([
        0.0, 0.5,
        0.5, -0.5,
        -0.5, -0.5,
    ]),
    target: ctx.gl.ARRAY_BUFFER,
    usage: ctx.gl.STATIC_DRAW,
});

vbo.bind();
vao.unbind();
vbo.unbind();

vao.bind();
ctx.gl.useProgram(program);
ctx.gl.drawArrays(ctx.gl.TRIANGLES, 0, 3);