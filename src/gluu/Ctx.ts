/**
 * WebGL2 context
 */
export class Ctx {
    public gl: WebGL2RenderingContext;

    constructor(public canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
        if (!this.gl) {
            throw new Error("WebGL2 is not supported");
        }
    }
}