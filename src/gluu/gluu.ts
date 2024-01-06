import { 
    AttributeInfo, 
    BufferInfo, 
    UniformBlockInfo, 
    UniformInfo, 
    SceneInfo,
    Model,
} from "./Interfaces";
import { SceneManager } from "./SceneManager";
import { UBO } from "./UBO";
import { VAO } from "./VAO";
import { VBO } from "./VBO";

export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | 
Int32Array | Uint32Array | Float32Array | Float64Array;

/**
 * Represents a WebGL utility class for managing WebGL context, shaders, programs, and buffers.
 */
class Gluu {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    private scene_manager: SceneManager;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
        if (!this.gl) {
            throw new Error("WebGL2 is not supported");
        }
        this.scene_manager = new SceneManager(this.gl);
    }

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
    public makeProgram(
        vs: string,
        fs: string,
    ): WebGLProgram {
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
     * Creates a new VBO (Vertex Buffer Object) using the provided WebGL program, attribute pointers, and buffer information.
     * @param prog The WebGL program to associate the VBO with.
     * @param ptrs An array of attribute information objects specifying the attribute pointers.
     * @param buf_info The buffer information object containing the data for the VBO.
     * @returns The newly created VBO.
     */
    public makeVBO(
        prog: WebGLProgram,
        ptrs: AttributeInfo[],
        buf_info: BufferInfo,
    ): VBO {
        return new VBO(this.gl, prog, ptrs, buf_info);
    }

    /**
     * Creates a new VAO (Vertex Array Object).
     * @returns The newly created VAO.
     */
    public makeVAO(): VAO {
        return new VAO(this.gl);
    }

    /**
     * Creates a new UBO (Uniform Buffer Object) using the provided WebGL program, uniform block information, and buffer information.
     * @param prog The WebGL program to associate the UBO with.
     * @param block_info The uniform block information object specifying the uniform block.
     * @param data The data to store in the UBO.
     * @param uniforms An object containing information about the uniforms in the uniform block.
     * @returns The newly created UBO.
     */
    public makeUBO(
        prog: WebGLProgram,
        block_info: UniformBlockInfo,
        data: TypedArray,
        uniforms: UniformInfo = {},
    ): UBO {
        const buf_info: BufferInfo = {
            data,
            target: this.gl.UNIFORM_BUFFER,
            usage: this.gl.STATIC_DRAW,
        };
        return new UBO(this.gl, prog, block_info, buf_info, uniforms);
    }

    /**
     * Resizes the canvas element to match the size of its parent container and updates the WebGL viewport accordingly.
     */
    public resizeToCanvas(): void {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Initializes the SceneManager with the provided scenes.
     * @param scenes The scenes to use in the SceneManager.
     */
    public async makeScenes(scenes: SceneInfo): Promise<void> {
        await this.scene_manager.init(scenes);
    }

    /**
     * Loads the textures for the specified scene.
     * @param scene The scene to load the textures for.
     */
    public loadScene(scene: string): Model[] {
        return this.scene_manager.load(scene);
    }
}

export {Gluu};