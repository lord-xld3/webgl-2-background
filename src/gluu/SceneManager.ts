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
    geometries: Geometry[],  // a list of geometries to render
    globals?: number[],    // global state options
    material?: Material,   // material uniform data
}

/**
 * Draws the scene using the render_list
 */
export function drawScene(): void {
    render_list.forEach((mesh) => {
        
        // global state options
        mesh.globals?.forEach((global) => {
            gl.enable(global);
        });

        gl.useProgram(mesh.program);
        
        // program-specific uniforms
        if (mesh.material) {
            gl.bindBuffer(gl.UNIFORM_BUFFER, mesh.material.buffer);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, mesh.material.data);
        }

        // load and draw each geometry
        mesh.geometries.forEach((geometry) => {
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

export function createScene(
    meshes: {
        program: WebGLProgram,
        geometries: {
            vao: VAO,
            draw: () => void,
            material?: Material,
        }[],
        globals?: number[],
        material?: Material,
    }[],
    textures?: {
        src: string,
        tex_unit?: number,
        params?: {
            [key: number]: number,
        },
        format?: {
            [key: number]: number,
        }
    }[],
): Scene {
    // default texture format
    const default_format = {
        target: gl.TEXTURE_2D,
        mip_level: 0,
        internal_format: gl.RGBA,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
    };

    const gl_textures: {tex: WebGLTexture, unit: number}[] | undefined
    = textures?.map((texture, i) => {
        
        // create default texture
        const tex = gl.createTexture() as WebGLTexture;
        const unit = texture.tex_unit || i;
        gl.bindTexture(default_format.target, tex);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            2,
            2,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            // default texture
            new Uint8Array([
                192, 0, 192, 255,
                192, 128, 0, 255,
                192, 128, 0, 255,
                192, 0, 192, 255
            ])
        );

        // default mipmap
        gl.generateMipmap(default_format.target);
        gl.texParameteri(default_format.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        
        // async load actual texture and re-bind/update it
        const img = new Image();
        img.onload = () => {
            const format = Object.assign(default_format, texture.format);
            gl.bindTexture(format.target, tex);
            gl.texImage2D(
                format.target,
                format.mip_level,
                format.internal_format,
                format.format,
                format.type,
                img
            );
            gl.generateMipmap(format.target);
            // use parameters
            for (const param in texture.params) {
                gl.texParameteri(
                    default_format.target, 
                    param as unknown as number, 
                    texture.params[param as unknown as number]
                );
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load texture from: ${texture.src}`);
        }
        img.src = texture.src;

        return {
            tex: tex,
            unit: unit,
        }
    });

    return {
        load: () => {
            gl_textures?.forEach((texture) => {
                gl.activeTexture(gl.TEXTURE0 + texture.unit);
                gl.bindTexture(gl.TEXTURE_2D, texture.tex);
            });
            render_list = meshes;
        }
    }
}