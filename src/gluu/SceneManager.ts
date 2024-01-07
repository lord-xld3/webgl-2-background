import { gl } from "./Util";
import { VAO } from "./VAO";

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

export interface UniformBlockInfo {
    key: string; // Block key/name
    uniforms: UniformInfo; // Uniforms within the block
    binding?: number; // Binding point for the block
    usage?: number; // Buffer usage
}

export interface UniformInfo {
    [key: string]: {
        type: number; // Uniform type (e.g., gl.FLOAT_VEC3)
        size: number; // Uniform size
        offset: number; // Offset within the block
    };
}

export interface Material {
    prog: WebGLProgram;
    blockInfo?: UniformBlockInfo; // Program's uniform block info
}

export interface Mesh {
    vao: VAO;
    drawFunc: () => void;
    blockInfo?: UniformBlockInfo; // Mesh-specific uniform block info
}

export interface Model {
    mesh: Mesh[];
    material: Material;
}

export interface Scene {
    [key: string]: {
        textures: Texture[];
        models: Model[];
        blockInfo?: UniformBlockInfo; // Scene-level uniform block info
    }
}

export interface SceneInfo {
    [key: string]: {
        texture_infos: TextureInfo[];
        models: Model[];
        blockInfo?: UniformBlockInfo; // Scene-level uniform block info
    };
}

let scenes: Scene = {};

export async function createScenes(scene_info: SceneInfo): Promise<void> {
    const texturePromises = Object.entries(scene_info).map(async ([k, v]) => {
        const texturePromises = v.texture_infos.map(async (tex, i) => {
            if (i > 31) throw new Error("Can't load more than 32 textures");
            
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
export function drawScene(scene: string): void {
    scenes[scene].models.forEach((model) => {
        gl.useProgram(model.material.prog);
        model.mesh.forEach((mesh) => {
            mesh.vao.bind();
            mesh.drawFunc();
        });
    });
}

function createUBOs(scene: {
    models: Model[];
    blockInfo?: UniformBlockInfo;
}): void {
    
    // Set to store unique block keys encountered
    const uniqueBlocks = new Set<string>();

    // Recursively crawl through models/meshes, collect unique block keys
    function collectBlocks(model: Model) {
        // Check if the model has a blockInfo and process it
        if (model.material.blockInfo) {
            uniqueBlocks.add(model.material.blockInfo.key);
        }

        // Check blockInfo for each mesh in the model
        model.mesh.forEach(mesh => {
            if (mesh.blockInfo) {
                uniqueBlocks.add(mesh.blockInfo.key);
            }
        });
    }

    // Traverse through each model in the scene to collect unique block keys
    scene.models.forEach(model => {
        collectBlocks(model);
    });

    
}