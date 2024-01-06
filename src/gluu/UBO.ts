import { TypedArray } from "./gluu";
import { BufferObject } from "./BufferObject";
import { UniformBlockInfo, UniformInfo } from "./Interfaces";
import { BufferInfo } from "./Interfaces";

/**
 * Represents a Uniform Buffer Object (UBO) in WebGL.
 * A UBO is used to store uniform data that can be efficiently accessed by the GPU.
 */
export class UBO extends BufferObject {
    block_info: UniformBlockInfo;
    block_index: number;
    uniforms: UniformInfo;

    constructor(
        gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        block_info: UniformBlockInfo,
        buf_info: BufferInfo,
        uniforms: UniformInfo = {}
    ) {
        super(gl, prog, buf_info);
        this.block_info = {
            key: block_info.key,
            binding: block_info.binding?? 0,
        }
        this.block_index = this.gl.getUniformBlockIndex(this.prog, this.block_info.key);
        if (this.block_index === -1) {
            throw new Error(`Uniform block ${this.block_info.key} not found in program`);
        }
        this.uniforms = uniforms;
        this.bind();
        this.gl.bufferData(this.buf_info.target, this.buf_info.data, this.buf_info.usage);
        this.gl.uniformBlockBinding(this.prog, this.block_index, this.block_info.binding!);
        this.gl.bindBufferBase(this.buf_info.target, this.block_info.binding!, this.buffer);
        this.unbind();
    }

    /**
     * Binds the UBO.
     */
    public bind() {
        this.gl.bindBuffer(this.buf_info.target, this.buffer);
    }

    /**
     * Unbinds the UBO.
     */
    public unbind() {
        this.gl.bindBuffer(this.buf_info.target, null);
    }

    /**
     * Binds a range of the buffer to the uniform block.
     *
     * @param offset - The offset in bytes from the beginning of the buffer.
     * @param size - The size in bytes of the range to bind.
     */
    public bindRange(offset: number, size: number) {
        this.gl.bindBufferRange(this.buf_info.target, this.block_info.binding!, this.buffer, offset, size);
    }

    /**
     * Sets the value of a uniform variable in the shader program.
     *
     * @param uniform - The key of the uniform variable.
     * @param data - The data to be set for the uniform variable.
     */
    public setUniform(uniform: string, data: TypedArray) {
        const offset = this.uniforms[uniform].offset;
        this.buf_info.data.set(data, offset);
    }

    /**
     * Sets the values of multiple uniform variables in the shader program.
     *
     * @param uniforms - An object containing the uniform names and their buffer data.
     */
    public setUniforms(uniforms: { [key: string]: TypedArray; }) {
        for (const uniform in uniforms) {
            this.setUniform(uniform, uniforms[uniform]);
        }
    }

    /**
     * Sets the buffer data for the UBO.
     * @param data - The data to be set for the UBO.
     * @param offset - The offset in bytes from the beginning of the buffer.
     */
    public setBuffer(data: TypedArray, offset?: number) {
        this.buf_info.data.set(data, offset);
    }

    /**
     * Updates the data in the UBO.
     */
    public update() {
        this.bind();
        this.gl.bufferSubData(this.buf_info.target, 0, this.buf_info.data);
        this.unbind();
    }
}
