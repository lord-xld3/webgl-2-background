import { VAO } from "./VAO";
import { UniformInfo } from "./Interfaces";

/**
 * Texture information passed in to create a Texture.
 */
export interface TextureInfo {
    src: string;
    tex_unit?: number;
    img3D?: boolean;
    fmt?: {
        target?: number;
        mip_level?: number;
        internal_format?: number;
        format?: number;
        type?: number;
    };
    params?: {
        [key: number]: number;
    };
}

/**
 * A WebGL texture and its associated information.
 */
export interface Texture {
    tex: WebGLTexture;
    tex_unit: number;
    img3D: boolean;
    fmt: {
        target: number;
        mip_level: number;
        internal_format: number;
        format: number;
        type: number;
    };
    params: {
        [key: number]: number;
    };
}

/**
 * A shader program and its associated uniforms.
 */
export interface Material {
    prog: WebGLProgram;
    uniforms?: UniformInfo;
}

/**
 * Geometry and its associated draw function.
 */
export interface Mesh {
    vao: VAO;
    drawFunc: () => void;
}

/**
 * A group of meshes and their associated material.
 */
export interface Model {
    mesh: Mesh[];
    material: Material;
}

/**
 * A scene and its associated textures and models.
 */
export interface Scene {
    [key: string]: {
        textures: Texture[];
        models: Model[];
    };
}

/**
 * Information to create a scene.
 */
export interface SceneInfo {
    [key: string]: {
        texture_infos: TextureInfo[];
        models: Model[];
    };
}

/**
 * Represents a SceneManager that manages scenes and their textures.
 */
export class SceneManager {
    private scenes: Scene;

    constructor(private gl: WebGL2RenderingContext) {
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
                param as unknown as number,
                texture.params[param as unknown as number]
            );
        }
    }

    private image3D(texture: Texture, img: HTMLImageElement) {
        // TODO: Implement image3D
        throw new Error("Not implemented");
    }

    /**
     * Loads textures for the specified scene.
     * @param scene - The scene to load.
     */
    public load(scene: string): void {
        const sc = this.scenes[scene];
        for (const tex of sc.textures) {
            this.gl.activeTexture(this.gl.TEXTURE0 + tex.tex_unit);
            this.gl.bindTexture(tex.fmt.target, tex.tex);
        }
    }

    /**
     * Draws the specified scene.
     * @param scene - The scene to draw.
     */
    public draw(scene: string): void {
        const sc = this.scenes[scene];
        for (const model of sc.models) {
            this.gl.useProgram(model.material.prog);
            for (const mesh of model.mesh) {
                mesh.vao.bind();
                mesh.drawFunc();
                mesh.vao.unbind();
            }
        }
    }
}
