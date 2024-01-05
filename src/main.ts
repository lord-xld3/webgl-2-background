import {Gluu, AttributeInfo, VertexBufferInfo, UniformBlockInfo, UniformInfo} from './gluu';

// Create a Gluu context
let canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = new Gluu(canvas);
const gl = ctx.gl;

const vertexShader = `#version 300 es
in vec4 a_position;
in vec4 a_color;

out vec4 v_color;

void main() {
    gl_Position = a_position; 
    v_color = a_color;
}`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;

uniform uniformStruct {
    vec4 u_color;
    vec4 u_ambient;
};

out vec4 outColor;

void main() {
    outColor = (v_color * u_color) + u_ambient;
}`;

// Create a shader program from the vertex and fragment shaders
const program = ctx.makeProgram(vertexShader, fragmentShader);

// A Vertex Array Object (VAO) can hold multiple Vertex Buffer Objects (VBOs),
// each with their own vertex attributes and buffers.
const vao = ctx.makeVAO();
vao.bind();


// A BufferInfo object contains the data, target, usage, and stride of a buffer.
// stride is the number of bytes between two of the same attribute.
const triangleBuffer: VertexBufferInfo = {
    data: new Float32Array([
        0.0, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
        -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 1.0
    ]),
    target: gl.ARRAY_BUFFER,
    usage: gl.STATIC_DRAW,
    stride: 7 * Float32Array.BYTES_PER_ELEMENT,
};

// Keeping the pointers separate lets us reuse pointers for different buffers
const positionPointer: AttributeInfo = {
    key: "a_position",
    size: 3,
    stride: triangleBuffer.stride,
};

const colorPointer: AttributeInfo = {
    key: "a_color",
    size: 4,
    offset: 3 * Float32Array.BYTES_PER_ELEMENT,
    stride: triangleBuffer.stride,
};

// Keeping the buffer and VBO separate allows us to 're-interpret' the buffer
// with different vertex attribute pointers.
const vbo = ctx.makeVBO(program, [positionPointer, colorPointer], triangleBuffer);

// In this simple program we have one VAO and VBO so it doesn't need to be unbound
vbo.bind();
// vao.unbind();
// vbo.unbind();

// Set the uniform struct
const uboBlock: UniformBlockInfo = {
    key: "uniformStruct",
    binding: 0,
};

const uboBuffer = new Float32Array([
    0.2, 0.8, 0.5, 1.0,
    0.2, 0.8, 0.5, 1.0,
]);
const uInfo: UniformInfo = {
    "u_color": {
        offset: 0,
    },
    "u_ambient": {
        offset: 4,
    },
}
const ubo = ctx.makeUBO(program, uboBlock, uboBuffer, uInfo);

// Pre-render stuff
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
ctx.resizeToCanvas();
let tick = 0;
let maxTick = Math.PI;
render();


// Render loop
function render() {
    // Pre-draw stuff
    ctx.resizeToCanvas();
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Logic
    tick = (tick + 0.005) % maxTick;

    // Update the uniform struct
    ubo.setUniform(
        "u_color", 
        new Float32Array([Math.sin(tick), 0.2, 0.5, 1.0])
    );
    ubo.setUniform(
        "u_ambient", 
        new Float32Array([0.2, Math.sin(tick), 0.5, 1.0])
    );
    ubo.update();
    
    // Draw stuff
    gl.useProgram(program);
    // vao.bind();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // vao.unbind();
    
    // Post-draw stuff
    requestAnimationFrame(render);
}