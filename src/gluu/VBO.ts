import { TypedArray } from "./Types";
import { bindBuffer, unbindBuffer, createBuffer } from "./Util";

export interface VertexBufferInfo {
    data: TypedArray;
    target: number;
    usage: number;
    stride?: number;
}

export interface VertexAttributePointer {
    loc: number;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
}

export interface AttributeInfo {
    key: string;
    size: number;
    type?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
}

export interface VBO {
    buf_info: VertexBufferInfo;
    ptrs: VertexAttributePointer[];
    buf: WebGLBuffer;
    bind: () => void;
    unbind: () => void;
}

export function createVBO(
    gl: WebGL2RenderingContext,
    prog: WebGLProgram,
    buf_info: VertexBufferInfo,
    ptrs_info: AttributeInfo[]
): VBO {
    const ptrs: VertexAttributePointer[] = ptrs_info.map((ptr) => {
        const loc = gl.getAttribLocation(prog, ptr.key);
        if (loc === -1) {
            throw new Error(`Attribute ${ptr.key} not found in program`);
        }
        return {
            loc,
            size: ptr.size,
            type: ptr.type?? gl.FLOAT,
            normalized: ptr.normalized?? false,
            stride: ptr.stride?? 0,
            offset: ptr.offset?? 0,
        };
    });

    const buf = createBuffer(
        gl, 
        buf_info.target, 
        buf_info.data, 
        buf_info.usage
    );

    const vbo = {
        buf_info,
        ptrs,
        buf,
    };

    function bind(): void {
        bindBuffer(gl, vbo.buf_info.target, vbo.buf);
        vbo.ptrs.forEach((ptr) => {
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
    }

    function unbind(): void {
        vbo.ptrs.forEach((ptr) => {
            gl.disableVertexAttribArray(ptr.loc);
        });
        unbindBuffer(gl, vbo.buf_info.target);
    }

    return {
        ptrs, 
        buf, 
        buf_info,
        bind,
        unbind
    };
}