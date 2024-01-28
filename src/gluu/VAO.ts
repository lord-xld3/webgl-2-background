import { gl } from "./Util";

/**
 * A Vertex Array Object (VAO) encapsulates state for VBOs and EBOs.
 */
export class VAO {
    private vao: WebGLVertexArrayObject;
    
    constructor() {
        this.vao = gl.createVertexArray() as WebGLVertexArrayObject;
    }
    
    /**
     * Binds the VAO.
     */
    public bind(): void {
        gl.bindVertexArray(this.vao);
    }

    /**
     * Unbinds the VAO. 
     * This is nearly useless, since you can just bind a different VAO.
     */
    public unbind(): void {
        gl.bindVertexArray(null);
    }
}