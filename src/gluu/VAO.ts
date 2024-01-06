/**
 * Represents a Vertex Array Object (VAO) in WebGL.
 * A VAO is used to store VBOs and their associated vertex attribute pointers.
 */
export class VAO {
    gl: WebGL2RenderingContext;
    vao: WebGLVertexArrayObject;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.vao = this.gl.createVertexArray() as WebGLVertexArrayObject;
    }

    /**
     * Binds the vertex array object.
     */
    public bind() {
        this.gl.bindVertexArray(this.vao);
    }

    /**
     * Unbinds the vertex array object.
     */
    public unbind() {
        this.gl.bindVertexArray(null);
    }
}
