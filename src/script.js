// script.js
// Generates uniform information for all shaders in the shaders/ directory
// Outputs the information to json/{shaderName}.json

const fs = require('fs');

function uniformCrawler(shaderDir) {
    fs.readdirSync(shaderDir).forEach((file) => {
        if (file.endsWith('.glsl')) {
            const filename = file.split('.')[0];
            const shader = fs.readFileSync(`${shaderDir}/${file}`, 'utf8');
            const uniforms = shader.match(/uniform\s+\w+\s+\w+\s*;/g);
            let shaderData = {shader: filename, uniforms: []}
            
            if (uniforms) {
                uniforms.forEach((uniform) => {
                    const [uniformName, basicType, uniformElements] = getUniformInfo(uniform);
                    let data = {
                        name: uniformName,
                        type: basicType,
                        elements: uniformElements,
                    };
                    shaderData.uniforms.push(data);
                });
                // Write uniform info to json/{shaderName}.json
                fs.writeFileSync(`json/${filename}.json`, JSON.stringify(shaderData, null, 4));
            }
        }
    });

    
}

// Extract uniform info
function getUniformInfo(uniform) {
    const regex = /uniform\s+([\w\s]+)\s+(\w+)\s*;/;
    const matches = uniform.match(regex);

    if (matches && matches.length >= 3) {
        const uniformName = matches[2].trim();
        const uniformType = matches[1].trim();
        const [basicType, uniformElements] = getTypeAndElements(uniformType);

        return [uniformName, basicType, uniformElements];
    }

    return ['', '', ''];
}

// Extracts the type and number of elements from a uniform
function getTypeAndElements(uniformType) {
    const typeWithElements = {
        vec2: ['float', 2],
        vec3: ['float', 3],
        vec4: ['float', 4],

        ivec2: ['int', 2],
        ivec3: ['int', 3],
        ivec4: ['int', 4],

        uvec2: ['uint', 2],
        uvec3: ['uint', 3],
        uvec4: ['uint', 4],

        bvec2: ['bool', 2],
        bvec3: ['bool', 3],
        bvec4: ['bool', 4],

        mat2: ['float', 4],
        mat3: ['float', 9],
        mat4: ['float', 16],

        float: ['float', 1],
        int: ['int', 1],
        uint: ['uint', 1],
        bool: ['bool', 1],
    };
    return typeWithElements[uniformType];
}

uniformCrawler('shaders/');
