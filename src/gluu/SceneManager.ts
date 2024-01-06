import { gl } from "./Util";
import { VAO } from "./VAO";
import { UniformInfo } from "./Interfaces";

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

export interface Material {
    prog: WebGLProgram;
    uniforms?: UniformInfo;
}

export interface Mesh {
    vao: VAO;
    drawFunc: () => void;
}

export interface Model {
    mesh: Mesh[];
    material: Material;
}
export interface Scene {
    [key: string]: {
        textures: Texture[];
        models: Model[];
    }
}

export interface SceneInfo {
    [key: string]: {
        texture_infos: TextureInfo[];
        models: Model[];
    };
}

let scenes: Scene = {};

export async function initScene(scene_info: SceneInfo): Promise<void> {
    const texturePromises = Object.entries(scene_info).map(async ([k, v]) => {
        const texturePromises = v.texture_infos.map(async (tex, i) => {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load image: ${tex.src}`));
                img.src = tex.src;
            });

            const texture: Texture = {
                tex: gl.createTexture() as WebGLTexture,
                tex_unit: tex.tex_unit ?? i,
                img3D: tex.img3D ?? false,
                fmt: {
                    target: tex.fmt?.target ?? gl.TEXTURE_2D,
                    mip_level: tex.fmt?.mip_level ?? 0,
                    internal_format: tex.fmt?.internal_format ?? gl.RGBA,
                    format: tex.fmt?.format ?? gl.RGBA,
                    type: tex.fmt?.type ?? gl.UNSIGNED_BYTE,
                },
                params: tex.params ?? {},
            };

            texture.img3D ? image3D(texture, img) : image2D(texture, img);
            return texture;
        });

        scenes[k] = {
            textures: await Promise.all(texturePromises),
            models: v.models,
        };
    });

    await Promise.all(texturePromises);
}



function image2D(texture: Texture, img: HTMLImageElement) {
    gl.activeTexture(gl.TEXTURE0 + texture.tex_unit);
    gl.bindTexture(texture.fmt.target, texture.tex);
    gl.texImage2D(
        texture.fmt.target,
        texture.fmt.mip_level,
        texture.fmt.internal_format,
        texture.fmt.format,
        texture.fmt.type,
        img
    );
    gl.generateMipmap(texture.fmt.target);
    for (const param in texture.params) {
        gl.texParameteri(
            texture.fmt.target,
            param as unknown as number,
            texture.params[param as unknown as number]
        );
    }
};

function image3D(texture: Texture, img: HTMLImageElement) {
    // TODO: Implement image3D
    throw new Error("Not implemented");
};

/**
 * Loads textures for a scene.
 * @param scene - The name of the scene to load.
 */
export function loadScene(scene: string): void {
    scenes[scene].textures.forEach((texture) => {
        gl.activeTexture(gl.TEXTURE0 + texture.tex_unit);
        gl.bindTexture(texture.fmt.target, texture.tex);
    });
}

/**
 * Draws a scene.
 * @param scene - The name of the scene to draw.
 */
export function draw(scene: string): void {
    scenes[scene].models.forEach((model) => {
        gl.useProgram(model.material.prog);
        model.mesh.forEach((mesh) => {
            mesh.vao.bind();
            mesh.drawFunc();
        });
    });
}
