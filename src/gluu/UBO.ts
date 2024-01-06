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
    blockInfo: UniformBlockInfo;
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
    gl: WebGL2RenderingContext,
    prog: WebGLProgram,
    data: TypedArray,
    blockInfo: UniformBlockInfo,
    uniforms: UniformInfo,
): UBO {
    const blockIndex = gl.getUniformBlockIndex(prog, blockInfo.key);
    if (blockIndex === -1) {
        throw new Error(`Uniform block ${blockInfo.key} not found in program`);
    }

    blockInfo = {
        key: blockInfo.key,
        binding: blockInfo.binding?? 0,
    };

    gl.bindBuffer(gl.UNIFORM_BUFFER, gl.createBuffer());
    gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.uniformBlockBinding(prog, blockIndex, blockInfo.binding!);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, blockInfo.binding!, data);

    const ubo = {
        data,
        blockInfo,
        uniforms,
    };

    return {
        ...ubo,
        bind: () => gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.data),
        unbind: () => gl.bindBuffer(gl.UNIFORM_BUFFER, null),
        bindRange: (
            offset: number, 
            size: number
        ) => gl.bindBufferRange(
            gl.UNIFORM_BUFFER, 
            ubo.blockInfo.binding!, 
            ubo.data, 
            offset, 
            size
        ),
        setUniform: (
            uniform: UniformData
        ) => {
            ubo.data.set(uniform.data, ubo.uniforms[uniform.key].offset);
        },
        setUniforms: (
            uniforms: UniformData[]
        ) => {
            uniforms.forEach(uniform => {
                ubo.data.set(uniform.data, ubo.uniforms[uniform.key].offset);
            });
        },
        setBuffer: (
            data: TypedArray, 
            offset: number = 0
        ) => {
            ubo.data.set(data, offset);
        },
        update: () => {
            gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.data);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, ubo.data);
        },
    };
}
