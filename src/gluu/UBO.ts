import { TypedArray } from "./Types";
import { UniformInfo } from "./Interfaces";

/**
 * Represents information about a uniform block.
 */
export interface UniformBlockInfo {
    key: string;
    binding?: number;
}

/**
 * Represents a Uniform Buffer Object (UBO) in WebGL.
 * A UBO is used to store uniform data that can be efficiently accessed by the GPU.
 */
export class UBO {
    private block_index: number;

    constructor(
        private gl: WebGL2RenderingContext,
        prog: WebGLProgram,
        private data: TypedArray,
        private block_info: UniformBlockInfo,
        private uniforms: UniformInfo,
    ) {
        
        this.block_info = {
            key: block_info.key,
            binding: block_info.binding?? 0,
        }
        this.block_index = this.gl.getUniformBlockIndex(prog, this.block_info.key);
        if (this.block_index === -1) {
            throw new Error(`Uniform block ${this.block_info.key} not found in program`);
        }
        this.uniforms = uniforms;
        this.bind();
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.data, this.gl.DYNAMIC_DRAW);
        this.gl.uniformBlockBinding(prog, this.block_index, this.block_info.binding!);
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.block_info.binding!, this.data);
        this.unbind();
    }

    /**
     * Binds the UBO.
     */
    public bind() {
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.data);
    }

    /**
     * Unbinds the UBO.
     */
    public unbind() {
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
    }

    /**
     * Binds a range of the buffer to the uniform block.
     *
     * @param offset - The offset in bytes from the beginning of the buffer.
     * @param size - The size in bytes of the range to bind.
     */
    public bindRange(offset: number, size: number) {
        this.gl.bindBufferRange(
            this.gl.UNIFORM_BUFFER, this.block_info.binding!, 
            this.data, offset, size
        );
    }

    /**
     * Sets the value of a uniform variable in the shader program.
     *
     * @param uniform - The key of the uniform variable.
     * @param data - The data to be set for the uniform variable.
     */
    public setUniform(uniform: string, data: TypedArray) {
        const offset = this.uniforms[uniform].offset;
        this.data.set(data, offset);
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
        this.data.set(data, offset);
    }

    /**
     * Updates the data in the UBO.
     */
    public update() {
        this.bind();
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this.data);
        this.unbind();
    }
}
