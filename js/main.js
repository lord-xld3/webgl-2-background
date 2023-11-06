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
		in mat4 model;
		uniform mat4 view;
        uniform mat4 projection;
		
		out vec4 v_color;

        void main() {
            gl_Position = projection * view * model * position;
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

	// Get attribute and uniform locations
    const attribs = glUtils.getAttribLocations(shaderProgram, [
        'position',
		'color',
		'model',
    ]);
    const uniforms = glUtils.getUniformLocations(shaderProgram, [
        'view',
		'projection',
    ]);

	// Create a vertex array object (attribute state)
    const cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    // Define cube vertices
	const cubePositionBuffer = glUtils.makeBuffer(
		new Float32Array([
			-0.5, -0.5, -0.5,
			0.5, -0.5, -0.5,
			0.5, 0.5, -0.5,
			-0.5, 0.5, -0.5,
			-0.5, -0.5, 0.5,
			0.5, -0.5, 0.5,
			0.5, 0.5, 0.5,
			-0.5, 0.5, 0.5,
		]), 
		gl.ARRAY_BUFFER, 
		gl.STATIC_DRAW
	);

	// Specify the position attribute for the vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(
		attribs.position, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		false, // Normalized
		0, // Stride, 0 = auto
		0 // Offset, 0 = auto
	);

	// Define cube indices
    const cubeIndexBuffer = glUtils.makeBuffer(
		new Uint16Array([
			0, 1, 2, 2, 3, 0, // Front face
			1, 5, 6, 6, 2, 1, // Right face
			5, 4, 7, 7, 6, 5, // Back face
			4, 0, 3, 3, 7, 4, // Left face
			3, 2, 6, 6, 7, 3, // Top face
			4, 5, 1, 1, 0, 4, // Bottom face
		]),
		gl.ELEMENT_ARRAY_BUFFER,
		gl.STATIC_DRAW
	);
	const numIndices = 36;
    
	// Bind the index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

	// Setup matrices, one per instance
	const numInstances = 4;
	const matrixData = new Float32Array(numInstances * 16);
	const matrices = [];
	for (let i = 0; i < numInstances; ++i) {
		const byteOffsetToMatrix = i * 16 * 4; // 4 bytes per float
		const numFloatsForView = 16;
		matrices.push(new Float32Array(
			matrixData.buffer, 
			byteOffsetToMatrix, 
			numFloatsForView
		));
	}

	const matrixBuffer = glUtils.makeBuffer(matrixData, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);

	// Set attributes for each matrix
	for (let i = 0; i < 4; i++) { // 4 attributes
		const location = attribs.model + i;
		gl.enableVertexAttribArray(location);
		const offset = i * 16; // 4 floats per row, 4 bytes per float
		gl.vertexAttribPointer(
			location, // Attribute location
			4, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			false, // Normalized
			16 * 4, // Stride, 16 floats per matrix, 4 bytes per float
			offset // Offset
		);
		gl.vertexAttribDivisor(location, 1); // This attribute only changes for each 1 instance
	}

	// Setup a color for each instance
	const colorBuffer = glUtils.makeBuffer(
		new Float32Array([
			1, 0, 0, 1, // Red
			0, 1, 0, 1, // Green
			0, 0, 1, 1, // Blue
			1, 1, 0, 1, // Yellow
		]),
		gl.ARRAY_BUFFER,
		gl.STATIC_DRAW
	);

	// Set attributes for each color
	gl.enableVertexAttribArray(attribs.color);
	gl.vertexAttribPointer(
		attribs.color, // Attribute location
		4, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		false, // Normalized
		0, // Stride, 0 = auto
		0 // Offset, 0 = auto
	);
	gl.vertexAttribDivisor(attribs.color, 1); // This attribute only changes for each 1 instance

	// View
	const viewMatrix = mat4.lookAt(mat4.create(), 
		[0, 1, 6], // Eye position
		[0, 0, 0], // Target position
		[0, 1, 0] // Up vector
	);

	// Projection
	const projectionMatrix = mat4.perspective(mat4.create(), 
		45, // Field of view
		canvas.width / canvas.height, // Aspect ratio
		0.1, // Near
		100 // Far
	);

    // Resize the canvas when the window is resized
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
		mat4.perspective(mat4.create(), 
			45, // Field of view
			canvas.width / canvas.height, // Aspect ratio
			0.1, // Near
			100 // Far
		);
    });

	let tick = 0;
	let tickRate = 0.01;
	let maxTick = 2 * Math.PI; // 360 degrees

    // Main rendering loop
    function render() {

		// Clear the canvas
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Rotate the camera
    	gl.uniformMatrix4fv(uniforms.view, false,
			mat4.rotate(viewMatrix, viewMatrix, 0.005, [0, 1, 0])
		);
		
		// Upload the projection matrix in case it changed
		gl.uniformMatrix4fv(uniforms.projection, false, projectionMatrix);

		tick = (tick + tickRate) % maxTick;

		// Update the matrices
		matrices.forEach((matrix, i) => {
			mat4.identity(matrix);
			mat4.translate(matrix, matrix, [0, 0, -2 * i + 3])
			mat4.rotate(matrix, matrix, 
				Math.sin(tick) * Math.PI * 2 + i, // Angle
				[-0.8, 0.5, 0.4] // Axis
			);
		});

		// Upload the new matrix data
		gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

		// Draw the cube instances
		gl.drawElementsInstanced(
			gl.TRIANGLES, 
			numIndices, 
			gl.UNSIGNED_SHORT, 
			0, 
			numInstances
		);

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