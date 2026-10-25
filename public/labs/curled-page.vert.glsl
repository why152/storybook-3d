#version 300 es
precision highp float;
in vec2 aUv;
uniform float uProgress;
uniform float uCurl;
uniform float uProfile; // 0 = smooth bow, 1 = cylindrical roll
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
  // Trial A: bending the sheet out of its former flat plane.
  float archBow=uCurl*.92*bendWindow*curvature*vertical;
  float archSlope=uCurl*.92*bendWindow*
    (1.2*pow(max(u,.00001),.2)-.704*pow(max(u,.00001),1.2))*vertical;

  // Trial B: roll into a short cylinder. This conserves paper arc length:
  // x = sin(k u)/k, z = (1-cos(k u))/k. At k -> 0 this tends to flat paper.
  float k=max(.0001,uCurl*2.35*bendWindow);
  float rollX=sin(k*u)/k;
  float rollZ=(1.0-cos(k*u))/k*vertical;
  float rollSlope=sin(k*u)*vertical;
  float sheetX=mix(u,rollX,uProfile);
  float sheetZ=mix(archBow,rollZ,uProfile);
  float slope=mix(archSlope,rollSlope,uProfile);
  vec3 p=vec3(sheetX,1.0-2.0*aUv.y,sheetZ);
  vec3 bent=vec3(p.x*cos(theta)-p.z*sin(theta),
                 p.y,
                 p.x*sin(theta)+p.z*cos(theta));
  float perspective=1.0-.085*bent.z;
  gl_Position=vec4(bent.xy,bent.z*.12,perspective);
  vUv=aUv;
  vSlope=slope*bendWindow;
  vHeight=bent.z;
  vU=u;
}
