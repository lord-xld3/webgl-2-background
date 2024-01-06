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

export interface Texture extends TextureInfo {
    tex: WebGLTexture;
}

interface Material {
    prog: WebGLProgram;
    uniforms: UniformInfo;
}

interface Model {
    mesh: VAO;
    material: Material;
}

export interface Scene {
    [key: string]: {
        textures: Texture[];
        models: Model[];
    };
}
