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
const cubeBuffer = {
    data: new Float32Array([
        // Front face
        -0.5,  0.5,  0.5,  0.0, 1.0, // Top-left (0)
         0.5,  0.5,  0.5,  1.0, 1.0, // Top-right (1)
         0.5, -0.5,  0.5,  1.0, 0.0, // Bottom-right (2)
        -0.5, -0.5,  0.5,  0.0, 0.0, // Bottom-left (3)
        
        // Back face
         0.5,  0.5, -0.5,  0.0, 1.0, // Top-right (4)
        -0.5,  0.5, -0.5,  1.0, 1.0, // Top-left (5)
        -0.5, -0.5, -0.5,  1.0, 0.0, // Bottom-left (6)
         0.5, -0.5, -0.5,  0.0, 0.0, // Bottom-right (7)
        
        // Top face
        -0.5,  0.5, -0.5,  0.0, 1.0, // Top-left (8)
         0.5,  0.5, -0.5,  1.0, 1.0, // Top-right (9)
         0.5,  0.5,  0.5,  1.0, 0.0, // Bottom-right (10)
        -0.5,  0.5,  0.5,  0.0, 0.0, // Bottom-left (11)
        
        // Bottom face
        -0.5, -0.5,  0.5,  0.0, 1.0, // Top-left (12)
         0.5, -0.5,  0.5,  1.0, 1.0, // Top-right (13)
         0.5, -0.5, -0.5,  1.0, 0.0, // Bottom-right (14)
        -0.5, -0.5, -0.5,  0.0, 0.0, // Bottom-left (15)
        
        // Right face
         0.5,  0.5,  0.5,  0.0, 1.0, // Top-left (16)
         0.5,  0.5, -0.5,  1.0, 1.0, // Top-right (17)
         0.5, -0.5, -0.5,  1.0, 0.0, // Bottom-right (18)
         0.5, -0.5,  0.5,  0.0, 0.0, // Bottom-left (19)
        
        // Left face
        -0.5,  0.5, -0.5,  0.0, 1.0, // Top-left (20)
        -0.5,  0.5,  0.5,  1.0, 1.0, // Top-right (21)
        -0.5, -0.5,  0.5,  1.0, 0.0, // Bottom-right (22)
        -0.5, -0.5, -0.5,  0.0, 0.0  // Bottom-left (23)
    ])
};

// Keeping the pointers separate lets us reuse pointers for different buffers
const positionPointer = {
    key: "a_position",
    size: 3,
    stride: 5 * 4,
};

const uvPointer = {
    key: "a_uv",
    size: 2,
    offset: 3 * 4,
    stride: 5 * 4,
};

// Keeping the buffer and VBO separate allows us to 're-interpret' the buffer
// with different vertex attribute pointers.
const vbo = gluu.createVBO(program, cubeBuffer, [positionPointer, uvPointer]);
vbo.bind();

const ebo = gluu.createEBO(
    new Uint16Array([
        // Front face
         0,  1,  2,
         2,  3,  0,
        
        // Back face
         4,  5,  6,
         6,  7,  4,
        
        // Top face
         8,  9, 10,
        10, 11,  8,
        
        // Bottom face
        12, 13, 14,
        14, 15, 12,
        
        // Right face
        16, 17, 18,
        18, 19, 16,
        
        // Left face
        20, 21, 22,
        22, 23, 20,
    ])
);

ebo.bind();

const ubo = gluu.createUBO(program, new Float32Array([0.0]), {
    key: "uniformBlock",
    binding: 0,
}, {
    u_tick: {
        offset: 0,
    },
});

ubo.bind();

const myscene = async () => gluu.createScene({
    textures: [
        {
            src: "img/myself.jpg",
            tex_unit: 0,
            params: {
                [gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
                [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
                [gl.TEXTURE_WRAP_S]: gl.REPEAT,
                [gl.TEXTURE_WRAP_T]: gl.REPEAT,
            },
        },
    ],
    meshes: [
        {
            program,
            geometry: [
                {
                    vao,
                    draw: () => {
                        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                    },
                },
            ],
            globals: [
                gl.CULL_FACE,
                gl.DEPTH_TEST,
            ],
        },
    ],
});

myscene().then((scene) => {
    scene.load();
    render();
});


// Pre-render stuff
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gluu.resize();

let tick = 0.0;
let speed = 0.01;
const maxTick = 1.0;
let lastTime = performance.now();

function render() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    tick = (tick + (deltaTime * speed)) % maxTick;

    ubo.setUniform({ key: "u_tick", data: new Float32Array([tick]) });
    ubo.update();

    // Additional update logic or rendering here
    gluu.drawScene();

    requestAnimationFrame(render);
}