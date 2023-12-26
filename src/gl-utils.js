/** Create a WebGL shader program
 * @param {WebGLRenderingContext} gl gl context
 * @param {String} vertexShaderSource source code for vertex shader
 * @param {String} fragmentShaderSource source code for fragment shader
 * @returns {WebGLProgram} gl shader program
 */
export function makeProgram(gl, vertexShaderSource, fragmentShaderSource) {
    function makeShader(shaderSource, shaderType) {
        const shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            throw new Error(`Could not compile shader: ${shaderSource} \n\n${info}`);
        }

        return shader;
    }
    const vertexShader = makeShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = makeShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(shaderProgram);
        throw new Error(`Could not link shader program. \n\n${info}`);
    }

    return shaderProgram;
}

/** Return attribute locations from shader program
 * @param {WebGLRenderingContext} gl gl context
 * @param {WebGLProgram} shaderProgram gl shader program
 * @param {Array<String>} attribs array of attribute names
 * @returns {Object} object with attribute names as keys and attribute locations as values
 */
export function getAttribLocations(gl, shaderProgram, attribs) {
    const attribLocations = {};
    for (let i = 0; i < attribs.length; i++) {
        attribLocations[attribs[i]] = gl.getAttribLocation(shaderProgram, attribs[i]);
        if (attribLocations[attribs[i]] === -1) {
            throw new Error(`Could not get attribute location for ${attribs[i]}`);
        }
    }
    return attribLocations;
}

/** Return uniform locations from shader program
 * @param {WebGLRenderingContext} gl gl context
 * @param {WebGLProgram} shaderProgram gl shader program
 * @param {Array<String>} uniforms array of uniform names
 * @returns {Object} object with uniform names as keys and uniform locations as values
 */
export function getUniformLocations(gl, shaderProgram, uniforms) {
    const uniformLocations = {};
    for (let i = 0; i < uniforms.length; i++) {
        uniformLocations[uniforms[i]] = gl.getUniformLocation(shaderProgram, uniforms[i]);
        if (uniformLocations[uniforms[i]] === -1) {
            throw new Error(`Could not get uniform location for ${uniforms[i]}`);
        }
    }
    return uniformLocations;
}

/** Create a buffer, bind it, and load data into it
 * @param {WebGLRenderingContext} gl gl context
 * @param {ArrayBuffer} data data to load into buffer
 * @param {Number} bufferType buffer type (gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER)
 * @param {Number} drawType draw type (gl.STATIC_DRAW, gl.DYNAMIC_DRAW, or gl.STREAM_DRAW)
 * @returns {WebGLBuffer} gl buffer, bound and loaded with data
 */
export function makeBuffer(gl, data, bufferType, drawType) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, data, drawType);
    return buffer;
}

/** Setup attribute pointer after binding/creating a buffer. Not used with element array buffers.
 * @param {WebGLRenderingContext} gl gl context
 * @param {Number} attrib attribute location
 * @param {Object} pointer attribute pointer object
 * @param {Number} pointer.size number of components per vertex attribute
 * @param {Number} pointer.type data type of each component in the array
 * @param {Boolean} pointer.normalize whether integer data values should be normalized
 * @param {Number} pointer.stride byte offset between consecutive vertex attributes
 * @param {Number} pointer.offset offset of the first component of the first vertex attribute
 * @returns {void} nothing
 */
export function setAttribPointer(gl, attrib, pointer) {
    gl.enableVertexAttribArray(attrib);
    gl.vertexAttribPointer(
        attrib,
        pointer.size,
        pointer.type,
        pointer.normalize,
        pointer.stride,
        pointer.offset
    );
}

/** Create and bind textures to texture units
 * @param {WebGLRenderingContext} gl gl context
 * @param {Array<Object>} textures array of texture objects
 * @param {String} textures.src path to texture image
 * @param {Object} textures.fmt texture format object
 * @param {Object} textures.params texture parameters object
 * @returns {void} nothing
 */
export async function loadTextures(gl, textures) {
    textures.forEach((tex, i) => {
        const image = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = tex.src;
        });

        const defaultFmt = {
            target: gl.TEXTURE_2D,
            level: 0,
            internalFormat: gl.RGBA,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
        };
        
        tex.fmt = Object.assign(defaultFmt, tex.fmt);

        image.then((img) => {
            gl.activeTexture(gl.TEXTURE0 + i);
            const texID = gl.createTexture();
            gl.bindTexture(tex.fmt.target, texID);
            gl.texImage2D(
                tex.fmt.target,
                tex.fmt.level,
                tex.fmt.internalFormat,
                tex.fmt.format,
                tex.fmt.type,
                img
            );
            gl.generateMipmap(tex.fmt.target);
            
            // Set texture parameters / filters
            for (const key in tex.params) {
                gl.texParameteri(tex.fmt.target, gl[key], tex.params[key])
            }
        });
    });
}

