class Gluu {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
        if (!this.gl) {
            throw new Error("WebGL2 is not supported");
        }
    }

    private makeShader(
        src: string,
        type: number,
    ): WebGLShader {
        const shader = this.gl.createShader(type) as WebGLShader;
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) as string);
        }
        return shader;
    }

    public makeProgram(
        vertexShader: string,
        fragmentShader: string,
    ): WebGLProgram {
        const program = this.gl.createProgram() as WebGLProgram;
        this.gl.attachShader(program, this.makeShader(vertexShader, this.gl.VERTEX_SHADER));
        this.gl.attachShader(program, this.makeShader(fragmentShader, this.gl.FRAGMENT_SHADER));
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(program) as string);
        }
        return program;
    }

    public makeVBO(
        program: WebGLProgram,
        pointers: AttributeInfo[],
        buffer_info: BufferInfo,
    ): VBO {
        return new VBO(this.gl, program, pointers, buffer_info);
    }

    public makeVAO(): VAO {
        return new VAO(this.gl);
    }

    public clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}

interface AttributeInfo {
    name: string;
    size: number;
    type?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
}

interface VertexAttributePointer {
    attributeLocation: number;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
}

interface BufferInfo {
    data: Float32Array | Uint16Array;
    target: number;
    usage: number;
}

abstract class BufferObject {
    gl: WebGL2RenderingContext;
    buffer: WebGLBuffer;
    buffer_info: BufferInfo;
    program: WebGLProgram;

    constructor(
        gl: WebGL2RenderingContext,
        buffer_info: BufferInfo,
        program: WebGLProgram,
    ) {
        this.gl = gl;
        this.buffer = this.gl.createBuffer() as WebGLBuffer;
        this.buffer_info = buffer_info;
        this.program = program;
    }

    public abstract bind(): void;
    public abstract unbind(): void;
}

class VBO extends BufferObject {
    pointers: VertexAttributePointer[];

    constructor(
        gl: WebGL2RenderingContext,
        program: WebGLProgram,
        pointers: AttributeInfo[],
        buffer_info: BufferInfo,
    ) {
        super(gl, buffer_info, program);
        this.pointers = pointers.map((pointer) => {
            const attributeLocation = this.gl.getAttribLocation(this.program, pointer.name);
            if (attributeLocation === -1) {
                throw new Error(`Attribute ${pointer.name} does not exist`);
            }
            return {
                attributeLocation,
                size: pointer.size,
                type: pointer.type || this.gl.FLOAT,
                normalized: pointer.normalized || false,
                stride: pointer.stride || 0,
                offset: pointer.offset || 0,
            };
        });
        this.bind();
        this.gl.bufferData(this.buffer_info.target, this.buffer_info.data, this.buffer_info.usage);
        this.unbind();
    }

    public bind() {
        this.gl.bindBuffer(this.buffer_info.target, this.buffer);
        this.pointers.forEach((pointer) => {
            this.gl.enableVertexAttribArray(pointer.attributeLocation);
            this.gl.vertexAttribPointer(
                pointer.attributeLocation,
                pointer.size,
                pointer.type,
                pointer.normalized,
                pointer.stride,
                pointer.offset,
            );
        });
    }

    public unbind() {
        this.pointers.forEach((pointer) => {
            this.gl.disableVertexAttribArray(pointer.attributeLocation);
        });
        this.gl.bindBuffer(this.buffer_info.target, null);
    }
}

class VAO {
    gl: WebGL2RenderingContext;
    vao: WebGLVertexArrayObject;
    
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.vao = this.gl.createVertexArray() as WebGLVertexArrayObject;
    }

    public bind() {
        this.gl.bindVertexArray(this.vao);
    }
    
    public unbind() {
        this.gl.bindVertexArray(null);
    }
}

export {
    Gluu,
    AttributeInfo,
    BufferInfo,
};