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

    return shaderProgram;
}

// Create a buffer object and load data into it
function makeBuffer(gl, data, bufferType) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, data, gl.STATIC_DRAW);
}