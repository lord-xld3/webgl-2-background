import {
    Scene,
    SceneInfo,
    Texture,
    Model,
} from "./Interfaces";

/**
 * Represents a SceneManager that manages scenes and their textures.
 */
export class SceneManager {
    private gl: WebGL2RenderingContext;
    private scenes: Scene;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.scenes = {};
    }

    public async init(scenes: SceneInfo): Promise<void> {
        const scenePromises: Promise<void>[] = [];
    
        for (const scene in scenes) {
            const textures = scenes[scene].texture_infos;
            const sceneTextures: Texture[] = await Promise.all(textures.map(async (tex, i) => {
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Failed to load image: ${tex.src}`));
                    img.src = tex.src;
                });
    
                const texture: Texture = {
                    tex: this.gl.createTexture() as WebGLTexture,
                    tex_unit: tex.tex_unit ?? i,
                    img3D: tex.img3D ?? false,
                    fmt: {
                        target: tex.fmt?.target ?? this.gl.TEXTURE_2D,
                        mip_level: tex.fmt?.mip_level ?? 0,
                        internal_format: tex.fmt?.internal_format ?? this.gl.RGBA,
                        format: tex.fmt?.format ?? this.gl.RGBA,
                        type: tex.fmt?.type ?? this.gl.UNSIGNED_BYTE,
                    },
                    params: tex.params ?? {},
                };
    
                texture.img3D ? this.image3D(texture, img) : this.image2D(texture, img);
                return texture;
            }));
    
            this.scenes[scene] = {
                textures: sceneTextures,
                models: scenes[scene].models, // Assuming models are already present in SceneInfo
            };
    
            scenePromises.push(Promise.resolve());
        }
    
        await Promise.all(scenePromises);
    }
    

    private image2D(texture: Texture, img: HTMLImageElement) {
        this.gl.activeTexture(this.gl.TEXTURE0 + texture.tex_unit);
        this.gl.bindTexture(texture.fmt.target, texture.tex);
        this.gl.texImage2D(
            texture.fmt.target,
            texture.fmt.mip_level,
            texture.fmt.internal_format,
            texture.fmt.format,
            texture.fmt.type,
            img
        );
        this.gl.generateMipmap(texture.fmt.target);
        for (const param in texture.params) {
            this.gl.texParameteri(
                texture.fmt.target,
                this.gl[param as keyof WebGL2RenderingContext] as number,
                texture.params[param]
            );
        }
    }

    private image3D(texture: Texture, img: HTMLImageElement) {
        // TODO: Implement image3D
        throw new Error("Not implemented");
    }

    public load(scene: string): void {
        const sc = this.scenes[scene];
        for (let i = 0; i < sc.textures.length; i++) {
            const texture = sc.textures[i];
            this.gl.activeTexture(this.gl.TEXTURE0 + texture.tex_unit);
            this.gl.bindTexture(texture.fmt.target, texture.tex);
        }
    }

    public draw(scene: string): void {
        const sc = this.scenes[scene];
        for (let i = 0; i < sc.models.length; i++) {
            const model = sc.models[i];
            this.gl.useProgram(model.material.prog);
            model.mesh.vao.bind();
            model.mesh.drawFunc();
        }
    }
}
