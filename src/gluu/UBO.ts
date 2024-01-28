import { gl } from "./Util";
import { TypedArray } from "./Types";
import { UniformInfo } from "./Interfaces";

export interface UniformBlockInfo {
    key: string;
    binding?: number;
    usage?: number;
}

export interface UniformData {
    key: string;
    data: TypedArray;
}

export interface UBO {
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
    const target = gl.UNIFORM_BUFFER;

    gl.bindBuffer(target, buf);
    gl.bufferData(target, data, block_info.usage?? gl.DYNAMIC_DRAW);
    gl.uniformBlockBinding(prog, blockIndex, binding);
    gl.bindBufferBase(target, binding, buf);

    const ubo: UBO = {
        bind: () => gl.bindBuffer(target, buf),
        unbind: () => gl.bindBuffer(target, null),
        bindRange: (
            offset: number, 
            size: number
        ) => gl.bindBufferRange(target, binding, data, offset, size),
        setUniform: (
            uniform: UniformData
        ) => data.set(uniform.data, uniforms[uniform.key] as unknown as number),
        setUniforms: (
            uniforms: UniformData[]
        ) => {
            uniforms.forEach((uniform: UniformData) => {
                data.set(uniform.data, uniforms[uniform.key as unknown as number] as unknown as number);
            });
        },
        setBuffer: (
            newData: TypedArray, 
            offset: number = 0
        ) => data.set(newData, offset),
        update: () => gl.bufferSubData(target, 0, data),
    };

    return ubo;
}

