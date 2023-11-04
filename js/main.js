// main.js

// Entry point
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 not supported');
    }

    // Initialize glUtils with gl context
    glUtils.init(gl);

    const vertexShaderSource = `#version 300 es
        in vec4 position;
        in vec4 color;
        out vec4 v_color;

        uniform mat4 modelViewProjectionMatrix;

        void main() {
            gl_Position = modelViewProjectionMatrix * position;
            v_color = color;
        }
    `;

    const fragmentShaderSource = `#version 300 es
        precision highp float;
        in vec4 v_color;
        out vec4 outColor;

        void main() {
            outColor = v_color;
        }
    `;

    // Create a shader program from vertex and fragment shader sources
    const shaderProgram = glUtils.makeProgram(vertexShaderSource, fragmentShaderSource);

    // Define cube vertices and colors
    const cubeVertices = new Float32Array([
        // Vertex positions
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        
        // Vertex colors
        0, 0, 0, 1,
        0, 0, 1, 1,
        0, 1, 0, 1,
        0, 1, 1, 1,
        1, 0, 0, 1,
        1, 0, 1, 1,
        1, 1, 0, 1,
        1, 1, 1, 1,
    ]);

    // Define cube indices for drawing
    const cubeIndices = new Uint16Array([
        0, 1, 2, 0, 2, 3, // Front face
        4, 5, 6, 4, 6, 7, // Back face
        0, 4, 7, 0, 7, 3, // Left face
        1, 5, 6, 1, 6, 2, // Right face
        0, 1, 5, 0, 5, 4, // Bottom face
        3, 2, 6, 3, 6, 7  // Top face
    ]);

    // Create buffers for vertices and indices
    const cubePositionBuffer = glUtils.makeBuffer(cubeVertices, gl.ARRAY_BUFFER);
    const cubeIndexBuffer = glUtils.makeBuffer(cubeIndices, gl.ELEMENT_ARRAY_BUFFER);

    // Get attribute and uniform locations
    const attribs = glUtils.getAttribLocations(shaderProgram, ['position', 'color']);
    const modelViewProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'modelViewProjectionMatrix');

    // Create a vertex array object (attribute state)
    const cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    // Specify the position attribute for the vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

    // Specify the color attribute for the vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.enableVertexAttribArray(attribs.color);
    gl.vertexAttribPointer(attribs.color, 4, gl.FLOAT, false, 0, 24 * 4); // Skip the first 24 bytes (6 floats * 4 bytes)

    // Bind the index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

    // Define initial transformation matrix for the cube
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [0, 0, -5]); // Move the cube back in the z-direction

    // Set up uniforms
    const modelViewProjectionMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);
    const viewMatrix = mat4.create();

    // Set up the model, view, and projection matrices
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);
    
    // Use the shader program and set the model-view-projection matrix
    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(modelViewProjectionMatrixLocation, false, modelViewProjectionMatrix);

    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);
    });

    // Main rendering loop
    function render() {
        mat4.rotate(modelMatrix, modelMatrix, 0.002, [0.7, 1, -0.3]); // Rotate around 3 axes

        // Update the model-view-projection matrix
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
        mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);

        gl.uniformMatrix4fv(modelViewProjectionMatrixLocation, false, modelViewProjectionMatrix);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the depth buffer as well

        // Bind the cube buffers and draw
        gl.bindVertexArray(cubeVAO);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

        // Request the next frame
        requestAnimationFrame(render);
    }

    // Set up the depth buffer and enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(1.0);

    // Start the rendering loop
    window.dispatchEvent(new Event('resize'));
    render();
});