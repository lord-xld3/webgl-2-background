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
 * @param {Image} textures[].image image data
 * @param {Object} textures[].format texture format
 * @param {Number} textures[].format.texFormat texture format (gl.RGBA, gl.RGB, etc.)
 * @param {Number} textures[].format.srcFormat source format (gl.RGBA, gl.RGB, etc.)
 * @param {Number} textures[].format.srcType source type (gl.UNSIGNED_BYTE, gl.FLOAT, etc.)
 * @param {Object} textures[].options texture options
 * @param {Number} textures[].options.TEXTURE_WRAP_S texture wrap s (gl.REPEAT, gl.CLAMP_TO_EDGE, etc.)
 * @param {Number} textures[].options.TEXTURE_WRAP_T texture wrap t (gl.REPEAT, gl.CLAMP_TO_EDGE, etc.)
 * @param {Number} textures[].options.TEXTURE_MIN_FILTER texture min filter (gl.NEAREST, gl.LINEAR, etc.)
 * @param {Number} textures[].options.TEXTURE_MAG_FILTER texture mag filter (gl.NEAREST, gl.LINEAR, etc.)
 * @returns {void} nothing
 */
export function makeTextures(gl, textures) {
    function newTexture(iter, image, 
        fmt = {
            texFormat: gl.RGBA,
            srcFormat: gl.RGBA,
            srcType: gl.UNSIGNED_BYTE,
        }, 
        opt = {
            TEXTURE_WRAP_S: gl.REPEAT,
            TEXTURE_WRAP_T: gl.REPEAT,
            TEXTURE_MIN_FILTER: gl.NEAREST,
            TEXTURE_MAG_FILTER: gl.NEAREST,
        }) {

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + iter);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        // Set texture options
        Object.entries(opt).forEach(([key, value]) => {
            gl.texParameteri(gl.TEXTURE_2D, gl[key], value);
        });

        // Load image data
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            fmt.texFormat,
            fmt.srcFormat,
            fmt.srcType,
            image
        );
    }

    for (let i = 0; i < textures.length; i++) {
        newTexture(i, textures[i].image, textures[i].format, textures[i].options);
    }
}
