import * as gluu from "./gluu/Gluu";

// Create a Gluu context
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = gluu.init(canvas);

const vertexShader = `#version 300 es
in vec4 a_position;
in vec2 a_uv;

out vec2 v_uv;

void main() {
    gl_Position = a_position; 
    v_uv = a_uv;
}`;

const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform uniformBlock {
    float u_tick;
};

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    // 'Scroll' texcoords
	vec2 scroll1 = v_uv + vec2(u_tick, u_tick * 4.0);
	vec2 scroll2 = v_uv + vec2(-u_tick + 0.5, u_tick * 4.0 + 0.5);

    // Textures
	vec4 tex1 = texture(u_texture, scroll1);
	vec4 tex2 = texture(u_texture, scroll2);

	outColor = vec4(tex1 * tex2);
}`;

// Create a shader program from the vertex and fragment shaders
const program = gluu.createProgram(vertexShader, fragmentShader);

// A Vertex Array Object (VAO) can hold multiple Vertex Buffer Objects (VBOs),
// each with their own vertex attributes and buffers.
const vao = gluu.createVAO();
vao.bind();

// A BufferInfo object contains the data, target, usage, and stride of a buffer.
// stride is the number of bytes between two of the same attribute.
const triangleBuffer: gluu.VertexBufferInfo = {
    data: new Float32Array([
        0.0, 0.5, 0.0, 0.0, 0.5,
        0.5, -0.5, 0.0, 1.0, 1.0,
        -0.5, -0.5, 0.0, 0.0, 1.0
    ]),
    target: gl.ARRAY_BUFFER,
    usage: gl.STATIC_DRAW,
    stride: 5 * 4,
};

// Keeping the pointers separate lets us reuse pointers for different buffers
const positionPointer: gluu.AttributeInfo = {
    key: "a_position",
    size: 3,
    stride: triangleBuffer.stride,
};

const uvPointer: gluu.AttributeInfo = {
    key: "a_uv",
    size: 2,
    offset: 3 * 4,
    stride: triangleBuffer.stride,
};

// Keeping the buffer and VBO separate allows us to 're-interpret' the buffer
// with different vertex attribute pointers.
const vbo = gluu.createVBO(program, triangleBuffer, [positionPointer, uvPointer]);

// In this simple program we have one VAO and VBO so it doesn't need to be unbound
vbo.bind();
// vao.unbind();
// vbo.unbind();

const ubo = gluu.createUBO(program, new Float32Array([0.0]), {
    key: "uniformBlock",
    binding: 0,
}, {
    u_tick: {
        offset: 0,
    },
});

ubo.bind();

const scenes = gluu.createScenes({
    "myScene": {
        texture_infos: [
            {
                src: "img/water.png",
                params: {
                    [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_LINEAR,
                    [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
                }
            },
        ],
        models: [
            {
                mesh: [
                    {
                        vao: vao,
                        drawFunc: () => {
                            gl.drawArrays(gl.TRIANGLES, 0, 3);
                        },
                    },
                ],
                material: {
                    prog: program,
                },
            },
        ],
    },
});

scenes.then(() => {
    gluu.loadScene("myScene")
    render();
}).catch((e) => console.error(e));

// Pre-render stuff
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gluu.resize();

let tick = 0.0;
let maxTick = 1.0;

// Render loop
function render() {
    // Pre-draw stuff
    gluu.resize();
    gl.clear(gl.COLOR_BUFFER_BIT);

    tick = (tick + 0.0001) % maxTick;
    
    ubo.setUniform({key: "u_tick", data: new Float32Array([tick])})
    ubo.update();
    // Draw stuff
    gluu.drawScene("myScene");
    // Post-draw stuff
    requestAnimationFrame(render);
}