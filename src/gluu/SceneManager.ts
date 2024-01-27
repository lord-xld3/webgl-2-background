import { gl } from "./Util";
import { TypedArray } from "./Types";
import { VAO } from "./VAO";

/**
 * The global list of things to render.
 */
export let render_list: Mesh[] = [];

/**
 * A map to access the meshes by name.
 */
export let mesh_map: MiniMap<string | symbol, number> = {};

/**
 * A map to access the geometries by name.
 */
export let geometry_map: MiniMap<string | symbol, number> = {};

/**
 * A common key-value map.
 */
export type MiniMap<K extends string | symbol, V> = {
    [key in K]: V;
};

/**
 * A material is just uniform data.
 */
export type Material = {
    buffer: WebGLBuffer, // material uniform buffer
    data: TypedArray,    // material uniform data
}

/**
 * How to draw something, and its data.
 */
export type Geometry = {
    vao: VAO,             // vertex array object
    draw: () => void,     // draw function
    material?: Material,  // material uniform data
}

/**
 * A mesh is a collection of geometries that share a material.
 */
export type Mesh = {
    program: WebGLProgram, // shader program
    geometry: Geometry[],  // a list of geometries to render
    globals?: number[],    // global state options
    material?: Material,   // material uniform data
}

/**
 * Draws the scene using the render_list
 */
export function drawScene(): void {
    render_list.forEach((mesh) => {
        
        // global state options
        if (mesh.globals) {
            mesh.globals.forEach((global) => {
                gl.enable(global);
            });
        }

        gl.useProgram(mesh.program);
        
        // program-specific uniforms
        if (mesh.material) {
            gl.bindBuffer(gl.UNIFORM_BUFFER, mesh.material.buffer);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, mesh.material.data);
        }

        // load and draw each geometry
        mesh.geometry.forEach((geometry) => {
            geometry.vao.bind();

            // geometry-specific uniforms
            if (geometry.material) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, geometry.material.buffer);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, geometry.material.data);
            }
            geometry.draw(); // draw function
        });
    });
}

export type Scene = {
    load: () => void,
}

export type SceneInfo = {
    textures: {
        src: string,
        tex_unit?: number,
        params?: {
            [key: number]: number,
        },
        format?: {
            [key: number]: number,
        }
    }[],
    meshes: {
        program: WebGLProgram,
        geometry: {
            vao: VAO,
            draw: () => void,
            material?: Material,
        }[],
        globals?: number[],
        material?: Material,
    }[],
}

export function createScene(scene: SceneInfo): Scene {
    // default texture format
    const default_format = {
        target: gl.TEXTURE_2D,
        mip_level: 0,
        internal_format: gl.RGBA,
        width: 2,
        height: 2,
        border: 0,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
    };

    const textures: {texture: WebGLTexture, unit: number}[] = [];
    for (let i = 0; i < scene.textures.length; i++) {
        const texture = scene.textures[i];

        // create texture
        const tex = gl.createTexture() as WebGLTexture;
        const unit = texture.tex_unit || i;
        gl.bindTexture(default_format.target, tex);
        gl.texImage2D(
            default_format.target,
            default_format.mip_level,
            default_format.internal_format,
            default_format.width,
            default_format.height,
            default_format.border,
            default_format.format,
            default_format.type,
            // default texture
            new Uint8Array([
                192, 0, 192, 255,
                192, 128, 0, 255,
                192, 128, 0, 255,
                192, 0, 192, 255
            ])
        );

        gl.generateMipmap(default_format.target);

        // use parameters
        for (const param in texture.params) {
            gl.texParameteri(
                default_format.target, 
                param as unknown as number, 
                texture.params[param as unknown as number]
            );
        }

        textures.push({texture: tex, unit: unit});
    }

    return {
        load: () => {
            textures.forEach((texture) => {
                gl.activeTexture(gl.TEXTURE0 + texture.unit);
                gl.bindTexture(gl.TEXTURE_2D, texture.texture);
            });
            render_list = scene.meshes;
        }
    }
}