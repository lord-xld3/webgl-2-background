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
        buffer: BufferInfo,
    ): VBO {
        return new VBO(this.gl, program, pointers, buffer);
    }

    public makeUBO(
        program: WebGLProgram,
        uniformBufferInfo: UniformBlockInfo,
        uniformInfos: UniformBufferInfo[],
        buffer: BufferInfo,
    ): UBO {
        return new UBO(this.gl, program, uniformBufferInfo, uniformInfos, buffer);
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

interface UniformBlockInfo {
    blockName: string;
    blockIndex: number;
    blockBinding: number;
}

interface UniformBufferInfo {
    buffer: WebGLBuffer;
    uniformName: string;
    uniformLocation: number;
}

class BufferObject {
    gl: WebGL2RenderingContext;
    buffer: BufferInfo;

    constructor(
        gl: WebGL2RenderingContext,
        buffer: BufferInfo,
    ) {
        this.gl = gl;
        this.buffer = {
            data: buffer.data,
            target: buffer.target,
            usage: buffer.usage,
        };
    }

    protected bind() {
        this.gl.bindBuffer(this.buffer.target, this.buffer.data);
    }

    protected unbind() {
        this.gl.bindBuffer(this.buffer.target, null);
    }

    protected bufferData() {
        this.gl.bufferData(this.buffer.target, this.buffer.data, this.buffer.usage);
    }
}

class VBO extends BufferObject {
    pointers: VertexAttributePointer[];

    constructor(
        gl: WebGL2RenderingContext,
        program: WebGLProgram,
        pointers: AttributeInfo[],
        buffer: BufferInfo,
    ) {
        super(gl, buffer);
        this.pointers = pointers.map((pointer) => {
            const attributeLocation = gl.getAttribLocation(program, pointer.name);
            if (attributeLocation === -1) {
                throw new Error(`Attribute ${pointer.name} not found`);
            }
            return {
                attributeLocation,
                size: pointer.size,
                type: pointer.type || gl.FLOAT,
                normalized: pointer.normalized || false,
                stride: pointer.stride || 0,
                offset: pointer.offset || 0,
            };
        });
    }

    public bind() {
        super.bind();
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

    protected unbind() {
        super.unbind();
        this.pointers.forEach((pointer) => {
            this.gl.disableVertexAttribArray(pointer.attributeLocation);
        });
    }

    protected bufferData() {
        super.bufferData();
    }
}

class UBO extends BufferObject {
    uniformBufferInfo: UniformBlockInfo;
    program: WebGLProgram;
    uniformInfos: UniformBufferInfo[];

    constructor(
        gl: WebGL2RenderingContext,
        program: WebGLProgram,
        uniformBufferInfo: UniformBlockInfo,
        uniformInfos: UniformBufferInfo[],
        buffer: BufferInfo,
    ) {
        super(gl, buffer);
        this.program = program;
        this.uniformBufferInfo = uniformBufferInfo;
        this.uniformInfos = uniformInfos;
    }

    protected bind() {
        super.bind();
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.uniformBufferInfo.blockIndex, this.buffer.data);
    }

    protected unbind() {
        super.unbind();
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.uniformBufferInfo.blockIndex, null);
    }

    protected bufferData() {
        super.bufferData();
        const blockIndex = this.gl.getUniformBlockIndex(this.program, this.uniformBufferInfo.blockName);
        this.gl.uniformBlockBinding(this.program, blockIndex, this.uniformBufferInfo.blockBinding);
    }

    setUniform(data: Float32Array, offset: number = 0) {
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.buffer.data);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, offset * Float32Array.BYTES_PER_ELEMENT, data);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
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