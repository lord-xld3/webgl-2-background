import { gl } from "./Util";
import { TypedArray } from "./Types";

/**
 * An Element Buffer Object (EBO)
 */
export interface EBO {
    bind: () => void;
    unbind: () => void;
}

/**
 * Creates an Element Buffer Object (EBO).
 * @param data The data to store in the EBO.
 * @param usage The usage pattern of the data store. Defaults to gl.STATIC_DRAW.
 */
export function createEBO(data: TypedArray, usage?: number
): EBO {
    const buf = gl.createBuffer() as WebGLBuffer;
    const target = gl.ELEMENT_ARRAY_BUFFER;
    gl.bindBuffer(target, buf);
    gl.bufferData(target, data, usage??= gl.STATIC_DRAW);
    gl.bindBuffer(target, null);

    return {
        bind: () => gl.bindBuffer(target, buf),
        unbind: () => gl.bindBuffer(target, null),
    };
}