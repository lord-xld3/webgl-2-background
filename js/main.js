// main.js

// Entry point
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 not supported');
    }

    // Compile and link shaders
    const vertexShaderSource = document.getElementById('vertex-shader').text;
    const fragmentShaderSource = document.getElementById('fragment-shader').text;
    const shaderProgram = makeProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(shaderProgram);

    // Create buffer objects and load data into them
    
});