import { BufferInfo } from "./Interfaces";

/**
 * Represents a buffer object in WebGL.
 */
export abstract class BufferObject {
    protected gl: WebGL2RenderingContext;
    protected buffer: WebGLBuffer;
    protected buf_info: BufferInfo;
    protected prog: WebGLProgram;

    constructor(
        gl: WebGL2RenderingContext,
        prog?: WebGLProgram,
        buf_info?: BufferInfo
    ) {
        this.gl = gl;
        this.prog = prog;
        this.buf_info = buf_info;
        this.buffer = this.gl.createBuffer() as WebGLBuffer;
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