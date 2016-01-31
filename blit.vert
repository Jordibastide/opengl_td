#version 430 core

#define POSITION 0

layout(location = POSITION) in vec2 Position;

out block
{
    vec2 Texcoord;
} Out;

void main()
{
    vec2 p = vec2(Position);
    Out.Texcoord = Position * 0.5 + 0.5;
    gl_Position = vec4(Position.xy, 0.0, 1.0);
}
