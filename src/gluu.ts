/**
 * Represents a WebGL utility class for managing WebGL context, shaders, programs, and buffers.
 */
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

    /**
     * Creates a WebGL program using the provided vertex and fragment shaders.
     * @param vs The source code of the vertex shader.
     * @param fs The source code of the fragment shader.
     * @returns The created WebGL program.
     */
    public makeProgram(
        vs: string,
        fs: string,
    ): WebGLProgram {
        const prog = this.gl.createProgram() as WebGLProgram;
        this.gl.attachShader(prog, this.makeShader(vs, this.gl.VERTEX_SHADER));
        this.gl.attachShader(prog, this.makeShader(fs, this.gl.FRAGMENT_SHADER));
        this.gl.linkProgram(prog);
        if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(prog) as string);
        }
        return prog;
    }

    /**
     * Creates a new VBO (Vertex Buffer Object) using the provided WebGL program, attribute pointers, and buffer information.
     * @param prog The WebGL program to associate the VBO with.
     * @param ptrs An array of attribute information objects specifying the attribute pointers.
     * @param bufInfo The buffer information object containing the data for the VBO.
     * @returns The newly created VBO.
     */
    public makeVBO(
        prog: WebGLProgram,
        ptrs: AttributeInfo[],
        bufInfo: BufferInfo,
    ): VBO {
        return new VBO(this.gl, prog, ptrs, bufInfo);
    }

    /**
     * Creates a new VAO (Vertex Array Object).
     * @returns The newly created VAO.
     */
    public makeVAO(): VAO {
        return new VAO(this.gl);
    }

    /**
     * Creates a new UBO (Uniform Buffer Object) using the provided WebGL program, uniform block information, and buffer information.
     * @param prog The WebGL program to associate the UBO with.
     * @param blockInfo The uniform block information object specifying the uniform block.
     * @param data The data to store in the UBO.
     * @returns The newly created UBO.
     */
    public makeUBO(
        prog: WebGLProgram,
        blockInfo: UniformBlockInfo,
        data: ArrayBufferView,
    ): UBO {
        const bufInfo: BufferInfo = {
            data,
            target: this.gl.UNIFORM_BUFFER,
            usage: this.gl.STATIC_DRAW,
        };
        return new UBO(this.gl, prog, blockInfo, bufInfo);
    }

    /**
     * Resizes the canvas element to match the size of its parent container and updates the WebGL viewport accordingly.
     */
    public resizeToCanvas(): void {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
}

/**
 * Represents information about an attribute.
 */
interface AttributeInfo {
    name: string;
    size: number;
    type?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
}

/**
 * Represents a vertex attribute pointer.
 */
interface VertexAttributePointer {
    loc: number;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
}

/**
 * Represents information about a buffer.
 */
interface BufferInfo {
    data: ArrayBufferView;
    target: number;
    usage: number;
    stride?: number;
}

/**
 * Represents information about a uniform block.
 */
interface UniformBlockInfo {
    name: string;
    binding: number;
}

/**
 * Represents a buffer object in WebGL.
 */
abstract class BufferObject {
    gl: WebGL2RenderingContext;
    buffer: WebGLBuffer;
    bufInfo: BufferInfo;
    prog: WebGLProgram;

    constructor(
        gl: WebGL2RenderingContext,
        bufInfo: BufferInfo,
        prog: WebGLProgram,
    ) {
        this.gl = gl;
        this.buffer = this.gl.createBuffer() as WebGLBuffer;
        this.bufInfo = bufInfo;
        this.prog = prog;
    }

    /**
     * Binds the buffer object.
     */
    public abstract bind(): void;

    /**
     * Unbinds the buffer object.
     */
    public abstract unbind(): void;
}

/**
 * Represents a Vertex Buffer Object (VBO) in WebGL.
 * A VBO is used to store vertex data that can be efficiently accessed by the GPU.
 */
class VBO extends BufferObject {
    ptrs: VertexAttributePointer[];

    constructor(
        gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        ptrs: AttributeInfo[],
        bufInfo: BufferInfo,
    ) {
        super(gl, bufInfo, prog);
        this.ptrs = ptrs.map((ptr) => {
            const loc = this.gl.getAttribLocation(this.prog, ptr.name);
            if (loc === -1) {
                throw new Error(`Attribute ${ptr.name} not found in program`);
            }
            return {
                loc,
                size: ptr.size,
                type: ptr.type || this.gl.FLOAT,
                normalized: ptr.normalized || false,
                stride: ptr.stride || 0,
                offset: ptr.offset || 0,
            };
        });
        this.bind();
        this.gl.bufferData(this.bufInfo.target, this.bufInfo.data, this.bufInfo.usage);
        this.unbind();
    }

    /**
     * Binds the VBO and enables vertex attribute pointers.
     */
    public bind() {
        this.gl.bindBuffer(this.bufInfo.target, this.buffer);
        this.ptrs.forEach((ptr) => {
            this.gl.enableVertexAttribArray(ptr.loc);
            this.gl.vertexAttribPointer(
                ptr.loc,
                ptr.size,
                ptr.type,
                ptr.normalized,
                ptr.stride,
                ptr.offset,
            );
        });
    }

    /**
     * Unbinds the VBO and disables the vertex attributes.
     */
    public unbind() {
        this.ptrs.forEach((ptr) => {
            this.gl.disableVertexAttribArray(ptr.loc);
        });
        this.gl.bindBuffer(this.bufInfo.target, null);
    }
}

/**
 * Represents a Uniform Buffer Object (UBO) in WebGL.
 * A UBO is used to store uniform data that can be efficiently accessed by the GPU.
 */
class UBO extends BufferObject {
    blockInfo: UniformBlockInfo;
    blockIndex: number;

    constructor(
        gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        blockInfo: UniformBlockInfo,
        bufInfo: BufferInfo,
    ) {
        super(gl, bufInfo, prog);
        this.blockInfo = blockInfo;
        this.blockIndex = this.gl.getUniformBlockIndex(this.prog, this.blockInfo.name);
        if (this.blockIndex === -1) {
            throw new Error(`Uniform block ${this.blockInfo.name} not found in program`);
        }
        this.bind();
        this.gl.bufferData(this.bufInfo.target, this.bufInfo.data, this.bufInfo.usage);
        this.gl.uniformBlockBinding(this.prog, this.blockIndex, this.blockInfo.binding);
        this.gl.bindBufferBase(this.bufInfo.target, this.blockInfo.binding, this.buffer);
        this.unbind();
    }

    /**
     * Binds the UBO.
     */
    public bind() {
        this.gl.bindBuffer(this.bufInfo.target, this.buffer);
    }

    /**
     * Binds a range of the UBO.
     */
    public bindRange(offset: number, size: number) {
        this.gl.bindBufferRange(this.bufInfo.target, this.blockInfo.binding, this.buffer, offset, size);
    }

    /**
     * Unbinds the UBO.
     */
    public unbind() {
        this.gl.bindBuffer(this.bufInfo.target, null);
    }

    /**
     * Updates the data in the UBO.
     */
    public update(data: ArrayBufferView, offset: number = 0) {
        this.bind();
        this.gl.bufferSubData(this.bufInfo.target, offset, data);
        this.unbind();
    }
}

/**
 * Represents a Vertex Array Object (VAO) in WebGL.
 * A VAO is used to store VBOs and their associated vertex attribute pointers.
 */
class VAO {
    gl: WebGL2RenderingContext;
    vao: WebGLVertexArrayObject;
    
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.vao = this.gl.createVertexArray() as WebGLVertexArrayObject;
    }

    /**
     * Binds the vertex array object.
     */
    public bind() {
        this.gl.bindVertexArray(this.vao);
    }
    
    /**
     * Unbinds the vertex array object.
     */
    public unbind() {
        this.gl.bindVertexArray(null);
    }
}

export { 
    Gluu,
    AttributeInfo,
    BufferInfo,
    UniformBlockInfo,
};