import { BufferObject } from "./BufferObject";
import { VertexAttributePointer, AttributeInfo, VertexBufferInfo } from "./Interfaces";

/**
 * Represents a Vertex Buffer Object (VBO) in WebGL.
 * A VBO is used to store vertex data that can be efficiently accessed by the GPU.
 */
export class VBO extends BufferObject {
    ptrs: VertexAttributePointer[];

    constructor(
        gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        ptrs: AttributeInfo[],
        buf_info: VertexBufferInfo
    ) {
        super(gl, prog, buf_info);
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
        this.gl.bufferData(this.buf_info.target, this.buf_info.data, this.buf_info.usage);
        this.unbind();
    }

    /**
     * Binds the VBO and enables vertex attribute pointers.
     */
    public bind() {
        this.gl.bindBuffer(this.buf_info.target, this.buffer);
        this.ptrs.forEach((ptr) => {
            this.gl.enableVertexAttribArray(ptr.loc);
            this.gl.vertexAttribPointer(
                ptr.loc,
                ptr.size,
                ptr.type,
                ptr.normalized,
                ptr.stride,
                ptr.offset
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
        this.gl.bindBuffer(this.buf_info.target, null);
    }
}
