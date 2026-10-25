#version 300 es
precision highp float;
in vec2 aUv;
uniform float uProgress;
uniform float uCurl;
out vec2 vUv;
out float vSlope;
out float vHeight;
out float vU;
const float PI=3.14159265359;
void main(){
  // The book spine is (0,0) in clip space; a sheet is half of a spread.
  float u=aUv.x;
  float theta=PI*clamp(uProgress,0.0,1.0);
  float bendWindow=sin(theta);
  // Flexible paper arches during the turn; perfectly flat at rest.
  float curvature=pow(u,1.2)*(1.0-.32*u);
  float vertical=.84+.16*cos((aUv.y-.5)*PI);
  float bow=uCurl*.92*bendWindow*curvature*vertical;
  float derivative=uCurl*.92*bendWindow*
    (1.2*pow(max(u,.00001),.2)-.704*pow(max(u,.00001),1.2))*vertical;
  vec3 p=vec3(u,1.0-2.0*aUv.y,bow);
  vec3 bent=vec3(p.x*cos(theta)-p.z*sin(theta),
                 p.y,
                 p.x*sin(theta)+p.z*cos(theta));
  float perspective=1.0-.085*bent.z;
  gl_Position=vec4(bent.xy,bent.z*.12,perspective);
  vUv=aUv;
  vSlope=derivative*bendWindow;
  vHeight=bent.z;
  vU=u;
}
