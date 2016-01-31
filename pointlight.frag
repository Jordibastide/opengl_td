#version 430 core

uniform sampler2D ColorBuffer;
uniform sampler2D NormalBuffer;
uniform sampler2D DepthBuffer;

uniform mat4 ScreenToWorld;

struct PointLight
{
	vec3 Position;
	vec3 Color;
	float Intensity;
  float BoundingRadius;
};

layout(location = 0, index = 0) out vec4 Color;

layout(std430, binding = 0) buffer pointlights
{
	int count;
	PointLight Lights[];
} PointLights;

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

    vec3 outColor = vec3(0.f);

    for (int i = 0; i < PointLights.count; ++i) {
        float d = distance(PointLights.Lights[i].Position, p);

        if (d < PointLights.Lights[i].BoundingRadius)
        {
            vec3 l = normalize(PointLights.Lights[i].Position - p);
          	float ndotl = max(dot(n, l), 0.0);
          	vec3 h = normalize(l + v);
          	float ndoth = max(dot(n, h), 0.0);
          	float attenuation = 1.0 / (d * d);

            outColor += attenuation * PointLights.Lights[i].Color * PointLights.Lights[i].Intensity * (diffuseColor * ndotl + specularColor * pow(ndoth, specularPower));
        }
    }

    Color = vec4(outColor, 1.0);
}
