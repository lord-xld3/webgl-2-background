// main.js

// Entry point
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 not supported');
    }

    const vertexShaderSource = `#version 300 es
    in vec4 position;
    in vec4 color;
    out vec4 v_color;

    void main() {
        gl_Position = position;
        v_color = color;
    }`;

    const fragmentShaderSource = `#version 300 es
    precision highp float;
    in vec4 v_color;
    out vec4 outColor;

    void main() {
        outColor = v_color;
    }`;

    // Data for vertex positions and colors
    let vertexPositions = new Float32Array([
        0, 0.7,
        0.5, -0.7,
        -0.5, -0.7,
    ]);

    let vertexColors = new Uint8Array([
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
    ]);

    // Create buffers from data
    const positionBuffer = makeBuffer(gl, vertexPositions, gl.ARRAY_BUFFER);
    const colorBuffer = makeBuffer(gl, vertexColors, gl.ARRAY_BUFFER);

    // Create a shader program from vertex and fragment shader sources
    const shaderProgram = makeProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Get attribute locations
    const attribs = getAttribLocations(gl, shaderProgram, ['position', 'color']);

    // Create a vertex array object (attribute state)
    const triangleVAO = gl.createVertexArray();
    gl.bindVertexArray(triangleVAO);
    
    // Bind buffers to attribute locations
    gl.enableVertexAttribArray(attribs.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.enableVertexAttribArray(attribs.color);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(attribs.color, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    

    // Release data after copying into buffers
    vertexPositions = null;
    vertexColors = null;

    

    // On resize, update the canvas size and viewport
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
    window.dispatchEvent(new Event('resize')); // Set initial size

    gl.useProgram(shaderProgram);

    // compute 3 vertices for 1 triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);
});