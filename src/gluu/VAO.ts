import { TypedArray } from "./Types";

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
 * @param gl The WebGL context.
 * @returns The created Vertex Array Object (VAO).
 */
export function createVAO(
    gl: WebGL2RenderingContext
): VAO {
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;

    /**
     * Binds the vertex array object.
     */
    function bind() {
        gl.bindVertexArray(vao);
    }

    /**
     * Unbinds the vertex array object.
     */
    function unbind() {
        gl.bindVertexArray(null);
    }

    return {
        vao,
        bind,
        unbind,
    };
}