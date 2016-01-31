#version 430 core

uniform sampler2D ColorBuffer;
uniform sampler2D NormalBuffer;
uniform sampler2D DepthBuffer;

uniform mat4 ScreenToWorld;

const float PI = 3.14159265359;
const float DEG2RAD = 2 * PI / 360.0;

struct SpotLight
{
	vec3 Position;
	float Angle;
	vec3 Direction;
	float PenumbraAngle;
	vec3 Color;
	float Intensity;
};

layout(location = 0, index = 0) out vec4 Color;

layout(std430, binding = 2) buffer spotlights
{
	int count;
	SpotLight Lights[];
} SpotLights;

in block
{
    vec2 Texcoord;
} In;

void main(void)
{
    // Read gbuffer values
    vec4 colorBuffer = texture(ColorBuffer, In.Texcoord).rgba;
    vec4 normalBuffer = texture(NormalBuffer, In.Texcoord).rgba;
    float depth = texture(DepthBuffer, In.Texcoord).r;

    // Unpack values stored in the gbuffer
    vec3 diffuseColor = colorBuffer.rgb;
    vec3 specularColor = colorBuffer.aaa;
    float specularPower = normalBuffer.a;
    vec3 n = normalBuffer.rgb;

    // Convert texture coordinates into screen space coordinates
    vec2 xy = In.Texcoord * 2.0 -1.0;
    // Convert depth to -1,1 range and multiply the point by ScreenToWorld matrix
    vec4 wP = ScreenToWorld * vec4(xy, depth * 2.0 -1.0, 1.0);
    // Divide by w
    vec3 p = vec3(wP.xyz / wP.w);
    vec3 v = normalize(-p);

    vec3 outColor = vec3(0);

		for (int i = 0; i < SpotLights.count; ++i) {
				vec3 l = normalize(SpotLights.Lights[i].Position - p);
				float a = cos(SpotLights.Lights[i].Angle * DEG2RAD);
				float pa = cos(SpotLights.Lights[i].PenumbraAngle * DEG2RAD);
				float ndotl =  max(dot(n, l), 0.0);
				float ldotd =  dot(-l, normalize(SpotLights.Lights[i].Direction));
				vec3 h = normalize(l+v);
				float ndoth = max(dot(n, h), 0.0);
				float fallof = clamp(pow( (ldotd  - a) /  (a-pa), 4), 0.0, 1.0);
				float d = distance(SpotLights.Lights[i].Position, p);
				float att = 1.f / (d*d);
				outColor += att * fallof * SpotLights.Lights[i].Color * SpotLights.Lights[i].Intensity * (diffuseColor * ndotl + specularColor * pow(ndoth, specularPower));
		}

    Color = vec4(outColor, 1.0);
}
