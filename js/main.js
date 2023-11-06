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
        out vec3 orientation;
        uniform mat4 modelViewProjection;

        void main() {
            gl_Position = modelViewProjection * position;

            // Calculate the orientation of the cube
            mat4 rotation = modelViewProjection;
            orientation = mat3(rotation) * position.xyz;
        }
    `;

    const fragmentShaderSource = `#version 300 es
        precision highp float;
        in vec3 orientation;
        out vec4 color;

        void main() {
            color = vec4(abs(orientation), 1);
        }
    `;

    // Create a shader program from vertex and fragment shader sources
    const shaderProgram = glUtils.makeProgram(vertexShaderSource, fragmentShaderSource);

	// Get attribute and uniform locations
    const attribs = glUtils.getAttribLocations(shaderProgram, [
        'position',
    ]);
    const uniforms = glUtils.getUniformLocations(shaderProgram, [
        'modelViewProjection',
    ]);

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
    const cubePositionBuffer = glUtils.makeBuffer(cubeVertices, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    const cubeIndexBuffer = glUtils.makeBuffer(cubeIndices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    // Create a vertex array object (attribute state)
    const cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    // Specify the position attribute for the vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

    // Bind the index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

    // Model
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [-0.5, 0, 0.5]); // Offset the cube slightly

    // View
    const viewMatrix = mat4.create();
    mat4.lookAt(
        viewMatrix,
        [0,0,2], // Camera position
        [0,0,0], // Target position
        [0,1,0] // Up vector
    );

    // Projection
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);
    
    // ModelViewProjection
    const modelViewProjectionMatrix = mat4.create();

    // Resize the canvas when the window is resized
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);
    });

    // Main rendering loop
    function render() {

        // Rotate the camera (view matrix)
        mat4.rotate(viewMatrix, viewMatrix,
            0.003, // Rotation angle
            [1, -1, 1] // Rotation axis
        );

        // Rotate the cube too!
        mat4.rotate(modelMatrix, modelMatrix,
            0.01, // Rotation angle
            [-0.2, -0.2, -0.2] // Rotation axis
        );

        // Update the model-view-projection matrix
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix); // Multiply the projection and view matrices
        mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix); // Multiply the model matrix

        // Update the uniform in the shader program
        gl.uniformMatrix4fv(uniforms.modelViewProjection, false, modelViewProjectionMatrix);

        // Clear the canvas and draw
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the depth buffer as well
        gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

        // Request the next frame
        requestAnimationFrame(render);
    }

    // Prepare WebGL for rendering
    gl.enable(gl.DEPTH_TEST);

    // This can go in the render loop if there are multiple shader programs
    // You may also need to bind the vertex array object for each object
    gl.useProgram(shaderProgram); 
    
    // Start the rendering loop
    window.dispatchEvent(new Event('resize')); // Set the initial canvas size
    render();
});