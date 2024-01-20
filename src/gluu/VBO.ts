import { gl } from "./Util";
import { TypedArray } from "./Types";

/**
 * A Vertex Buffer Object (VBO)
 */
export interface VBO {
    bind: () => void;
    unbind: () => void;
}

/**
 * Creates a Vertex Buffer Object (VBO).
 * @param prog - The shader program to bind the VBO to.
 * @param buf_info - The buffer data and usage.
 * @param ptrs_info  - The attribute pointers info.
 * @returns - The VBO.
 */
export function createVBO(
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
): VBO {
    const ptrs: {
        loc: number;
        size: number;
        type: number;
        normalized: boolean;
        stride: number;
        offset: number;
    }[] = ptrs_info.map((ptr) => {
        const loc = gl.getAttribLocation(prog, ptr.key);
        /// #if DEBUG
        if (loc === -1) {
            throw new Error(`Attribute ${ptr.key} not found in program`);
        }
        /// #endif
        return {
            loc,
            size: ptr.size,
            type: ptr.type?? gl.FLOAT,
            normalized: ptr.normalized?? false,
            stride: ptr.stride?? 0,
            offset: ptr.offset?? 0,
        };
    });

    const target = gl.ARRAY_BUFFER;
    const buf = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(target, buf);
    gl.bufferData(target, buf_info.data, buf_info.usage?? gl.STATIC_DRAW);

    return {
        bind: () => {
            gl.bindBuffer(target, buf);
            ptrs.forEach((ptr) => {
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
            gl.bindBuffer(target, null);
        },
        unbind: () => {
            ptrs.forEach((ptr) => {
                gl.disableVertexAttribArray(ptr.loc);
            });
            gl.bindBuffer(target, null);
        },
    };
}