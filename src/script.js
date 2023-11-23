// script.js
const fs = require('fs');

// Input path for shaders
const shadersDirectory = 'shaders/';

// Output uniform info to outputPath/{shaderName}.json
const outputDirectory = 'json/';

function crawlUniforms() {
    fs.readdirSync(shadersDirectory).forEach((file) => {
        if (file.endsWith('.glsl')) {
            const shaderName = file.split('.')[0];
            const shaderCode = fs.readFileSync(`${shadersDirectory}/${file}`, 'utf8');
            const uniforms = shaderCode.match(/uniform\s+\w+\s+\w+\s*;/g);
            let shaderData = { shader: shaderName, uniforms: [] };

            if (uniforms) {
                uniforms.forEach((uniform) => {
                    const [uniformName, primative, type, uniformElements, uniformFunction] = extractUniformInfo(uniform);
                    shaderData.uniforms.push({
                        name: uniformName,
                        primative: primative,
                        type,
                        elements: uniformElements,
                        function: uniformFunction,
                    });
                });
                mapDefaultValues(shaderData);
            }
            // Else, don't output a file without uniforms
        }
    });
}

// Extract uniform info
function extractUniformInfo(uniform) {
    const regex = /uniform\s+([\w\s]+)\s+(\w+)\s*;/;
    const matches = uniform.match(regex);

    if (matches && matches.length >= 3) {
        const uniformName = matches[2].trim();
        const type = matches[1].trim();
        const [primative, uniformElements, uniformFunction] = mapTypes(type);

        return [uniformName, primative, type, uniformElements, uniformFunction];
    }

    return ['', '', '', '', ''];
}

// Map uniform type to primative type, elements, and uniform function
function mapTypes(type) {
    const typeWithElements = {
        vec2: ['float', 2, 'uniform2fv'],
        vec3: ['float', 3, 'uniform3fv'],
        vec4: ['float', 4, 'uniform4fv'],
        ivec2: ['int', 2, 'uniform2iv'],
        ivec3: ['int', 3, 'uniform3iv'],
        ivec4: ['int', 4, 'uniform4iv'],
        uvec2: ['uint', 2, 'uniform2uv'],
        uvec3: ['uint', 3, 'uniform3uv'],
        uvec4: ['uint', 4, 'uniform4uv'],
        bvec2: ['bool', 2, 'uniform2bv'],
        bvec3: ['bool', 3, 'uniform3bv'],
        bvec4: ['bool', 4, 'uniform4bv'],
        mat2: ['float', 4, 'uniformMatrix2fv'],
        mat3: ['float', 9, 'uniformMatrix3fv'],
        mat4: ['float', 16, 'uniformMatrix4fv'],
        float: ['float', 1, 'uniform1f'],
        int: ['int', 1, 'uniform1i'],
        uint: ['uint', 1, 'uniform1u'],
        bool: ['bool', 1, 'uniform1b'],
    };
    return typeWithElements[type];
}

// Map default values to uniforms for controls
function mapDefaultValues(data) {
    let defaults = { shader: data.shader, uniforms: [] };
    data.uniforms.forEach((uniform) => {
        let defaultUniform = {
            name: uniform.name,
            function: uniform.function,
            elements: uniform.elements,
        };
        switch (uniform.primative) {
            case 'float':
                Object.assign(defaultUniform, { min: 0, max: 1, step: 0.1, init: 0.5 });
                break;
            case 'int':
                Object.assign(defaultUniform, { min: -10, max: 10, step: 1, init: 0 });
                break;
            case 'uint':
                Object.assign(defaultUniform, { min: 0, max: 10, step: 1, init: 5 });
                break;
            case 'bool':
                Object.assign(defaultUniform, { init: false });
                break;
            default:
                throw new Error(`Unrecognized uniform type ${uniform.primative}`);
        }
        defaults.uniforms.push(defaultUniform);
    });
    fs.writeFileSync(`${outputDirectory}${data.shader}.json`, JSON.stringify(defaults, null, 4));
}

crawlUniforms();
