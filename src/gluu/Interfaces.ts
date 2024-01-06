import { VAO } from "./VAO";
import { TypedArray } from "./gluu";

/**
 * Info passed in to create a VertexAttributePointer.
 */
export interface AttributeInfo {
    key: string;
    size: number;
    type?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
}

/**
 * A located VertexAttributePointer.
 */
export interface VertexAttributePointer {
    loc: number;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
}

/**
 * Represents information about a buffer.
 */
export interface BufferInfo {
    data: TypedArray;
    target: number;
    usage: number;
}

/**
 * Represents information about an attribute buffer.
 */
export interface VertexBufferInfo extends BufferInfo {
    stride?: number;
}

/**
 * Represents information about a uniform block.
 */
export interface UniformBlockInfo {
    key: string;
    binding?: number;
}

/**
 * Represents information about a uniform within a UBO.
 */
export interface UniformInfo {
    [key: string]: {
        offset: number;
    };
}

/**
 * Texture information passed in to create a Texture.
 */
interface TextureInfo {
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
interface Material {
    prog: WebGLProgram;
    uniforms?: UniformInfo;
}

interface Mesh {
    vao: VAO;
    drawFunc: () => void;
}

/**
 * A mesh and its associated material.
 */
export interface Model {
    mesh: Mesh;
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