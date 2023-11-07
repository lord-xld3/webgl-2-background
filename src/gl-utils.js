// gl-utils.js

// Create a shader program from vertex and fragment shader sources
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

// Create a buffer from data
export function makeBuffer(gl, data, bufferType, drawType) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, data, drawType);
    return buffer;
}

// Get attribute locations
export function getAttribLocations(gl, shaderProgram, attribs) {
    let locations = {};
    // Return an object with attribs as keys and locations as values
    for (let i = 0; i < attribs.length; i++) {
        locations[attribs[i]] = gl.getAttribLocation(shaderProgram, attribs[i]);
    }
    return locations;
}

// Get uniform locations
export function getUniformLocations(gl, shaderProgram, uniforms) {
    let locations = {};
    // Return an object with uniforms as keys and locations as values
    for (let i = 0; i < uniforms.length; i++) {
        locations[uniforms[i]] = gl.getUniformLocation(shaderProgram, uniforms[i]);
    }
    return locations;
}