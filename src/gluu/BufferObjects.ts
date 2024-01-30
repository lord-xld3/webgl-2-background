import { gl } from "./Util";
import { TypedArray } from "./Types";

/**
 * Base class for buffer objects that defines shared behavior.
 * - constructor(Create and bind buffer).
 * - bind() - Bind buffer.
 * - unbind() - Unbind buffer.
 */
abstract class BufferObject {
    protected buf: WebGLBuffer;
    protected target: number;

    constructor(target: number) {
        this.buf = gl.createBuffer() as WebGLBuffer;
        this.target = target;

        this.bind();
    }

    /**
     * Bind buffer.
     */
    public bind(): void {
        gl.bindBuffer(this.target, this.buf);
    }

    /**
     * Unbind buffer.
     */
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
        data: TypedArray,
        ptr_infos: {
            key: string;
            size: number;
            type?: number;
            normalized?: boolean;
            stride?: number;
            offset?: number;
        }[],
        usage: number = gl.STATIC_DRAW,
    ) {
        super(gl.ARRAY_BUFFER);
        this.ptrs = ptr_infos.map((ptr) => {
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
        gl.bufferData(this.target, data, usage);
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
        super(gl.ELEMENT_ARRAY_BUFFER);
        gl.bufferData(this.target, data, usage);
        this.unbind();
    }
}

//TODO: Move uniform stuff to scene manager

/**
 * A Uniform Buffer Object (UBO) holds uniform data.
 */
export class UBO extends BufferObject {
    private data;
    private uniforms;

    constructor(
        prog: WebGLProgram,
        data: TypedArray,
        block_name: string,
        uniforms: {
            [key: string]: {
                offset: number;
            };
        },
        binding: number = 0,
        usage: number = gl.DYNAMIC_DRAW,
    ) {
        const blockIndex = gl.getUniformBlockIndex(prog, block_name);
        if (blockIndex === -1) {
            throw new Error(`Uniform block ${block_name} not found in program`);
        }
        super(gl.UNIFORM_BUFFER);
        
        gl.uniformBlockBinding(prog, blockIndex, binding);
        gl.bindBufferBase(this.target, binding, this.buf);

        //Workaround for alignment issues on some devices, pads buffer to 16 bytes
        let align = 
            gl.getActiveUniformBlockParameter(prog, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE)
            - data.byteLength

        if (align > 0) {
            console.log(
                `Padding ${align} bytes for uniform block \"${block_name}\"`
            );
            data = new (data.constructor as any)(
                [...data, ...Array(align / data.BYTES_PER_ELEMENT)]
            );
        } else if (align < 0) {
            console.warn(
                `Data size exceeds uniform block \"${block_name}\" size by ${-align} bytes.`
            );
        }
        gl.bufferData(this.target, data, usage);

        this.data = data;
        this.uniforms = uniforms;
        this.unbind();
    }

    /**
     * Set the data of a specific uniform.
     * @param key - Name of uniform.
     * @param data - Data to write to buffer.
     */
    public setUniform(key: string, data: ArrayLike<number>): void {
        this.bind();
        this.data.set(data, this.uniforms[key] as unknown as number);
        this.unbind();
    }

    /**
     * Set the data of multiple uniforms.
     * @param uniforms.key - Name of uniform.
     * @param uniforms.data - Data to write to buffer.
     */
    public setUniforms(uniforms: {
        key: string;
        data: ArrayLike<number>;
    }[]): void {
        this.bind();
        uniforms.forEach((uniform) => {
            this.data.set(uniform.data, this.uniforms[uniform.key] as unknown as number);
        });
        this.unbind();
    }

    /**
     * Write directly to uniform data buffer.
     * @param data - Data to write to buffer.
     * @param offset - Optional offset from start of buffer.
     */
    public setBuffer(data: ArrayLike<number>, offset: number = 0): void {
        this.bind();
        this.data.set(data, offset);
        this.unbind();
    }

    /**
     * Copy uniform data to GPU.
     */
    public update(): void {
        this.bind();
        gl.bufferSubData(this.target, 0, this.data);
        this.unbind();
    }
}