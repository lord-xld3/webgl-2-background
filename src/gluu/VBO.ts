import { TypedArray } from "./Types";

interface VertexBufferInfo {
    data: TypedArray;
    target: number;
    usage: number;
    stride?: number;
}

interface VertexAttributePointer {
    loc: number;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
}

interface AttributeInfo {
    key: string;
    size: number;
    type?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
}

/**
 * Represents a Vertex Buffer Object (VBO) in WebGL.
 * A VBO is used to store vertex data that can be efficiently accessed by the GPU.
 */
export class VBO {
    private ptrs: VertexAttributePointer[];
    private buf: WebGLBuffer;

    constructor(
        private gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        private buf_info: VertexBufferInfo,
        ptrs_info: AttributeInfo[],
    ) {
        this.buf = this.gl.createBuffer() as WebGLBuffer;
        this.ptrs = ptrs_info.map((ptr) => {
            const loc = this.gl.getAttribLocation(prog, ptr.key);
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
        this.gl.bindBuffer(this.buf_info.target, this.buf);
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
