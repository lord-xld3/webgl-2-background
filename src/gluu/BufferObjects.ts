import { gl } from "./Util";
import { TypedArray } from "./Types";

/**
 * Base class for buffer objects that defines shared behavior.
 * - constructor(Create, bind, copy to buffer).
 * - bind() - Bind buffer.
 * - unbind() - Unbind buffer.
 */
abstract class BufferObject {
    protected buf: WebGLBuffer;
    protected target: number;

    constructor(
        target: number, 
        data: TypedArray, 
        usage: number
    ) {
        this.buf = gl.createBuffer() as WebGLBuffer;
        this.target = target;

        this.bind();
        gl.bufferData(this.target, data, usage);
    }

    public bind(): void {
        gl.bindBuffer(this.target, this.buf);
    }

    public unbind(): void {
        gl.bindBuffer(this.target, null);
    }
}

/**
 * A Vertex Buffer Object (VBO) holds vertex attribute data.
 */
export class VBO extends BufferObject {
    private ptrs;

    constructor(
        prog: WebGLProgram,
        buf_info: {
            data: TypedArray;
            usage?: number;
        },
        ptrs_info: {
            key: string;
            size: number;
            type?: number;
            normalized?: boolean;
            stride?: number;
            offset?: number;
        }[]
    ) {
        super(gl.ARRAY_BUFFER, buf_info.data, buf_info.usage?? gl.STATIC_DRAW);
        this.ptrs = ptrs_info.map((ptr) => {
            const loc = gl.getAttribLocation(prog, ptr.key);
            if (loc === -1) {
                throw new Error(`Attribute ${ptr.key} not found in program`);
            }
            return Object.assign({}, 
                {
                    // default attribute pointer options
                    type: gl.FLOAT,
                    normalized: false,
                    stride: 0,
                    offset: 0,
                }, 
                ptr, { loc }
            );
        });
        this.unbind();
    }

    /**
     * Bind VBO and enable attribute pointers.
     */
    public enable(): void {
        this.bind();
        this.ptrs.forEach((ptr) => {
            gl.enableVertexAttribArray(ptr.loc);
            gl.vertexAttribPointer(
                ptr.loc,
                ptr.size,
                ptr.type,
                ptr.normalized,
                ptr.stride,
                ptr.offset
            );
        });
        this.unbind();
    }
}

/**
 * An Element Buffer Object (EBO) holds indices for vertex attributes.
 */
export class EBO extends BufferObject {
    constructor(
        data: TypedArray, 
        usage: number = gl.STATIC_DRAW
    ) {
        super(gl.ELEMENT_ARRAY_BUFFER, data, usage);
        this.unbind();
    }
}

//TODO: Move uniform stuff to scene manager

/**
 * A Uniform Buffer Object (UBO) holds uniform data.
 */
export class UBO extends BufferObject {
    private binding;
    private data;
    private uniforms;

    constructor(
        prog: WebGLProgram,
        data: TypedArray,
        block_info: {
            key: string;
            binding?: number;
            usage?: number;
        },
        uniforms: {
            [key: string]: {
                offset: number;
            };
        },
    ) {
        const blockIndex = gl.getUniformBlockIndex(prog, block_info.key);
        if (blockIndex === -1) {
            throw new Error(`Uniform block ${block_info.key} not found in program`);
        }
        super(gl.UNIFORM_BUFFER, data, block_info.usage?? gl.DYNAMIC_DRAW);
        
        this.binding = block_info.binding?? 0;
        this.data = data;
        this.uniforms = uniforms;
        
        gl.uniformBlockBinding(prog, blockIndex, this.binding);
        gl.bindBufferBase(this.target, this.binding, this.buf);
        this.unbind();
    }

    public bindRange(offset: number, size: number): void {
        gl.bindBufferRange(this.target, offset, this.buf, offset, size);
    }

    public setUniform(uniform: {
        key: string;
        data: TypedArray;
    }): void {
        this.bind();
        this.data.set(uniform.data, this.uniforms[uniform.key] as unknown as number);
        this.unbind();
    }

    public setUniforms(uniforms: {
        key: string;
        data: TypedArray;
    }[]): void {
        this.bind();
        uniforms.forEach((uniform) => {
            this.data.set(uniform.data, this.uniforms[uniform.key] as unknown as number);
        });
        this.unbind();
    }

    public setBuffer(data: TypedArray, offset: number = 0): void {
        this.bind();
        this.data.set(data, offset);
        this.unbind();
    }

    public update(): void {
        this.bind();
        gl.bufferSubData(this.target, 0, this.data);
        this.unbind();
    }
}