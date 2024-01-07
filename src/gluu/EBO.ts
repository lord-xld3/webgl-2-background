import { gl } from "./Util";
import { TypedArray } from "./Types";

export interface ElementBufferInfo {
    data: TypedArray;
    usage?: number;
}

export interface EBO {
    data: TypedArray;
    usage: number;
    buf: WebGLBuffer;
    bind: () => void;
    unbind: () => void;
}

export function createEBO(
    buf_info: ElementBufferInfo
): EBO {
    const buf = gl.createBuffer() as WebGLBuffer;
    const target = gl.ELEMENT_ARRAY_BUFFER;
    buf_info.usage??= gl.STATIC_DRAW;
    gl.bindBuffer(target, buf);
    gl.bufferData(target, buf_info.data, buf_info.usage);
    gl.bindBuffer(target, null);

    const ebo: EBO = {
        data: buf_info.data,
        usage: buf_info.usage,
        buf,
        bind: () => gl.bindBuffer(target, buf),
        unbind: () => gl.bindBuffer(target, null),
    };
    return ebo;
}