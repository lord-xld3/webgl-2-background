/**
 * Util has some essential methods.
 */

export function init(
    canvas: HTMLCanvasElement
): WebGL2RenderingContext {
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
        throw new Error("WebGL2 not supported");
    }
    return gl;
}


function makeShader(
    gl: WebGL2RenderingContext,
    src: string,
    type: number,
): WebGLShader {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) as string);
    }
    return shader;
}

/**
 * Creates a WebGL program using the provided vertex and fragment shaders.
 * @param gl The WebGL context.
 * @param vs The source code of the vertex shader.
 * @param fs The source code of the fragment shader.
 * @returns The created WebGL program.
 */
export function createProgram(
    gl: WebGL2RenderingContext, 
    vs: string, 
    fs: string
): WebGLProgram {
    const prog = gl.createProgram() as WebGLProgram;
    gl.attachShader(prog, makeShader(gl, vs, gl.VERTEX_SHADER));
    gl.attachShader(prog, makeShader(gl, fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) as string);
    }
    return prog;
}

/**
 * Resizes the canvas element.
 * @param canvas The canvas element.
 * @param gl The WebGL context.
 */
export function resizeCanvas(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement
): void {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}