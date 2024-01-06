import { Util, VAO, VBO, SceneManager} from "./gluu/Gluu";

// Create a Gluu context
let canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = new Util(canvas);
const gl = ctx.gl;

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
const program = ctx.createProgram(vertexShader, fragmentShader);

// A Vertex Array Object (VAO) can hold multiple Vertex Buffer Objects (VBOs),
// each with their own vertex attributes and buffers.
const vao = new VAO(gl);
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
const vbo = new VBO(gl, program, triangleBuffer, [positionPointer, colorPointer, uvPointer]);

// In this simple program we have one VAO and VBO so it doesn't need to be unbound
vbo.bind();
// vao.unbind();
// vbo.unbind();

const sceneManager = new SceneManager(gl);

sceneManager.init({
    "myScene": {
        texture_infos: [{
            src: "/img/myself.jpg",
            params: {
                [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_LINEAR,
                [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
            },
        }],
        models: [{
            mesh: [{
                vao: vao,
                drawFunc: () => {
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                },
            }],
            material: {
                prog: program,
            },
        }],
    },
}).then(() => {
    render();
});

// Pre-render stuff
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
ctx.resizeCanvas();


// Render loop
function render() {
    // Pre-draw stuff
    ctx.resizeCanvas();
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Draw stuff
    sceneManager.draw("myScene");
    
    // Post-draw stuff
    requestAnimationFrame(render);
}