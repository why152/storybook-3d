#version 300 es
precision highp float;
in vec2 vUv;
in float vSlope;
in float vHeight;
in float vU;
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform float uProgress;
out vec4 color;
const float PI=3.14159265359;
void main(){
  // Back of the turning right leaf is next chapter's LEFT page.
  // It must read correctly after the sheet lands on the left.
  vec2 uv=gl_FrontFacing ? vec2(vUv.x,1.0-vUv.y) :
                           vec2(1.0-vUv.x,1.0-vUv.y);
  vec4 illustration=gl_FrontFacing?texture(uFront,uv):texture(uBack,uv);
  float phase=sin(PI*clamp(uProgress,0.0,1.0));
  float shade=clamp(.94-.35*phase*pow(vU,2.2)+.16*vSlope+.10*vHeight,.54,1.20);
  float spine=.90+.10*smoothstep(0.0,.16,vU);
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  color=vec4(clamp(illustration.rgb*shade*spine+(grain-.5)*.016,0.0,1.0),1.0);
}
