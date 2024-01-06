import { Ctx } from "./Ctx";

/**
 * Util has some essential methods.
 */
export class Util extends Ctx{

    private makeShader(
        src: string,
        type: number,
    ): WebGLShader {
        const shader = this.gl.createShader(type) as WebGLShader;
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) as string);
        }
        return shader;
    }

    /**
     * Creates a WebGL program using the provided vertex and fragment shaders.
     * @param vs The source code of the vertex shader.
     * @param fs The source code of the fragment shader.
     * @returns The created WebGL program.
     */
    public createProgram(vs: string, fs: string): WebGLProgram {
        const prog = this.gl.createProgram() as WebGLProgram;
        this.gl.attachShader(prog, this.makeShader(vs, this.gl.VERTEX_SHADER));
        this.gl.attachShader(prog, this.makeShader(fs, this.gl.FRAGMENT_SHADER));
        this.gl.linkProgram(prog);
        if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(prog) as string);
        }
        return prog;
    }

    /**
     * Resizes the canvas element.
     */
    public resizeCanvas(): void {
        const canvas = this.canvas;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
}