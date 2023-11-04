// gl-utils.js

// Compile, link, and return a shader program
function makeProgram(gl, vertexShaderSource, fragmentShaderSource) {
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

// Load data into a buffer and return the buffer
function makeBuffer(gl, data, bufferType) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, data, gl.STATIC_DRAW);
    return buffer;
}

// Get attribute locations from shader program
function getAttribLocations(gl, shaderProgram, attribs) {
    let locations = {};
    // Return an object with attrib as key and location as values
    for (i=0; i<attribs.length; i++) {
        locations[attribs[i]] = gl.getAttribLocation(shaderProgram, attribs[i]);
    }
    return locations;
}