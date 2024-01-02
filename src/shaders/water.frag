#version 300 es
precision highp float;

in vec2 v_texcoord;
in float v_tick;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
	// 'Scroll' texcoords
	vec2 scroll1 = v_texcoord + vec2(v_tick, v_tick * 4.0);
	vec2 scroll2 = v_texcoord + vec2(-v_tick + 0.5, v_tick * 4.0 + 0.5);

    // Textures
	vec3 tex1 = texture(u_texture, scroll1).rgb;
	vec3 tex2 = texture(u_texture, scroll2).rgb;

	outColor = vec4(tex1 * tex2, 0.5);
}