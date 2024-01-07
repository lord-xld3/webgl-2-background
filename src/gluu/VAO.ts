import { gl } from "./Util";

/**
 * Represents a Vertex Array Object (VAO) in WebGL.
 * A VAO is used to store VBOs and their associated vertex attribute pointers.
 */
export interface VAO {
    vao: WebGLVertexArrayObject;
    bind: () => void;
    unbind: () => void;
}

/**
 * Creates a Vertex Array Object (VAO) in WebGL.
 * @returns The created Vertex Array Object (VAO).
 */
export function createVAO(): VAO {
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;

    return {
        vao,
        bind: () => gl.bindVertexArray(vao),
        unbind: () => gl.bindVertexArray(null),
    };
}