import { gl } from "./Util";
import { TypedArray } from "./Types";
import { VAO } from "./VAO";

/* Abstraction hell.

Our render-specific part of the loop can 
encounter the following cases and their opposites:

- A static set of shader programs
- All shader programs have uniform data

- A static set of geometries
- All geometries have uniform data

And two additional cases:
- Some shader programs have uniform data
- Some geometries have uniform data

(2 states for static OR dynamic shaders) * (3 states for shader uniform data)
* (2 states for static OR dynamic geometries) * (3 states for geometry uniform data)
= 36 possible "perfect" render loops!

If we have both static shader programs and static geometries,
this is trivial to inline within the render loop. Not fun,
but if performance is critical...

    function renderLoop2()... // within any render loop it calls itself, duh
    function render()... "if condition then renderLoop2()..."

This extends to the case where one or the other is static.
A custom loop could be written for those.

That brings us to (1 * 3 * 1 * 3) = 9 possible render loops. 

Now there's one possible loop that is the least efficient, but may be necessary.
Under these conditions:
    - Some shader programs have uniform data
    - Some geometries have uniform data
    - A dynamic set of shader programs
    - A dynamic set of geometries

Then for each shader program we must check if it has uniform data.
And for each geometry we must check if it has uniform data.

This loop however, is capable of handling any permutation.
*/

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
 * We're forcing the use of UBOs for all uniforms.
 */
export type Uniform = [
    number,     // offset
    TypedArray, // data
]

/**
 * A uniform buffer object.
 */
export type UBO = [
    TypedArray, // Buffer data
    [
        string,   // Uniform name
        number,   // Number of elements * size of array element
        number,   // Offset
    ][],         // Array of uniforms' info
];

/**
 * How to draw something, and its data.
 */
export type Geometry = {
    vao: VAO,                     // vertex array object
    draw: () => void,             // draw function
    uniform_buffer?: WebGLBuffer, // geometry uniform buffer
    uniform_data?: TypedArray,    // geometry uniform data
}

/**
 * A mesh is a collection of geometries that share a material.
 */
export type Mesh = {
    program: WebGLProgram,        // shader program
    geometry: Geometry[],         // a list of geometries to render
    uniform_buffer?: WebGLBuffer, // program uniform buffer
    uniform_data?: TypedArray,    // program uniform data
}

/**
 * Draws the scene using the render_list
 */
export function drawScene(): void {
    for (let i = 0; i < render_list.length; i++) {
        const mesh = render_list[i];
        gl.useProgram(mesh.program);
        if (mesh.uniform_buffer) {
            gl.bindBuffer(gl.UNIFORM_BUFFER, mesh.uniform_buffer);
            /// #if DEBUG
            if (!mesh.uniform_data) throw new Error(
                `Mesh uniform data is undefined, but a buffer was specified: ${mesh}`
            );
            /// #endif
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, mesh.uniform_data);
        }

        for (let j = 0; j < mesh.geometry.length; j++) {
            const geometry = mesh.geometry[j];
            geometry.vao.bind();
            if (geometry.uniform_buffer) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, geometry.uniform_buffer);
                /// #if DEBUG
                if (!geometry.uniform_data) throw new Error(
                    `Geometry uniform data is undefined, but a buffer was specified: ${geometry}`
                );
                /// #endif
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, geometry.uniform_data);
            }
            geometry.draw(); // draw function
        }
    }
}