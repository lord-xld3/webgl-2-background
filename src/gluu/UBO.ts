import { gl } from "./Util";
import { TypedArray } from "./Types";
import { UniformInfo } from "./Interfaces";

export interface UniformBlockInfo {
    key: string;
    binding?: number;
}

export interface UniformData {
    key: string;
    data: TypedArray;
}

export interface UBO {
    data: TypedArray;
    block_info: UniformBlockInfo;
    uniforms: UniformInfo;
    bind: () => void;
    unbind: () => void;
    bindRange: (offset: number, size: number) => void;
    setUniform: (uniform: UniformData) => void;
    setUniforms: (uniforms: UniformData[]) => void;
    setBuffer: (data: TypedArray, offset?: number) => void;
    update: () => void;
}

export function createUBO(
    prog: WebGLProgram,
    data: TypedArray,
    block_info: UniformBlockInfo,
    uniforms: UniformInfo,
): UBO {
    const blockIndex = gl.getUniformBlockIndex(prog, block_info.key);
    if (blockIndex === -1) {
        throw new Error(`Uniform block ${block_info.key} not found in program`);
    }
    const buf = gl.createBuffer();
    const binding = block_info.binding?? 0;
    gl.bindBuffer(gl.UNIFORM_BUFFER, buf);
    gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.uniformBlockBinding(prog, blockIndex, binding);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, buf);

    const ubo: UBO = {
        data,
        block_info,
        uniforms,
        bind: () => gl.bindBuffer(gl.UNIFORM_BUFFER, buf),
        unbind: () => gl.bindBuffer(gl.UNIFORM_BUFFER, null),
        bindRange: (
            offset: number, 
            size: number
        ) => gl.bindBufferRange(gl.UNIFORM_BUFFER, binding, ubo.data, offset, size),
        setUniform: (
            uniform: UniformData
        ) => ubo.data.set(uniform.data, ubo.uniforms[uniform.key] as unknown as number),
        setUniforms: (
            uniforms: UniformData[]
        ) => {
            uniforms.forEach((uniform) => {
                ubo.data.set(uniform.data, ubo.uniforms[uniform.key] as unknown as number);
            });
        },
        setBuffer: (
            newData: TypedArray, 
            offset: number = 0
        ) => ubo.data.set(newData, offset),
        update: () => gl.bufferSubData(gl.UNIFORM_BUFFER, 0, ubo.data),
    };

    return ubo;
}

