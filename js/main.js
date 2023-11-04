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

    // Create a shader program from vertex and fragment shader sources
    const shaderProgram = glUtils.makeProgram(vertexShaderSource, fragmentShaderSource);

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
    const positionBuffer = glUtils.makeBuffer(vertexPositions, gl.ARRAY_BUFFER);
    const colorBuffer = glUtils.makeBuffer(vertexColors, gl.ARRAY_BUFFER);

    // Release data after copying into buffers
    vertexPositions = null;
    vertexColors = null;

    // On resize, update the canvas size and viewport
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
    

    // Get attribute locations
    const attribs = glUtils.getAttribLocations(shaderProgram, ['position', 'color']);

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

    // Create a list of objects to use with gl.drawArrays
    const objectArrays = [
        {
            program: shaderProgram,
            objects: [
                {
                    vao: triangleVAO,
                    drawMode: gl.TRIANGLES,
                    count: 3,
                }
            ],
        },
    ];

    // Render using gl.drawArrays
    function renderArrays() {
        for (let i = 0; i < objectArrays.length; i++) {
            const objectArray = objectArrays[i];
            const program = objectArray.program;
            gl.useProgram(program);
            for (let j = 0; j < objectArray.objects.length; j++) {
                const object = objectArray.objects[j];
                gl.bindVertexArray(object.vao);
                gl.drawArrays(object.drawMode, 0, object.count);
            }
        }
    }

    const taskQueue = [renderArrays];

    function render() {
        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Process task queue
        while (taskQueue.length > 0) {
            taskQueue.pop()();
        }

        // Repopulate task queue
        taskQueue.push(renderArrays);

        // Request next frame
        requestAnimationFrame(render);
    }
    window.dispatchEvent(new Event('resize')); // Set initial size
    render();
});