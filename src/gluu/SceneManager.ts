import {
    Scene,
    Texture
} from "./Interfaces";

/**
 * Represents a SceneManager that manages scenes and their textures.
 */
export class SceneManager {
    private gl: WebGL2RenderingContext;
    private scenes: Scene;

    constructor(
        gl: WebGL2RenderingContext,
        scenes: Scene
    ) {
        this.gl = gl;
        this.scenes = scenes;
        this.fetchTextures().then((textures) => {
            for (const scene in this.scenes) {
                this.scenes[scene].textures = textures;
            }
        });
    }

    private fetchTextures(): Promise<Texture[]> {
        const texturePromises: Promise<Texture>[] = [];
        
        for (const scene in this.scenes) {
            this.scenes[scene].textures.forEach((texture, i) => {
                const promise = new Promise<Texture>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            src: texture.src,
                            tex_unit: texture.tex_unit ? texture.tex_unit : i,
                            img3D: texture.img3D ? texture.img3D : false,
                            fmt: {
                                target: texture.fmt?.target || this.gl.TEXTURE_2D,
                                internal_format: texture.fmt?.internal_format || this.gl.RGBA,
                                format: texture.fmt?.format || this.gl.RGBA,
                                type: texture.fmt?.type || this.gl.UNSIGNED_BYTE,
                            },
                            tex: texture.img3D ? this.image3D(texture, img) : this.image2D(texture, img),
                        });
                    };
                    img.onerror = () => reject(new Error(`Failed to load texture: ${texture.src}`));
                    img.src = texture.src;
                });
                
                texturePromises.push(promise);
            });
        }
        
        return Promise.all(texturePromises);
    }

    private image2D(texture: Texture, img: HTMLImageElement): WebGLTexture {
        const tex = this.gl.createTexture() as WebGLTexture;
        this.gl.activeTexture(this.gl.TEXTURE0 + texture.tex_unit);
        this.gl.bindTexture(texture.fmt.target, tex);
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
        return tex;
    }

    private image3D(texture: Texture, img: HTMLImageElement): WebGLTexture {
        const tex = this.gl.createTexture() as WebGLTexture;
        // TODO: Implement image3D
        throw new Error("Not implemented");
    }

    public loadTextures(scene: string): void {
        this.scenes[scene].textures.forEach((texture) => {
            this.gl.activeTexture(this.gl.TEXTURE0 + texture.tex_unit);
            this.gl.bindTexture(texture.fmt.target, texture.tex);
        });
    }

}
