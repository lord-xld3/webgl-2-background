import {Gluu} from './gluu/gluu';

// Create a Gluu context
let canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = new Gluu(canvas);
const gl = ctx.gl;

let maxtextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
console.log(maxtextures);

const vertexShader = `#version 300 es
in vec4 a_position;
in vec4 a_color;
in vec2 a_uv;

out vec4 v_color;
out vec2 v_uv;

void main() {
    gl_Position = a_position; 
    v_color = a_color;
    v_uv = a_uv;
}`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_uv;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    vec4 texColor = texture(u_texture, v_uv);
    outColor = texColor * v_color;
}`;

// Create a shader program from the vertex and fragment shaders
const program = ctx.makeProgram(vertexShader, fragmentShader);

// A Vertex Array Object (VAO) can hold multiple Vertex Buffer Objects (VBOs),
// each with their own vertex attributes and buffers.
const vao = ctx.makeVAO();
vao.bind();


// A BufferInfo object contains the data, target, usage, and stride of a buffer.
// stride is the number of bytes between two of the same attribute.
const triangleBuffer = {
    data: new Float32Array([
        0.0, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.5,
        0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0,
        -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0
    ]),
    target: gl.ARRAY_BUFFER,
    usage: gl.STATIC_DRAW,
    stride: 9 * Float32Array.BYTES_PER_ELEMENT,
};

// Keeping the pointers separate lets us reuse pointers for different buffers
const positionPointer = {
    key: "a_position",
    size: 3,
    stride: triangleBuffer.stride,
};

const colorPointer = {
    key: "a_color",
    size: 4,
    offset: 3 * Float32Array.BYTES_PER_ELEMENT,
    stride: triangleBuffer.stride,
};

const uvPointer = {
    key: "a_uv",
    size: 2,
    offset: 7 * Float32Array.BYTES_PER_ELEMENT,
    stride: triangleBuffer.stride,
};

// Keeping the buffer and VBO separate allows us to 're-interpret' the buffer
// with different vertex attribute pointers.
const vbo = ctx.makeVBO(program, [positionPointer, colorPointer, uvPointer], triangleBuffer);

// In this simple program we have one VAO and VBO so it doesn't need to be unbound
vbo.bind();
// vao.unbind();
// vbo.unbind();

// Set the texture
const textures = [
    {
        key: "myTexture",
        src: "/img/myself.jpg",
    },
];

ctx.scene_manager.init({
    myScene: {
        texture_infos: textures,
        models: [],
    },
}).then(() => {
    ctx.loadTextures("myScene");
});

// Pre-render stuff
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
ctx.resizeToCanvas();
render();

// Render loop
function render() {
    // Pre-draw stuff
    ctx.resizeToCanvas();
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Draw stuff
    gl.useProgram(program);
    // vao.bind();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // vao.unbind();
    
    // Post-draw stuff
    requestAnimationFrame(render);
}