/**
 * Represents a Vertex Array Object (VAO) in WebGL.
 * A VAO is used to store VBOs and their associated vertex attribute pointers.
 */
export class VAO {
    public vao: WebGLVertexArrayObject;

    constructor(private gl: WebGL2RenderingContext) {
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
