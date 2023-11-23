#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_color;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec3 u_lightColor;
uniform vec3 u_ambientLight;
uniform float u_specular_power;
uniform vec3 u_specularColor;

out vec4 outColor;

void main() {
	vec3 normal = normalize(v_normal);
	vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
	vec3 lightIntensity = 
		
		// Diffuse lighting
		u_lightColor * v_color * max(dot(normal, surfaceToLightDirection), 0.0) 
		
		// Specular lighting
		+ u_specularColor * pow(
			max(
				dot(
					reflect(-surfaceToLightDirection, normal),
					normalize(v_surfaceToView)
				),
				0.0
			),
			u_specular_power
		);

	outColor = vec4(lightIntensity + u_ambientLight * v_color, 1.0);
}