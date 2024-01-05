type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | 
Int32Array | Uint32Array | Float32Array | Float64Array;

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
     * @param uniforms An object containing information about the uniforms in the uniform block.
     * @returns The newly created UBO.
     */
    public makeUBO(
        prog: WebGLProgram,
        blockInfo: UniformBlockInfo,
        data: TypedArray,
        uniforms: UniformInfo = {},
    ): UBO {
        const bufInfo: BufferInfo = {
            data,
            target: this.gl.UNIFORM_BUFFER,
            usage: this.gl.STATIC_DRAW,
        };
        return new UBO(this.gl, prog, blockInfo, bufInfo, uniforms);
    }

    /**
     * Resizes the canvas element to match the size of its parent container and updates the WebGL viewport accordingly.
     */
    public resizeToCanvas(): void {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Creates a new texture using the provided texture information and image data.
     * @param texInfo The texture information object specifying the texture.
     * @param img The image data to store in the texture.
     * @returns The newly created texture.
     */
    public makeTexture(
        texInfo: TextureInfo,
        img: HTMLImageElement,
    ): Texture {
        return new Texture(this.gl, texInfo, img);
    }
}

/**
 * Represents information about an attribute.
 */
interface AttributeInfo {
    key: string;
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
    data: TypedArray;
    target: number;
    usage: number;
}

/**
 * Represents information about a vertex buffer.
 */
interface VertexBufferInfo extends BufferInfo {
    stride?: number;
}

/**
 * Represents information about a uniform block.
 */
interface UniformBlockInfo {
    key: string;
    binding: number;
}

/**
 * Represents information about a uniform.
 */
interface UniformInfo {
    [key: string]: {
        offset: number;
    }
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
        bufInfo: VertexBufferInfo,
    ) {
        super(gl, bufInfo, prog);
        this.ptrs = ptrs.map((ptr) => {
            const loc = this.gl.getAttribLocation(this.prog, ptr.key);
            if (loc === -1) {
                throw new Error(`Attribute ${ptr.key} not found in program`);
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
    uniforms: UniformInfo;

    constructor(
        gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        blockInfo: UniformBlockInfo,
        bufInfo: BufferInfo,
        uniforms: UniformInfo = {},
    ) {
        super(gl, bufInfo, prog);
        this.blockInfo = blockInfo;
        this.blockIndex = this.gl.getUniformBlockIndex(this.prog, this.blockInfo.key);
        if (this.blockIndex === -1) {
            throw new Error(`Uniform block ${this.blockInfo.key} not found in program`);
        }
        this.uniforms = uniforms;
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
     * Unbinds the UBO.
     */
    public unbind() {
        this.gl.bindBuffer(this.bufInfo.target, null);
    }

    /**
     * Binds a range of the buffer to the uniform block.
     * 
     * @param offset - The offset in bytes from the beginning of the buffer.
     * @param size - The size in bytes of the range to bind.
     */
    public bindRange(offset: number, size: number) {
        this.gl.bindBufferRange(this.bufInfo.target, this.blockInfo.binding, this.buffer, offset, size);
    }

    /**
     * Sets the value of a uniform variable in the shader program.
     * 
     * @param uniform - The key of the uniform variable.
     * @param data - The data to be set for the uniform variable.
     */
    public setUniform(uniform: string, data: TypedArray) {
        const offset = this.uniforms[uniform].offset;
        this.bufInfo.data.set(data, offset);
    }

    /**
     * Sets the values of multiple uniform variables in the shader program.
     * 
     * @param uniforms - An object containing the uniform names and their buffer data.
     */
    public setUniforms(uniforms: {[key: string]: TypedArray}) {
        for (const uniform in uniforms) {
            this.setUniform(uniform, uniforms[uniform]);
        }
    }

    /**
     * Sets the buffer data for the UBO.
     * @param data - The data to be set for the UBO.
     */
    public setBuffer(data: TypedArray) {
        this.bufInfo.data.set(data);
    }

    /**
     * Updates the data in the UBO.
     */
    public update() {
        this.bind();
        this.gl.bufferSubData(this.bufInfo.target, 0, this.bufInfo.data);
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

/**
 * Represents information about a texture.
 */
interface TextureInfo {
    target?: number;
    mipLevel?: number;
    internalFormat?: number;
    format?: number;
    type?: number;
}

/**
 * Represents a texture in WebGL.
 */
class Texture {
    gl: WebGL2RenderingContext;
    texture: WebGLTexture;
    texInfo: TextureInfo;

    constructor(
        gl: WebGL2RenderingContext,
        texInfo: TextureInfo,
        img: HTMLImageElement,
    ) {
        this.gl = gl;
        this.texture = this.gl.createTexture() as WebGLTexture;
        this.texInfo = {
            target: texInfo.target || this.gl.TEXTURE_2D,
            mipLevel: texInfo.mipLevel || 0,
            internalFormat: texInfo.internalFormat || this.gl.RGBA,
            format: texInfo.format || this.gl.RGBA,
            type: texInfo.type || this.gl.UNSIGNED_BYTE,
        }
        this.setData(img);
        this.generateMipmap();
    }

    /**
     * Binds the texture.
     */
    public bind() {
        this.gl.bindTexture(this.texInfo.target, this.texture);
    }

    /**
     * Unbinds the texture.
     */
    public unbind() {
        this.gl.bindTexture(this.texInfo.target, null);
    }

    /**
     * Sets the texture parameters.
     * @param params - An object containing the texture parameters.
     */
    public setParams(params: {[key: string]: number}) {
        this.bind();
        for (const param in params) {
            this.gl.texParameteri(
                this.texInfo.target, 
                this.gl[param as keyof WebGL2RenderingContext] as number, 
                params[param]
            );
        }
        this.unbind();
    }

    /**
     * Generates mipmaps for the texture.
     */
    public generateMipmap() {
        this.bind();
        this.gl.generateMipmap(this.texInfo.target);
        this.unbind();
    }

    /**
     * Sets the texture data.
     * @param img - The image data to set for the texture.
     */
    public setData(img: HTMLImageElement) {
        this.bind();
        this.gl.texImage2D(
            this.texInfo.target,
            this.texInfo.mipLevel,
            this.texInfo.internalFormat,
            this.texInfo.format,
            this.texInfo.type,
            img,
        );
        this.unbind();
    }

    /**
     * Sets active texture unit.
     */
    public setActiveTexture() {
        this.gl.activeTexture(this.gl.TEXTURE0);
    }
}

export { 
    Gluu,
    AttributeInfo,
    VertexBufferInfo,
    UniformBlockInfo,
    UniformInfo,
    TextureInfo,
};