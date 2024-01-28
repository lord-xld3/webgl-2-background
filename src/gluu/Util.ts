
export let gl: WebGL2RenderingContext;
export let canvas: HTMLCanvasElement;

export function init(
    canvasElement: HTMLCanvasElement
): WebGL2RenderingContext {
    canvas = canvasElement;
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
        throw new Error("WebGL2 not supported");
    }
    return gl;
}

function makeShader(
    src: string,
    type: number
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
 * @param vs The source code of the Vertex Shader.
 * @param fs The source code of the Fragment Shader.
 * @returns The created WebGL program.
 */
export function createProgram(
    vs: string,
    fs: string
): WebGLProgram {
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, makeShader(vs, gl.VERTEX_SHADER));
    gl.attachShader(program, makeShader(fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) as string);
    }
    return program;
}

/**
 * Resizes the canvas element.
 */
export function resize(): void {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}