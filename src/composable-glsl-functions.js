// to add: ripple: https://www.shadertoy.com/view/4djGzz
// mask
// convolution
// basic sdf shapes
// repeat
// iq color palletes

module.exports = {

  _noise: {
    type: 'util',
    glsl: `
    //	Simplex 3D Noise
    //	by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float _noise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}
    `
  },
  noise: {
    type: 'src',
    inputs: [
      {
        type: 'float',
        name: 'scale',
        default: 10
      },
      {
        type: 'float',
        name: 'offset',
        default: 0.1
      }
    ],
    glsl: `vec4 noise(vec2 st, float scale, float offset){
      return vec4(vec3(_noise(vec3(st*scale, offset*time))), 1.0);
    }`
  },
  voronoi: {
    type: 'src',
    inputs: [
      {
        type: 'float',
        name: 'scale',
        default: 5
      },
      {
        type: 'float',
        name: 'speed',
        default: 0.3
      },
      {
        type: 'float',
        name: 'blending',
        default: 0.3
      }
    ],
    notes: 'from https://thebookofshaders.com/edit.php#12/vorono-01.frag, https://www.shadertoy.com/view/ldB3zc',
    glsl: `vec4 voronoi(vec2 st, float scale, float speed, float blending) {
      vec3 color = vec3(.0);

   // Scale
   st *= scale;

   // Tile the space
   vec2 i_st = floor(st);
   vec2 f_st = fract(st);

   float m_dist = 10.;  // minimun distance
   vec2 m_point;        // minimum point

   for (int j=-1; j<=1; j++ ) {
       for (int i=-1; i<=1; i++ ) {
           vec2 neighbor = vec2(float(i),float(j));
           vec2 p = i_st + neighbor;
           vec2 point = fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
           point = 0.5 + 0.5*sin(time*speed + 6.2831*point);
           vec2 diff = neighbor + point - f_st;
           float dist = length(diff);

           if( dist < m_dist ) {
               m_dist = dist;
               m_point = point;
           }
       }
   }

   // Assign a color using the closest point position
   color += dot(m_point,vec2(.3,.6));
 color *= 1.0 - blending*m_dist;
   return vec4(color, 1.0);
    }`
  },
  osc: {
    type: 'src',
    inputs: [
      {
        name: 'frequency',
        type: 'float',
        default: 60.0
      },
      {
        name: 'sync',
        type: 'float',
        default: 0.1
      },
      {
        name: 'offset',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 osc(vec2 _st, float freq, float sync, float offset){
            vec2 st = _st;
            float r = sin((st.x-offset/freq+time*sync)*freq)*0.5  + 0.5;
            float g = sin((st.x+time*sync)*freq)*0.5 + 0.5;
            float b = sin((st.x+offset/freq+time*sync)*freq)*0.5  + 0.5;
            return vec4(r, g, b, 1.0);
          }`
  },
  shape: {
    type: 'src',
    inputs: [
      {
        name: 'sides',
        type: 'float',
        default: 3.0
      },
      {
        name: 'radius',
        type: 'float',
        default: 0.3
      },
      {
        name: 'smoothing',
        type: 'float',
        default: 0.01
      }
    ],
    glsl: `vec4 shape(vec2 _st, float sides, float radius, float smoothing){
      vec2 st = _st * 2. - 1.;
      // Angle and radius from the current pixel
      float a = atan(st.x,st.y)+3.1416;
      float r = (2.*3.1416)/sides;
      float d = cos(floor(.5+a/r)*r-a)*length(st);
      return vec4(vec3(1.0-smoothstep(radius,radius + smoothing,d)), 1.0);
    }`
  },
  gradient: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 gradient(vec2 _st, float speed) {
      return vec4(_st, sin(time*speed), 1.0);
    }
    `
  },
  src: {
    type: 'src',
    inputs: [
      {
        name: 'tex',
        type: 'texture'
      }
    ],
    glsl: `vec4 src(vec2 _st, sampler2D _tex){
    //  vec2 uv = gl_FragCoord.xy/vec2(1280., 720.);
      return texture2D(_tex, fract(_st));
    }`
  },
  solid: {
    type: 'src',
    inputs: [
      {
        name: 'r',
        type: 'float',
        default: 0.0
      },
      {
        name: 'g',
        type: 'float',
        default: 0.0
      },
      {
        name: 'b',
        type: 'float',
        default: 0.0
      },
      {
        name: 'a',
        type: 'float',
        default: 1.0
      }
    ],
    notes: '',
    glsl: `vec4 solid(vec2 uv, float _r, float _g, float _b, float _a){
      return vec4(_r, _g, _b, _a);
    }`
  },
  rotate: {
    type: 'coord',
    inputs: [
      {
        name: 'angle',
        type: 'float',
        default: 10.0
      }, {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 rotate(vec2 st, float _angle, float speed){
              vec2 xy = st - vec2(0.5);
              float angle = _angle + speed *time;
              xy = mat2(cos(angle),-sin(angle), sin(angle),cos(angle))*xy;
              xy += 0.5;
              return xy;
          }`
  },
  scale: {
    type: 'coord',
    inputs: [
      {
        name: 'amount',
        type: 'float',
        default: 1.5
      },
      {
        name: 'xMult',
        type: 'float',
        default: 1.0
      },
      {
        name: 'yMult',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec2 scale(vec2 st, float amount, float xMult, float yMult){
      vec2 xy = st - vec2(0.5);
      xy*=(1.0/vec2(amount*xMult, amount*yMult));
      xy+=vec2(0.5);
      return xy;
    }
    `
  },
  pixelate: {
    type: 'coord',
    inputs: [
      {
        name: 'pixelX',
        type: 'float',
        default: 20
      }, {
        name: 'pixelY',
        type: 'float',
        default: 20
      }
    ],
    glsl: `vec2 pixelate(vec2 st, float pixelX, float pixelY){
      vec2 xy = vec2(pixelX, pixelY);
      return (floor(st * xy) + 0.5)/xy;
    }`
  },
  posterize: {
    type: 'color',
    inputs: [
      {
        name: 'bins',
        type: 'float',
        default: 3.0
      },
      {
        name: 'gamma',
        type: 'float',
        default: 0.6
      }
    ],
    glsl: `vec4 posterize(vec4 c, float bins, float gamma){
      vec4 c2 = pow(c, vec4(gamma));
      c2 *= vec4(bins);
      c2 = floor(c2);
      c2/= vec4(bins);
      c2 = pow(c2, vec4(1.0/gamma));
      return vec4(c2.xyz, c.a);
    }`
  },
  shift: {
    type: 'color',
    inputs: [
      {
        name: 'r',
        type: 'float',
        default: 0.5
      },
      {
        name: 'g',
        type: 'float',
        default: 0.0
      },
      {
        name: 'b',
        type: 'float',
        default: 0.0
      },
      {
        name: 'a',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 shift(vec4 c, float r, float g, float b, float a){
      vec4 c2 = vec4(c);
      c2.r = fract(c2.r + r);
      c2.g = fract(c2.g + g);
      c2.b = fract(c2.b + b);
      c2.a = fract(c2.a + a);
      return vec4(c2.rgba);
    }
    `
  },
  intensity: {
    type: 'util',
    glsl: `float intensity( in vec2 c ) {
      return sqrt((c.x*c.x)+(c.y*c.y));
    }
    `
  },

  bruce: {
    type: 'coord',
    inputs: [
      {
        name: 'stepx',
        type: 'float',
        default: 0.0
      }, {
        name: 'stepy',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 bruce(vec2 st, float stepx, float stepy){
      return vec2(intensity(st + vec2(0.0,stepy)), intensity(st + vec2(stepx,0.0)));
    }`
  },
  repeat: {
    type: 'coord',
    inputs: [
      {
        name: 'repeatX',
        type: 'float',
        default: 3.0
      },
      {
        name: 'repeatY',
        type: 'float',
        default: 3.0
      },
      {
        name: 'offsetX',
        type: 'float',
        default: 0.0
      },
      {
        name: 'offsetY',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 repeat(vec2 _st, float repeatX, float repeatY, float offsetX, float offsetY){
        vec2 st = _st * vec2(repeatX, repeatY);
        st.x += step(1., mod(st.y,2.0)) * offsetX;
        st.y += step(1., mod(st.x,2.0)) * offsetY;
        return fract(st);
    }`
  },
  modulateRepeat: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'repeatX',
        type: 'float',
        default: 3.0
      },
      {
        name: 'repeatY',
        type: 'float',
        default: 3.0
      },
      {
        name: 'offsetX',
        type: 'float',
        default: 0.5
      },
      {
        name: 'offsetY',
        type: 'float',
        default: 0.5
      }
    ],
    glsl: `vec2 modulateRepeat(vec2 _st, vec4 c1, float repeatX, float repeatY, float offsetX, float offsetY){
        vec2 st = _st * vec2(repeatX, repeatY);
        st.x += step(1., mod(st.y,2.0)) + c1.r * offsetX;
        st.y += step(1., mod(st.x,2.0)) + c1.g * offsetY;
        return fract(st);
    }`
  },
  repeatX: {
    type: 'coord',
    inputs: [
      {
        name: 'reps',
        type: 'float',
        default: 3.0
      }, {
        name: 'offset',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 repeatX(vec2 _st, float reps, float offset){
      vec2 st = _st * vec2(reps, 1.0);
    //  float f =  mod(_st.y,2.0);

      st.y += step(1., mod(st.x,2.0))* offset;
      return fract(st);
    }`
  },
  modulateRepeatX: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'reps',
        type: 'float',
        default: 3.0
      },
      {
        name: 'offset',
        type: 'float',
        default: 0.5
      }
    ],
    glsl: `vec2 modulateRepeatX(vec2 _st, vec4 c1, float reps, float offset){
      vec2 st = _st * vec2(reps, 1.0);
    //  float f =  mod(_st.y,2.0);
      st.y += step(1., mod(st.x,2.0)) + c1.r * offset;

      return fract(st);
    }`
  },
  repeatY: {
    type: 'coord',
    inputs: [
      {
        name: 'reps',
        type: 'float',
        default: 3.0
      }, {
        name: 'offset',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 repeatY(vec2 _st, float reps, float offset){
      vec2 st = _st * vec2(1.0, reps);
    //  float f =  mod(_st.y,2.0);
      st.x += step(1., mod(st.y,2.0))* offset;
      return fract(st);
    }`
  },
  modulateRepeatY: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'reps',
        type: 'float',
        default: 3.0
      },
      {
        name: 'offset',
        type: 'float',
        default: 0.5
      }
    ],
    glsl: `vec2 modulateRepeatY(vec2 _st, vec4 c1, float reps, float offset){
      vec2 st = _st * vec2(reps, 1.0);
    //  float f =  mod(_st.y,2.0);
      st.x += step(1., mod(st.y,2.0)) + c1.r * offset;
      return fract(st);
    }`
  },
  kaleid: {
    type: 'coord',
    inputs: [
      {
        name: 'nSides',
        type: 'float',
        default: 4.0
      }
    ],
    glsl: `vec2 kaleid(vec2 st, float nSides){
      st -= 0.5;
      float r = length(st);
      float a = atan(st.y, st.x);
      float pi = 2.*3.1416;
      a = mod(a,pi/nSides);
      a = abs(a-pi/nSides/2.);
      return r*vec2(cos(a), sin(a));
    }`
  },
  modulateKaleid: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'nSides',
        type: 'float',
        default: 4.0
      }
    ],
    glsl: `vec2 modulateKaleid(vec2 st, vec4 c1, float nSides){
      st -= 0.5;
      float r = length(st);
      float a = atan(st.y, st.x);
      float pi = 2.*3.1416;
      a = mod(a,pi/nSides);
      a = abs(a-pi/nSides/2.);
      return (c1.r+r)*vec2(cos(a), sin(a));
    }`
  },
  scrollX: {
    type: 'coord',
    inputs: [
      {
        name: 'scrollX',
        type: 'float',
        default: 0.5
      },
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 scrollX(vec2 st, float amount, float speed){
      st.x += amount + time*speed;
      return fract(st);
    }`
  },
  modulateScrollX: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'scrollX',
        type: 'float',
        default: 0.5
      },
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 modulateScrollX(vec2 st, vec4 c1, float amount, float speed){
      st.x += c1.r*amount + time*speed;
      return fract(st);
    }`
  },
  scrollY: {
    type: 'coord',
    inputs: [
      {
        name: 'scrollY',
        type: 'float',
        default: 0.5
      },
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 scrollY(vec2 st, float amount, float speed){
      st.y += amount + time*speed;
      return fract(st);
    }`
  },
  modulateScrollY: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'scrollY',
        type: 'float',
        default: 0.5
      },
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 modulateScrollY(vec2 st, vec4 c1, float amount, float speed){
      st.y += c1.r*amount + time*speed;
      return fract(st);
    }`
  },
  add: {
    type: 'combine',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'amount',
        type: 'float',
        default: 0.5
      }
    ],
    glsl: `vec4 add(vec4 c0, vec4 c1, float amount){
            return (c0+c1)*amount + c0*(1.0-amount);
          }`
  },
  layer: {
    type: 'combine',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      }
    ],
    glsl: `vec4 layer(vec4 c0, vec4 c1){
        return vec4(mix(c0.rgb, c1.rgb, c1.a), c0.a+c1.a);
    }
    `
  },
  blend: {
    type: 'combine',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'amount',
        type: 'float',
        default: 0.5
      }
    ],
    glsl: `vec4 blend(vec4 c0, vec4 c1, float amount){
      return c0*(1.0-amount)+c1*amount;
    }`
  },
  mult: {
    type: 'combine',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'amount',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 mult(vec4 c0, vec4 c1, float amount){
      return c0*(1.0-amount)+(c0*c1)*amount;
    }`
  },

  diff: {
    type: 'combine',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      }
    ],
    glsl: `vec4 diff(vec4 c0, vec4 c1){
      return vec4(abs(c0.rgb-c1.rgb), max(c0.a, c1.a));
    }
    `
  },

  modulate: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'amount',
        type: 'float',
        default: 0.1
      }
    ],
    glsl: `vec2 modulate(vec2 st, vec4 c1, float amount){
          //  return fract(st+(c1.xy-0.5)*amount);
              return st + c1.xy*amount;
          }`
  },
  modulateScale: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'multiple',
        type: 'float',
        default: 1.0
      },
      {
        name: 'offset',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec2 modulateScale(vec2 st, vec4 c1, float multiple, float offset){
      vec2 xy = st - vec2(0.5);
      xy*=(1.0/vec2(offset + multiple*c1.r, offset + multiple*c1.g));
      xy+=vec2(0.5);
      return xy;
    }`
  },
  modulatePixelate: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'multiple',
        type: 'float',
        default: 10.0
      },
      {
        name: 'offset',
        type: 'float',
        default: 3.0
      }
    ],
    glsl: `vec2 modulatePixelate(vec2 st, vec4 c1, float multiple, float offset){
      vec2 xy = vec2(offset + c1.x*multiple, offset + c1.y*multiple);
      return (floor(st * xy) + 0.5)/xy;
    }`
  },
  modulateRotate: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'multiple',
        type: 'float',
        default: 1.0
      },
      {
        name: 'offset',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec2 modulateRotate(vec2 st, vec4 c1, float multiple, float offset){
        vec2 xy = st - vec2(0.5);
        float angle = offset + c1.x * multiple;
        xy = mat2(cos(angle),-sin(angle), sin(angle),cos(angle))*xy;
        xy += 0.5;
        return xy;
    }`
  },
  modulateHue: {
    type: 'combineCoord',
    notes: 'changes coordinates based on hue of second input. Based on: https://www.shadertoy.com/view/XtcSWM',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'amount',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec2 modulateHue(vec2 st, vec4 c1, float amount){
      return st + (vec2(c1.g - c1.r, c1.b - c1.g) * amount * 1.0/resolution.xy);
    }`
  },
  invert: {
    type: 'color',
    inputs: [
      {
        name: 'amount',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 invert(vec4 c0, float amount){
      return vec4((1.0-c0.rgb)*amount + c0.rgb*(1.0-amount), c0.a);
    }`
  },
  contrast: {
    type: 'color',
    inputs: [
      {
        name: 'amount',
        type: 'float',
        default: 1.6
      }
    ],
    glsl: `vec4 contrast(vec4 c0, float amount) {
      vec4 c = (c0-vec4(0.5))*vec4(amount) + vec4(0.5);
      return vec4(c.rgb, c0.a);
    }
    `
  },
  brightness: {
    type: 'color',
    inputs: [
      {
        name: 'amount',
        type: 'float',
        default: 0.4
      }
    ],
    glsl: `vec4 brightness(vec4 c0, float amount){
      return vec4(c0.rgb + vec3(amount), c0.a);
    }
    `
  },
  luminance: {
    type: 'util',
    glsl: `float luminance(vec3 rgb){
      const vec3 W = vec3(0.2125, 0.7154, 0.0721);
      return dot(rgb, W);
    }`
  },
  mask: {
    type: 'combine',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      }
    ],
    glsl: `vec4 mask(vec4 c0, vec4 c1){
      float a = luminance(c1.rgb);
      return vec4(c0.rgb*a, a);
    }`
  },
  luma: {
    type: 'color',
    inputs: [
      {
        name: 'threshold',
        type: 'float',
        default: 0.5
      },
      {
        name: 'tolerance',
        type: 'float',
        default: 0.1
      }
    ],
    glsl: `vec4 luma(vec4 c0, float threshold, float tolerance){
      float a = smoothstep(threshold-tolerance, threshold+tolerance, luminance(c0.rgb));
      return vec4(c0.rgb*a, a);
    }`
  },
  thresh: {
    type: 'color',
    inputs: [
      {
        name: 'threshold',
        type: 'float',
        default: 0.5
      }, {
        name: 'tolerance',
        type: 'float',
        default: 0.04
      }
    ],
    glsl: `vec4 thresh(vec4 c0, float threshold, float tolerance){
      return vec4(vec3(smoothstep(threshold-tolerance, threshold+tolerance, luminance(c0.rgb))), c0.a);
    }`
  },
  color: {
    type: 'color',
    inputs: [
      {
        name: 'r',
        type: 'float',
        default: 1.0
      },
      {
        name: 'g',
        type: 'float',
        default: 1.0
      },
      {
        name: 'b',
        type: 'float',
        default: 1.0
      }
    ],
    notes: 'https://www.youtube.com/watch?v=FpOEtm9aX0M',
    glsl: `vec4 color(vec4 c0, float _r, float _g, float _b){
      vec3 c = vec3(_r, _g, _b);
      vec3 pos = step(0.0, c); // detect whether negative

      // if > 0, return r * c0
      // if < 0 return (1.0-r) * c0
      return vec4(mix((1.0-c0.rgb)*abs(c), c*c0.rgb, pos), c0.a);
    }`
  },
  _rgbToHsv: {
    type: 'util',
    glsl: `vec3 _rgbToHsv(vec3 c){
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }`
  },
  _hsvToRgb: {
    type: 'util',
    glsl: `vec3 _hsvToRgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }`
  },
  saturate: {
    type: 'color',
    inputs: [
      {
        name: 'amount',
        type: 'float',
        default: 2.0
      }
    ],
    glsl: `vec4 saturate(vec4 c0, float amount){
      const vec3 W = vec3(0.2125, 0.7154, 0.0721);
      vec3 intensity = vec3(dot(c0.rgb, W));
      return vec4(mix(intensity, c0.rgb, amount), c0.a);
    }`
  },
  chromatic: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'offx',
        type: 'float',
        default: 3.0
      },
      {
        name: 'offy',
        type: 'float',
        default: 2.0
      }
    ],
    glsl: `
    vec2 chromatic(vec2 _st, vec4 c1, float offx, float offy){
      vec2 st = _st * vec2(offx, offy);
      return vec2( st.x * c1.r, st.y * c1.g);
    }`
  },
  sobel: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      },
      {
        name: 'multiple',
        type: 'float',
        default: 10.0
      },
      {
        name: 'offset',
        type: 'float',
        default: 3.0
      },
      {
        name: 'amount',
        type: 'float',
        default: 2.0
      }
    ],
    glsl: `
    vec2 sobel(vec2 st, vec4 c1, float multiple, float offset, float amount){
      // from https://www.shadertoy.com/view/MdK3Dc
      mat3 sobelX = mat3(-1.0, -2.0, -1.0,
                        0.0,  0.0, 0.0,
                        1.0,  2.0,  1.0);
      mat3 sobelY = mat3(-1.0,  0.0,  1.0,
                        -2.0,  0.0, 2.0,
                        -1.0,  0.0,  1.0);  
      vec3 col;
      float sumX = 0.0;	// x-axis change
      float sumY = 0.0;	// y-axis change
      
      for(int i = -1; i <= 1; i++)
      {
          for(int j = -1; j <= 1; j++)
          {
              // Convolve kernels with image
              sumX += length(1.0+c1.r+st.x) * float(sobelX[1+i][1+j]);
              sumY += length(1.0+c1.g+st.y) * float(sobelY[1+i][1+j]);
          }
      }    
      float g = abs(sumX) + abs(sumY);
      g = sqrt((sumX*sumX) + (sumY*sumY));
      if(g > 1.0)
          col = vec3(1.0,1.0,1.0);
      else
          col = col * 0.1;
      return vec2(col.x * c1.r, col.y * c1.g);
    }`
  },
  hue: {
    type: 'color',
    inputs: [
      {
        name: 'hue',
        type: 'float',
        default: 0.4
      }
    ],
    glsl: `vec4 hue(vec4 c0, float hue){
      vec3 c = _rgbToHsv(c0.rgb);
      c.r += hue;
    //  c.r = fract(c.r);
      return vec4(_hsvToRgb(c), c0.a);
    }`
  },
  colorama: {
    type: 'color',
    inputs: [
      {
        name: 'amount',
        type: 'float',
        default: 0.005
      }
    ],
    glsl: `vec4 colorama(vec4 c0, float amount){
      vec3 c = _rgbToHsv(c0.rgb);
      c += vec3(amount);
      c = _hsvToRgb(c);
      c = fract(c);
      return vec4(c, c0.a);
    }`
  },
  smoke: {
    type: 'src',
    inputs: [
      {
        name: 'zoom',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 smoke(vec2 _st, float zoom) {
      vec2 p = -1.0+2.0*_st;
      highp int z = int(zoom);
      float w = sin(time+6.5*sqrt(dot(p,p))*cos(p.x));
      float x = cos(atan(p.y,p.x)*float(z) + 1.8*w);
      return vec4(x,x,x,1.);
    }
    `
  },
  tunnel: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 tunnel(vec2 _st, float speed) {
      vec2 p = -1.0+2.0*_st;
      vec4 col;
      float x,y;
      x = atan(p.x,p.y);
      y = 1./length(p.xy);
      col.x = sin(x*5. + sin(time)/3.) * sin(y*5. + time);
      col.y = sin(x*5. - time + sin(y+time*3.));
      col.z = -col.x + col.y * sin(y*4.+time);
      col = clamp(col,0.,0.7);
      col.y = pow(col.y,.015);
      col.z = pow(col.z,.01);
  
      return col*length(p.xy);
    }
    `
  },
  colorgrid: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 colorgrid(vec2 _st, float speed) {
      float id = 0.5 + 0.5*cos(time + sin(dot(floor(_st*speed+0.5),vec2(113.1,17.81)))*43758.545);
      vec3  co = 0.5 + 0.5*cos(time + 3.5*id + vec3(0.0,1.57,3.14) );
      vec2  pa = smoothstep( 0.0, 0.2, id*(0.5 + 0.5*cos(6.2831*_st*speed)) );
      return vec4( co*pa.x*pa.y, 1.0 );
    }
    `
  },
  silexars: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 silexars(vec2 _st, float speed) {
      vec3 c;
      float l,z=time;
      for(int i=0;i<3;i++) {
        vec2 uv,p=_st;
        uv=p;
        p-=.5;
        z+=.07;
        l=length(p);
        uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z*2.));
        c[i]=.01/length(abs(mod(uv,1.)-.5));
      }
      return vec4(c/l,time);
    }
    `
  },
  dancing: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 dancing(vec2 _st, float speed) {
      vec2 p = -1.0+2.0*_st;
      float beat = 0.;
      float ct = time/2.0;
      if ((ct > 8.0 && ct < 33.5)
      || (ct > 38.0 && ct < 88.5)
      || (ct > 93.0 && ct < 194.5))
        beat = pow(sin(ct*3.1416*3.78+1.9)*0.5+0.5,15.0)*0.1;
      
      for(float i=1.;i<40.;i++)
      {
        vec2 newp=p;
        newp.x+=0.5/i*cos(i*p.y+beat+time*cos(ct)*0.3/40.0+0.03*i)+10.0;
        newp.y+=0.5/i*cos(i*p.x+beat+time*ct*0.3/50.0+0.03*(i+10.))+15.0;
        p=newp;
      } 
      
      return vec4(0.5*sin(3.0*p.x)+0.5,0.5*sin(3.0*p.y)+0.5,sin(p.x+p.y),1.0);
      
    }
    `
  },
  rotx: {
    type: 'util',
    glsl: `vec3 rotx(vec3 p, float a) {
      float s = sin(a), c = cos(a);
      return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
    }`
  },
  roty: {
    type: 'util',
    glsl: `vec3 roty(vec3 p, float a) {
      float s = sin(a), c = cos(a);
      return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
    }`
  },
  rotz: {
    type: 'util',
    glsl: `vec3 rotz(vec3 p, float a) {
      float s = sin(a), c = cos(a);
      return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z);
    }`
  },
  bump: {
    type: 'util',
    glsl: `float bump(float x) {
      return abs(x) > 1.0 ? 0.0 : 1.0 - x * x;
    }`
  },
  rainbow: {
    type: 'src',
    inputs: [
      {
        name: 'volume',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 rainbow(vec2 _st, float volume) {
      // https://www.shadertoy.com/view/ldX3D8
      vec2 uv = _st;
      float c = 3.0;
      vec3 color = vec3(1.0);
      color.x = bump(c * (uv.x - 0.75));
      color.y = bump(c * (uv.x - 0.5));
      color.z = bump(c * (uv.x - 0.25));
      uv.y -= 0.5;
      float line = abs(0.01 / uv.y);   
      color *= line * (uv.x + volume * 1.5);
      return vec4(color, 1.0);
    }
    `
  },
  stars: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      },
      {
        name: 'red',
        type: 'float',
        default: 0.1
      },
      {
        name: 'green',
        type: 'float',
        default: 0.1
      }
    ],
    glsl: `vec4 stars(vec2 _st, float speed, float red, float green) {
      // https://www.shadertoy.com/view/lsf3z2
      vec2 p = -1.0 + 2.0 *_st;
      float M_PI = 3.141592653589793;
      float M_2PI = 6.283185307179586;
      float angle = atan(p.y, p.x);
      float radius = sqrt(p.x*p.x + p.y*p.y);
      highp int n = int(speed);
      float angle_offset = 5.1*sin(0.3*time);
      float k_amplitude = 0.9*cos(1.2*time);
      float radius2 = radius + pow(radius, 2.0)*k_amplitude*sin(float(n)*angle + angle_offset);
      float width = 0.05;
      float k_t = -0.04;
      
      
      float n_inv = 1.0 / float(n);
      vec3 color;
      float modulus = mod((radius2 + k_t*time) / width, 3.0);
      if (modulus < 1.0) {
        //color = vec3(0.5, 0.0, 0.8);
        color = vec3(red, 0.14, 0.3);
      } else if(modulus < 2.0) {
        color = vec3(0.0, 0.0, 0.1);
      } else {
        color = vec3(0.2, green, 0.0);
      }
      color /= 0.2 + pow(radius, 2.0);
      return vec4(color, 1.0);
    }
    `
  },
  hexler330: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 hexler330(vec2 _st, float speed) {
      vec2 uv = -1.0 + 2.0 *_st;
      float radius = length(uv);
	    float angle = atan(uv.y,uv.x);	
      float col = 1.5*sin(time + 13.0 * angle + uv.y * 20.);
      col += cos(.9 * uv.x * angle * 60.0 + radius * 5.0 -time * 2.);
      return vec4( (1.2 - radius) * col );
    }
    `
  },
  floxdots: {
    type: 'src',
    inputs: [
      {
        name: 'divs',
        type: 'float',
        default: 12.0
      }
    ],
    glsl: `vec4 floxdots(vec2 _st, float divs) {
      // https://www.shadertoy.com/view/MtlGz8
      vec2 div = vec2( divs, divs );
      vec2 uv = -1.0+2.0*_st;
      vec2 xy = div*uv;
      vec2 S;
      S.x = (xy.x + xy.y)*(xy.x - xy.y)*0.5;
      S.y = xy.x*xy.y;
      S.x -= time*3.0;
      vec2 sxy = sin(3.14159*S);
      float a = sxy.x * sxy.y;
      //a = 0.5*a + 0.5;
      float b = length(sxy)*0.7071;
      a = smoothstep( 0.85-b, 0.85+b, a );
      float c = sqrt( a );
      return vec4(c);
    }
    `
  },
  calcColor: {
    type: 'util',
    glsl: `vec3 calcColor(vec3 c) {
      return _rgbToHsv(vec3(c.x * 0.04 , 1., 1.));//+ time*0.0001
    }`
  },
  groundDist: {
    type: 'util',
    glsl: `float groundDist(vec3 c) {
      c.y += sin(c.z * 0.2 + c.x + time * 10.0) * 0.5;
      c.x = mod(c.x, 4.0) - 2.0;
      return length(c.yx);
    }`
  },
  dist: {
    type: 'util',
    glsl: `float dist(vec3 c) {
      float d = 3.402823466E+38;
      d = min(d, groundDist(c));
      return d;
    }`
  },
  dreadsmarch: {
    type: 'util',
    inputs: [
      {
        name: 'pos',
        type: 'vec3'
      },
      {
        name: 'dir',
        type: 'vec3'
      }
    ],
    glsl: `vec3 dreadsmarch(vec3 pos, vec3 dir) {
      vec3 color = vec3(0.0, 0.0, 0.0);
      for (int i = 0; i < 32; ++i)
      {
          float d = dist(pos);
          pos += dir * d * 0.9;
          color += max(vec3(0.0), 0.02 / d * calcColor(pos));
      }
      return color;
    }`
  },
  dreads: {
    type: 'src',
    inputs: [
      {
        name: 'iMouseX',
        type: 'float',
        default: 0.01
      },
      {
        name: 'iMouseY',
        type: 'float',
        default: 0.01
      },
      {
        name: 'iMouseZ',
        type: 'float',
        default: -10.0
      },
    ],
    glsl: `vec4 dreads(vec2 _st, float iMouseX, float iMouseY, float iMouseZ) {
      // https://www.shadertoy.com/view/4lGcz1
      vec3 ps = vec3( iMouseX, iMouseY, iMouseZ);
      vec2 p = -1.0 + 2.0 *_st;
      p.y = p.y - iMouseZ;
      vec3 dir = normalize(vec3(p, 1.0));
      vec3 color = vec3(0.0, 0.0, 0.0) * length(p.xy) * sin(time * 10.0);     
      color += dreadsmarch(ps, dir);
      return vec4(color, 1.0);
    }
    `
  },
  textri: {
    type: 'util',
    glsl: `vec3 textri(in vec2 p, in float idx) {
      float siz = resolution.x *.001;
      p*=1.31;
      vec2 bp = p;
      p.x *= 1.732;
      vec2 f = fract(p)-0.5;
      float d = abs(f.x-f.y);
      d = min(abs(f.x+f.y),d);
      
      float f1 = fract((p.y-0.25)*2.);
      d = min(d,abs(f1-0.5));
      d = 1.-smoothstep(0.,.1/(siz+.7),d);
      
      vec2 q = abs(bp);
      p = bp;
      d -= smoothstep(1.,1.3,(max(q.x*1.73205+p.y, -p.y*2.)));
      vec3 col = (sin(vec3(1.,1.5,5)*idx)+2.)*((1.-d)+0.25);
      col -= sin(p.x*10.+time*8.)*0.15-0.1;
      return col;
    }`
  },
  ico: {
    type: 'util',
    glsl: `vec3 ico(in vec3 p) {
      vec3 col = vec3(1);
      vec2 uv = vec2(0);
      //center band
      const float n1 = .7297;
      const float n2 = 1.0472;
      for (float i = 0.;i<5.;i++)
      {
          if(mod(i,2.)==0.)
          {
              p = rotz(p,n1);
            p = rotx(p,n2);
          }
      else
          {
              p = rotz(p,n1);
            p = rotx(p,-n2);
          }
          uv = vec2(p.z,p.y)/((p.x));
        col = min(textri(uv,i+1.),col);
      }
      p = roty(p,1.048);
      p = rotz(p,.8416);
      p = rotx(p,.7772);
      //top caps
      for (float i = 0.;i<5.;i++)
      {
          p = rotz(p,n1);
          p = rotx(p,n2);
        uv = vec2(p.z,p.y)/((p.x));
        col = min(textri(uv,i+6.),col);
      }
      return 1.-col;
    }`
  },
  iSphere2: {
    type: 'src',
    glsl: `vec2 iSphere2(in vec3 ro, in vec3 rd) {
      vec3 oc = ro;
      float b = dot(oc, rd);
      float c = dot(oc,oc) - 1.;
      float h = b*b - c;
      if(h <0.0) return vec2(-1.);
      else return vec2((-b - sqrt(h)), (-b + sqrt(h)));
    }
    `
  },
  icosphere: {
    type: 'src',
    inputs: [
      {
        name: 'mousex',
        type: 'float',
        default: 0.0
      },
      {
        name: 'mousey',
        type: 'float',
        default: 0.0
      },
      {
        name: 'zoom',
        type: 'float',
        default: 0.1
      }
    ],
    glsl: `vec4 icosphere(vec2 _st, float zoom, float mousex, float mousey) {
      vec2 p = (-1.0 + 2.0 *_st) * (-zoom+1.40);
      p.x*=resolution.x/resolution.y;
      vec3 ro = vec3(mousex/resolution.x,mousey/resolution.y,3.6+sin(time/10.));
      vec3 rd = normalize(vec3(p,-1.4));      
      vec2 t = iSphere2(ro,rd);
      vec3 pos = ro+rd*t.x;
      vec3 pos2 = ro+rd*t.y;       
      vec3 col2  = max(ico(pos2)*0.6,ico(pos)*2.);
      return vec4(col2, 1.0);
    }
    `
  },
  map1: {
    type: 'util',
    glsl: `float map1(in vec3 p) {
      // add repetition
      vec3 q = mod( p + 2.0, 4.0) - 2.0;
      //sphere
      // no repeat float d1 = length( p ) - 1.0;
      float d1 = length( q ) - 1.0;
      // deform the sphere
      d1 += 0.1 * sin( 10.0 * p.x + time );
      //d1 += 0.1 * sin( 10.0 * p.x ) * sin( 10.0 * p.y + time ) * sin( 10.0 * p.z );
      // add a floor (plane)
      float d2 = p.y + 1.0;
      // no blending
      //return min( d1, d2 );	
      // blending
      float k = 0.20;
      float h = clamp( 0.5 + 0.5 * ( d1 - d2 ) / k, 0.0, 1.0 );
      return mix( d1, d2, h ) - k*h*(1.0-h);	
    }
    `
  },
  map2: {
    type: 'util',
    glsl: `float map2(in vec3 p) {
      vec3 q = p*2.+time;
      return length(p+vec3(sin(time*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;	
    }
    `
  },
  calcNormal: {
    type: 'util',
    glsl: `vec3 calcNormal( in vec3 pos ) {
      vec3 e = vec3(0.0001,0.0,0.0);
      vec3 nor;
      // compute gradient
      nor.x = map1(pos+e.xyy) - map1(pos-e.xyy);
      nor.y = map1(pos+e.yxy) - map1(pos-e.yxy);
      nor.z = map1(pos+e.yyx) - map1(pos-e.yyx);
      return normalize(nor);
    }
    `
  },
  blobs: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 blobs(vec2 _st, float speed) {
      // https://www.shadertoy.com/view/4slSR4
      vec2 p = -1.0 + 2.0 *_st;
      // fix aspect ratio
      p.x *= resolution.x/resolution.y;
      p.y = - p.y ;
      // ro is where the camera is, the ray comes from here
      vec3 ro = vec3( 0.0, 0.0, 2.0 );
      // rd is the ray direction, look down
      vec3 rd = normalize( vec3( p, - 1.0 ) );
      
      vec3 col = vec3( 0.0 );
      
      float tmax = 20.0;
      float h = 1.0;
      float t = 0.0;
    
      for( int i=0; i<100; i++ )
      {
        if ( h < 0.0001 || t>tmax ) break;
        h = map1( ro + t*rd );
        t += h;
      }
      vec3 lig = vec3( 0.5773 );
      if ( t < tmax )
      {
        // create position for normal
        vec3 pos = ro + t*rd;
        // normal
        vec3 nor = calcNormal( pos );
        // white : col = vec3( 1.0 );
        // light on x, y or z axis: col *= nor.y;
    
        col = vec3( 1.0, 0.8, 0.5 ) * clamp( dot( nor, lig ), 0.0, 1.0 );
        // add blue ambient light from top nor.y
        col += vec3( 0.2, 0.3, 0.199 ) * clamp( nor.y, 0.0, 1.0 );
        // add constant lighting to fill the bottom of the sphere
        col += 0.1;
        // fog
        col *= exp( -0.1 * t );
      }
      return vec4(col,1.0);
    }
    `
  },
  plas: {
    type: 'util',
    glsl: `vec4 plas( in vec2 v, float fft ) {
      float c = sin( v.x * 1000.0 * fft) + cos(sin(time+v.y)*20.);
      return vec4(sin(c*0.2+cos(time)),c*0.15,cos(c*0.1+time/.4),1.0);
    }
    `
  },
  plasma: {
    type: 'src',
    inputs: [
      {
        name: 'fft',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 plasma(vec2 _st, float fft) {
      vec2 uv = -1.0 + 2.0 *_st;
      uv.x *= resolution.x/resolution.y;
      vec2 m;
      m.x = atan(uv.x/uv.y)/3.14;
      m.y = 1./length(uv)*.2;
      float d = m.y;
      float f = fft;
      m.x += sin(time)*0.1;
      m.y += time*0.25;
      vec4 t = plas(m*3.14, fft)/d;
      return vec4(f+t);
    }
    `
  },
  nawak: {
    type: 'combineCoord',
    inputs: [
      {
        name: 'color',
        type: 'vec4'
      }
    ],
    glsl: `vec2 nawak(vec2 st, vec4 c1){
      return vec2( (c1.r+c1.g+c1.b)/3.0 );
    }`
  },
  gainage: {
    type: 'src',
    inputs: [
      {
        name: 'brightness',
        type: 'float',
        default: 0.5
      }
    ],
    glsl: `vec4 gainage(vec2 _st, float brightness) {
    float x, y, xpos, ypos;
    float t = time * 10.0;
    vec3 c = vec3(0.0);
    xpos = _st.x;
    ypos = _st.y;
    x = xpos;
    for (float i = 0.0; i < 8.0; i += 1.0) {
        for(float j = 0.0; j < 2.0; j += 1.0){
            y = ypos
            + (0.30 * sin(x * 2.000 +( i * 1.5 + j) * 0.4 + t * 0.050)
               + 0.100 * cos(x * 6.350 + (i  + j) * 0.7 + t * 0.050 * j)
               + 0.024 * sin(x * 12.35 + ( i + j * 4.0 ) * 0.8 + t * 0.034 * (8.0 *  j))
               + 0.5);
            c += vec3(1.0 - pow(clamp(abs(1.0 - y) * 5.0, 0.0,1.0), 0.25));
        }
    }
    c *= mix(
             mix( vec3(1.4, 0.8, 0.4), vec3(0.5, 0.9, 1.3), xpos)
             , mix(vec3(0.9, 1.4, 0.4), vec3(1.8, 0.4, 0.3), xpos)
             ,(sin(t * 0.02) + 1.0) * 0.45
             ) * brightness;
    return  vec4(c, 1.0);
    }
    `
  },
  julia: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 julia(vec2 _st, float speed) {
      // https://www.shadertoy.com/view/MsXGzr
      vec2 uv = _st;
      vec2 cc = 1.1*vec2( 0.5*cos(0.1*time) - 0.25*cos(0.2*time), 
                            0.5*sin(0.1*time) - 0.25*sin(0.2*time) );
      vec4 dmin = vec4(1000.0);
      vec2 z = (-1.0 + 1.0*uv)*vec2(0.6,0.3);
      for( int i=0; i<16; i++ )
      {
          z = cc + vec2( z.x*z.x - z.y*z.y, 2.0*z.x*z.y );
      z += 0.15*sin(float(i));
      dmin=min(dmin, vec4(abs(0.0+z.y + 0.2*sin(z.x)), 
                abs(1.0+z.x + 0.5*sin(z.y)), 
                dot(z,z),
                  length( fract(z)-0.2) ) );
      }
      vec3 color = vec3( dmin.w );
      color = mix( color, vec3(0.80,0.40,0.20),     min(1.0,pow(dmin.x*0.25,0.20)) );
      color = mix( color, vec3(0.12,0.70,0.60),     min(1.0,pow(dmin.y*0.50,0.50)) );
      color = mix( color, vec3(0.90,0.40,0.20), 1.0-min(1.0,pow(dmin.z*1.00,0.15) ));
      color = 1.25*color*color;
      color *= 0.5 + 0.5*pow(4.0*uv.x*(1.0-uv.y)*uv.y*(1.0-uv.y),0.15);
      return vec4(color,1.0);
    }
    `
  },
  ovni: {
    type: 'src',
    inputs: [
      {
        name: 'fft',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 ovni(vec2 _st, float fft) {
      // https://www.shadertoy.com/view/MsBSzw
      vec2 p = -1.0 + 2.0 *_st;
      p.x *= resolution.x/resolution.y;
      vec3 c = vec3(0.0);
      vec2 uv = -1.0 + 2.0 *_st;
      float wave = fft;
    
        for(int i = 1; i<20; i++)
        {
            float t = 2.*3.14*float(i)/20.* (time*.9);
            float x = sin(t)*1.8*smoothstep( 0.0, 0.15, abs(wave - uv.y));
            float y = sin(.5*t) *smoothstep( 0.0, 0.15, abs(wave - uv.y));
            y*=.5;
            vec2 o = .4*vec2(x*cos(time*.5),y*sin(time*.3));
            float red = fract(t);
            float green = 1.-red;
            c+=0.016/(length(p-o))*vec3(red,green,sin(time));
        }
      return vec4(c,1.0);
    }
    `
  },
  neon: {
    type: 'src',
    inputs: [
    ],
    glsl: `vec4 neon(vec2 _st) {
      vec2 v = -1.0 + 2.0 *_st;
	    vec3 col = (vec3(fract(v.x + time*1.8),fract(-0.5*v.x+0.8*v.y + time*0.09),fract(-0.5*v.x-0.86*v.y + time*0.08))-0.5);
      col = 1.0-normalize(col*col);
      return vec4(col, 1.0);
    }
    `
  },
  ether: {
    type: 'src',
    inputs: [
      {
        name: 'zoom',
        type: 'float',
        default: 0.1
      }
    ],
    glsl: `vec4 ether(vec2 _st, float zoom) {
      // https://www.shadertoy.com/view/MsjSW3
      vec2 p = (-1.0 + 2.0 *_st) / (zoom+1.0);
      p.x *= resolution.x/resolution.y;
      vec3 cl = vec3(0.);
      float d = 2.5;
      for(int i=0; i<=5; i++)	{
        vec3 p = vec3(0,0,5.) + normalize(vec3(p, -1.))*d;
        float rz = map2(p);
		    float f =  clamp((rz - map2(p+.1))*0.5, -.1, 1. );
        vec3 l = vec3(0.1,0.3,.4) + vec3(5., 2.5, 3.)*f;
        cl = cl*l + (1.-smoothstep(0., 2.5, rz))*.7*l;
        d += min(rz, 1.);
      }
      return  vec4(cl, 1.);
    }
    `
  },
  elechash33: {
    type: 'util',
    glsl: `vec3 elechash33(vec3 p3)
    {
      p3 = fract(p3 * vec3(.1031,.11369,.13787));
        p3 += dot(p3, p3.yxz+19.19);
        return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
    }
    `
  },
  elecsimplex_noise: {
    type: 'util',
    glsl: `float elecsimplex_noise(vec3 p)
    {
        const float K1 = 0.333333333;
        const float K2 = 0.166666667;
        
        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
            
        vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        
        vec3 d1 = d0 - (i1 - 1.0 * K2);
        vec3 d2 = d0 - (i2 - 2.0 * K2);
        vec3 d3 = d0 - (1.0 - 3.0 * K2);
        
        vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
        vec4 n = h * h * h * h * vec4(dot(d0, elechash33(i)), dot(d1, elechash33(i + i1)), dot(d2, elechash33(i + i2)), dot(d3, elechash33(i + 1.0)));
        
        return dot(vec4(31.316), n);
    }
    `
  },
  elec: {
    type: 'src',
    inputs: [
      {
        name: 'lx',
        type: 'float',
        default: 0.15
      },
      {
        name: 'ly',
        type: 'float',
        default: 0.1
      },
      {
        name: 'lz',
        type: 'float',
        default: 0.02
      }
    ],
    glsl: `vec4 elec(vec2 _st, float lx, float ly, float lz) {
      vec2 uv = (-1.0 + 2.0 *_st);
      uv.x *= resolution.x/resolution.y;
      
      float m = 0.;
    for(int i=0;i<3;i++){    
        float f = floor(time*20.) + float(i)*.5;        
        float b = 
        elecsimplex_noise(vec3(f, uv.y*1., 1.))*lx + 
        elecsimplex_noise(vec3(f, uv.y*5., 5.))*ly +
        elecsimplex_noise(vec3(f, uv.y*15., 10.))*lz;

        float l = .000025+(uv.y+.5)*.00001;
        m += .0005/smoothstep(0., l*25e3, abs(b-uv.x));
    } 
    
    m = min(m, 10.);
   
    vec3 col = vec3(1.) * m;   
      return vec4(col,1.0);
    }
    `
  },
  GetDist: {
    type: 'util',
    glsl: `float GetDist(vec3 p)
    {
      vec4 s = vec4(0, 1, 6, 1);
    
      float sphereDist =  length(p-s.xyz)-s.w;
      float planeDist = p.y;
      
      float d = min(sphereDist, planeDist);
      return d;
    }
    `
  },
  RayMarch: {
    type: 'util',
    glsl: `float RayMarch(vec3 ro, vec3 rd)
    {
      float dO=0.;
      // TODO MAX_STEPS 100, MAX_DIST 30.,SURF_DIST .01
      for(int i=0; i<100; i++) {
        vec3 p = ro + rd*dO;
          float dS = GetDist(p);
          dO += dS;
          if(dO>30. || dS<.01) break;
      }
      
      return dO;
    }
    `
  },
  GetNormal: {
    type: 'util',
    glsl: `vec3 GetNormal(vec3 p)
    {
      float d = GetDist(p);
      vec2 e = vec2(.01, 0);
      
      vec3 n = d - vec3(
          GetDist(p-e.xyy),
          GetDist(p-e.yxy),
          GetDist(p-e.yyx));
      
      return normalize(n);
    }
    `
  },
  GetLight: {
    type: 'util',
    glsl: `float GetLight(vec3 p)
    {
      vec3 lightPos = vec3(0, 5, 6);
      lightPos.xz += vec2(sin(time), cos(time))*2.;
      vec3 l = normalize(lightPos-p);
      vec3 n = GetNormal(p);
      
      float dif = clamp(dot(n, l), 0., 1.);
      // todo SURF_DIST .01
      float d = RayMarch(p+n*.01*2., l);
      if(d<length(lightPos-p)) dif *= .1;
      
      return dif;
    }
    `
  },
  sphere: {
    type: 'src',
    inputs: [
      {
        name: 'lx',
        type: 'float',
        default: 0.15
      },
      {
        name: 'ly',
        type: 'float',
        default: 0.1
      },
      {
        name: 'lz',
        type: 'float',
        default: 0.02
      }
    ],
    glsl: `vec4 sphere(vec2 _st, float lx, float ly, float lz) {
      vec2 uv = 2. * _st - 1.;
      uv.x *= resolution.x/resolution.y;
      vec3 col = vec3(0);
      vec3 ro = vec3(0, 1, 0);
      vec3 rd = normalize(vec3(uv.x, -uv.y, 1));
      float d = RayMarch(ro, rd);
      vec3 p = ro + rd * d;
      float dif = GetLight(p);
      col = vec3(dif);  
      return vec4(col,1.0);
    }
    `
  },
  flaringHash: {
    type: 'util',
    glsl: `float flaringHash(float n)
    {
      return fract(sin(n)*43758.5453);
    }
    `
  },
  flaringNoise: {
    type: 'util',
    glsl: `float flaringNoise( in vec2 x )
    {	
      x *= 1.75;
        vec2 p = floor(x);
        vec2 f = fract(x);
        f = f*f*(3.0-2.0*f);
        float n = p.x + p.y*57.0;
        float res = mix(mix( flaringHash(n+  0.0), flaringHash(n+  1.0),f.x),
                        mix( flaringHash(n+ 57.0), flaringHash(n+ 58.0),f.x),f.y);
        return res;	
    }
    `
  },
  flaringFbm: {
    type: 'util',
    glsl: `float flaringFbm( in vec2 p )
    {	
      float z=2.;
      float rz = 0.;
      p *= 0.25;
      for (float i= 1.;i < 6.;i++ )
      {		
        rz+= (sin(flaringNoise(p)*15.)*0.5+0.5) /z;		
        z = z*2.;
        p = p*2.*mat2( 0.80,  0.60, -0.60,  0.80 );
      }
      return rz;
    }
    `
  },
  flaring: {
    type: 'src',
    inputs: [
      {
        name: 'curvature',
        type: 'float',
        default: 10.0
      }
    ],
    glsl: `vec4 flaring(vec2 _st, float curvature) {
      float t = -time*0.03;
      vec2 uv = 2. * _st - 1.;
      uv.x *= resolution.x/resolution.y;
	    uv*= curvature*.05+0.0001;
      float r  = sqrt(dot(uv,uv));
      float x = dot(normalize(uv), vec2(.5,0.))+t;	
      float y = dot(normalize(uv), vec2(.0,.5))+t;
      float gamma = 4.;
      float ray_density = 3.14;
      float val;
      val = flaringFbm(vec2(r+y*ray_density,r+x*ray_density-y));
      val = smoothstep(gamma*.02-.1,20.+(gamma*0.02-.1)+.001,val);
      val = sqrt(val);
      float red = 2.9;
      float green = .7;
      float blue = 3.5;
      vec3 col = val/vec3(red,green,blue);
      col = clamp(1.-col,0.,1.);
      col = mix(col,vec3(1.),.95-r/0.1/curvature*200./1.5);
      return vec4(col,1.0);
    }
    `
  },
  fluxfuzz: {
    type: 'util',
    glsl: `float fluxfuzz( vec3 p, float t ) {
      float f = 0.0;
      float a  = atan(p.y,p.x);
      float d = length(p);
      
      //p.xy *= mat2(cos(a+t*.1)*d,sin(a)*d,-sin(a)*d,cos(a+t*.1)*d);
      
      a+=sin(d+t)*.3;
      p.x = cos(a)*d;
      p.y = sin(a)*d;
      f+=length(sin(p+t));
      f = sin(f*length(p.xy)+t)*.5+.5;
      return f;
    }
    `
  },
  flux: {
    type: 'src',
    inputs: [
      {
        name: 'iSteps',
        type: 'float',
        default: 10.0
      }
    ],
    glsl: `vec4 flux(vec2 _st, float iSteps) {
      vec2 uv = -1.0 + 2.0 *_st;
      uv.x *= resolution.x/resolution.y;
      float t = time;
      vec4 c = vec4(1.0);
      float f = 0.0;
      float d = length(uv);
      float a = atan(uv.y,uv.x);
      
      for(float i = 0.0; i<10.0; i++){
        f += fluxfuzz(vec3(uv.x,uv.y,i*0.7),t); 
      }
      c.r = f;
      
      f=0.0;
      for(float i = 0.0; i<11.0; i++){
        f += fluxfuzz(vec3(uv.x,uv.y,i*0.7),t); 
      }
      c.g = f;
      
      f= 0.0;
      for(float i = 0.0; i<12.0; i++){
        f += fluxfuzz(vec3(uv.x,uv.y,i*0.7),t); 
      }
      //c.b = (f/iSteps);
      
      c.rgb = sin(c.rgb+t-d)*.5+.5;
      c.rgb *= 1.0-d*.08;
      c.a =1.0;
      return c;
    }
    `
  },


  makem2: {
    type: 'util',
    glsl: `mat2 makem2(in float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat2(c,-s,s,c);
  }
  `
  },
  naefbm: {
    type: 'util',
    glsl: `float naefbm( vec2 p ) {
    float z=2.;
float rz = 0.;
vec2 bp = p;
for (float i= 1.;i < 6.;i++ )
{
  //TODOrz+= abs((noise(p)-0.5)*2.)/z;
  rz+= abs(-0.5*2.)/z;
  z = z*2.;
  p = p*2.;
}
return rz;
  }
  `
  },
  naecirc: {
    type: 'util',
    glsl: `float naecirc( vec2 p ) {
      float r = length(p);
	r = log(sqrt(r));
	return abs(mod(r*4.,6.2831853)-3.14)*3.+.2;
    }
    `
  },
  btnae: {
    type: 'src',
    inputs: [
      {
        name: 'iSteps',
        type: 'float',
        default: 10.0
      }
    ],
    glsl: `vec4 btnae(vec2 _st, float iSteps) {
    vec2 uv = -1.0 + 2.0 *_st;
    uv.x *= resolution.x/resolution.y;
    uv*=4.;

    //get two rotated fbm calls and displace the domain
    vec2 p2 = uv*.7;
    vec2 basis = vec2(naefbm(p2-time*1.6),naefbm(p2+time*1.7));
    basis = (basis-.5)*.2;
    uv += basis;
    
    //coloring
    float rz = naefbm(uv*makem2(time*0.2));
    
    //rings
    uv /= exp(mod(time*2.,3.14159));
    rz *= pow(abs((0.1-naecirc(uv))),.9);
    
    //final color
    vec3 col = vec3(.2,0.1,0.4)/rz;
    col=pow(abs(col),vec3(.99));    
    return vec4(col,1.);
  }
  `
  },
  glitchiso: {
    type: 'util',
    glsl: `float glitchiso( vec2 v ) {
      v.y += 0.001;
      v.x += sin(v.y * 20.0 + time * 0.1) * 0.2;
      return length(v) - 0.4;
    }
    `
  },
  glitchgrad: {
    type: 'util',
    glsl: `vec2 glitchgrad( vec2 v ) {
      float E = 0.00000002 * exp(1.25 * sin(time * 5.0));
      float c = glitchiso(v);
      float x = glitchiso(v + vec2(E, 0)) - glitchiso(v - vec2(E, 0));
      float y = glitchiso(v + vec2(0, E)) - glitchiso(v - vec2(0, E));
      return vec2(x, y) / E;
    }
    `
  },
  glitchdist: {
    type: 'util',
    glsl: `float glitchdist( vec2 v ) {
      float i = glitchiso(v);
      vec2 g = glitchgrad(v);
      return abs(i) / length(g);
    }
    `
  },
  glitches: {
    type: 'coord',
    inputs: [
      {
        name: 'shake',
        type: 'float',
        default: 20
      }, {
        name: 'tempo',
        type: 'float',
        default: 20
      }
    ],
    glsl: `vec2 glitches(vec2 st, float shake, float tempo){
      float d = glitchdist(st);
      vec3 color = mix(vec3(0, 0, 0), vec3(1, 0, 0), smoothstep(0.02, 0.022, d));
      return color.xy;
    }`
  },
  glitchHash: {
    type: 'util',
    glsl: `float glitchHash( float x ) {
      return fract(sin(x * 11.1753) * 192652.37862);   
    }
    `
  },
  glitchNse: {
    type: 'util',
    glsl: `float glitchNse( float x ) {
      float fl = floor(x);
      return mix(glitchHash(fl), glitchHash(fl + 1.0), smoothstep(0.0, 1.0, fract(x)));    
    }
    `
  },
  glitch: {
    type: 'coord',
    inputs: [
      {
        name: 'shake',
        type: 'float',
        default: 20
      }, {
        name: 'tempo',
        type: 'float',
        default: 20
      }
    ],
    glsl: `vec2 glitch(vec2 st, float shake, float tempo){
		float s = shake;
		float te = tempo;
		vec2 shk = (vec2(glitchNse(s), glitchNse(s + 11.0)) * 2.0 - 1.0) * exp(-5.0 * fract(te * 4.0)) * 0.1;
		return st + shk;
    }`
  },

  BadTVResoRand: {
    type: 'util',
    glsl: `float BadTVResoRand( in float a, in float b ) {
      return fract((cos(dot(vec2(a,b) ,vec2(12.9898,78.233))) * 43758.5453)); 
    }
    `
  },
  badtv: {
    type: 'coord',
    inputs: [
      {
        name: 'shake',
        type: 'float',
        default: 20
      }, {
        name: 'tempo',
        type: 'float',
        default: 20
      }
    ],
    glsl: `vec2 badtv(vec2 st, float shake, float tempo){
      float c = 1.;
      c += shake * sin(time * 2. + st.y * 100. * tempo);
			c += shake * sin(time * 1. + st.y * 80.);
			c += shake * sin(time * 5. + st.y * 900. * tempo);
      c += 1. * cos(time + st.x);
      c *= sin(st.x*3.15);
		  c *= sin(st.y*3.);
		  c *= .9;	
      st += time;
      float r = BadTVResoRand(st.x, st.y);
      float g = BadTVResoRand(st.x * 9., st.y * 9.);
      float b = BadTVResoRand(st.x * 3., st.y * 3.);
      st.x *= r*c*.35;
      st.y *= b*c*.95;
      //st.z *= g*c*.35;
      return st;
    }`
  },

  mandelLook: {
    type: 'util',
    glsl: `vec3 mandelLook(vec2 xy, vec3 origin, vec3 target)
    {
      vec3 up=normalize(vec3(0.,1.,0.));
      vec3 fwd=normalize(target-origin);
      vec3 right=normalize(cross(fwd,up));
      up=normalize(cross(fwd,right));
      return normalize(fwd+right*xy.x+up*xy.y);
    }
    `
  },
  mandelMap: {
    type: 'util',
    glsl: `float mandelMap(vec3 pos, float Power)
    {
      //float Power=(1.-iMouse.x/RENDERSIZE.x)*8.6+1.;
      //float Power=8.6;
      vec3 z = pos;
      float dr = 1.0;
      float r = 0.0;
      for (int i = 0; i < 80 ; i++) {
        r = length(z);
            // if the length of the vector escapes toward
            // infinity, we're not hitting this thing
        if (r>100.) break;
        
        // convert to polar coordinates
        float theta = acos(z.z/r);
        float phi = atan(z.y,z.x);
        dr =  pow( r, Power-1.0)*Power*dr + 1.0;
        
        // scale and rotate the point
        float zr = pow(r*1.0,Power)+0.2;
        theta = theta*Power+46.57;
        phi = phi*Power+53.37;
        
        // convert back to cartesian coordinates
        z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
            
            // add the original point to the new one and recurse/repeat
        z+=pos;
      }
      // fudge distance estimation from fractal
      // using some calculus-y math I don't quite understand
      return 0.5*log(r)*r/dr;
    }
    `
  },
  mandelMarch: {
    type: 'util',
    glsl: `float mandelMarch(vec3 origin,vec3 ray,float maxdist,float power)
    {
      float t=.05;
      for(int i=0;i<40; i++)
      {
		    float d=mandelMap(origin+ray*t, power);
        if(d<0.0005||d>=maxdist) break;
        t+=d*0.95;
      }
      return min(t,maxdist);
    }
    `
  },
  mandelNormal: {
    type: 'util',
    glsl: `vec3 mandelNormal(vec3 p,float epsilon,float power)
    {
      vec2 e=vec2(epsilon,0.);
      return normalize(
        vec3(mandelMap(p+e.xyy, power)-mandelMap(p-e.xyy, power),
        mandelMap(p+e.yxy, power)-mandelMap(p-e.yxy, power),
        mandelMap(p+e.yyx, power)-mandelMap(p-e.yyx, power)
      ));
    }
    `
  },
  mandelHsv2rgb: {
    type: 'util',
    glsl: `vec3 mandelHsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    `
  },
  mandels: {
    type: 'src',
    inputs: [
      {
        name: 'power',
        type: 'float',
        default: 8.6
      },
      {
        name: 'maxdist',
        type: 'float',
        default: 14.0
      }
    ],
    glsl: `vec4 mandels(vec2 _st, float power, float maxdist) {
      vec2 uv = (-1.0 + 2.0 *_st);
      uv.x *= resolution.x/resolution.y;
      
      vec3 camera=vec3(1.);
      camera=vec3(sin(time/4.),sin(time/4.),cos(time/4.))*1.2;
      vec3 ray=mandelLook(uv,camera,vec3(0.));
	    float dist=mandelMarch(camera,ray, maxdist, power);
      vec3 hit=camera+ray*dist;
      float ao=pow(1.-dist/maxdist,20.);
      float diffuse=clamp(dot(mandelNormal(hit,0.01*dist, power),normalize(camera)),0.5,1.);
      float shade=diffuse*ao*0.5+ao*0.5;
      vec3 color=mandelHsv2rgb(vec3(length(hit)*.5+0.6,sin(length(hit*ao)*50.)*0.2+.8,shade*2.));    
      return vec4(color,1.0);
    }
    `
  },

  padBox: {
    type: 'util',
    glsl: `float padBox(vec2 p, vec2 b)
    {
      vec2 d = abs(p) - b;
      return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
    }
    `
  },
  pad: {
    type: 'util',
    glsl: `void pad(out vec4 bcol, inout vec3 acol, vec2 uv, float i1)
    {
      float v; vec3 col;
      v = padBox(uv, vec2(0.1)) - 0.05;
      float l = length(uv);
      float shd = exp(-40.0 * max(v, 0.0));
      col = vec3(exp(l * -4.0) * 0.3 + 0.2);
      col *= 1.0 - vec3(exp(-100.0 * abs(v))) * 0.4;
      v = smoothstep(4.0 / resolution.y, 0.0, v);
      bcol = mix(vec4(0.0, 0.0, 0.0, shd * 0.5), vec4(col, 1.0), v);
      col = vec3(0.5, 0.0, 1.0) * exp(-30.0 * l * l) * 0.8 * i1;
      acol += col;
    }
    `
  },  
  padBf: {
    type: 'util',
    glsl: `float padBf(float t)
    {
      float v = 0.04;
      return exp(t * -30.0) + smoothstep(0.25 + v, 0.25 - v, abs(t * 2.0 - 1.0));
    }
    `
  },
  pads: {
    type: 'src',
    inputs: [
      {
        name: 'start',
        type: 'float',
        default: 42.0
      }
    ],
    glsl: `vec4 pads(vec2 _st, float start) {
      vec2 p = (-1.0 + 2.0 *_st);
      p.x *= resolution.x/resolution.y;
      float te = (start + time) * 0.7475; // 174 bpm
      p *= 1.0 - cos((te + 0.75) * 6.283185307179586476925286766559) * 0.01;
      vec2 pp = p;
      p.x += 0.6;
      float i1 = padBf(fract(0.75 + te));
      float i2 = padBf(fract(0.5  + te));
      float i3 = padBf(fract(0.25 + te));
      float i4 = padBf(fract(0.0  + te));
      vec3 col = vec3(0.1);
      vec4 bcol; vec3 acol = vec3(0.0);
      pad(bcol, acol, p, i1);
      col = mix(col, bcol.xyz, bcol.w);
      pad(bcol, acol, p - vec2(0.4, 0.0), i2);
      col = mix(col, bcol.xyz, bcol.w);
      pad(bcol, acol, p - vec2(0.8, 0.0), i3);
      col = mix(col, bcol.xyz, bcol.w);
      pad(bcol, acol, p - vec2(1.2, 0.0), i4);
      col = mix(col, bcol.xyz, bcol.w);
      col += acol;
      col *= exp((length(pp) - 0.5) * -1.0) * 0.5 + 0.5;
      col = pow(col, vec3(1.2, 1.1, 1.0) * 2.0) * 4.0;
      col = pow(col, vec3(1.0 / 2.2));
      return vec4(col,1.0);
    }
    `
  },
  saw: {
    type: 'src',
    inputs: [
      {
        name: 'iZoom',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 saw(vec2 _st, float iZoom)
    {
      vec2 q = iZoom * (-1.0+2.0*_st);
      float TAU = 6.28318530718;
      float t = smoothstep(0.0, 1.0, fract(time/2.));	
      float r = length(q);
      float a = atan(q.y,q.x);
      float u = 0.0;
      u = 10.*a + 3.*TAU*t*(1.- 4.0*(1. - r)*sin(TAU*t));
      u = 20.0*r*(1.0 + 0.1*cos(u));
      u = 0.5 + 0.5*cos(u);
      u = min(floor(2.0*u),1.0);	
      u *= 1.0-smoothstep(1.,1.+0.00001,r);
      vec3 Col1 = vec3(0.01);
      vec3 Col2 = vec3(0.95);	
      return vec4(mix(Col1, Col2, u),1.0);
    }
    `
  },
  audiovisual: {
    type: 'src',
    inputs: [
      {
        name: 'wave',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 audiovisual(vec2 _st, float wave)
    {
      vec2 uv = -1.0+2.0*_st;	
      vec3 c = vec3(0.0);
      for(int i = 1; i<20; i++)
      {
          float t = 2.*3.14*float(i)/20.* (time*.9);
          float x = sin(t)*1.8*smoothstep( 0.0, 0.15, abs(wave - uv.y));
          float y = sin(.5*t) *smoothstep( 0.0, 0.15, abs(wave - uv.y));
          y*=.5;
          vec2 o = .4*vec2(x*cos(time*.5),y*sin(time*.3));
          float red = fract(t);
          float green = 1.-red;
          c+=0.016/(length(uv-o))*vec3(red,green,sin(time));
      }
      return vec4(c,1.0);
    }
    `
  },  
  soundviz: {
    type: 'src',
    inputs: [
      {
        name: 'wave',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 soundviz(vec2 _st, float wave)
    {
      vec2 uv = -1.0+2.0*_st;	
      float col = 0.0;
      uv.y += sin(time * 6.0 + uv.x*1.5)*wave;
      col += abs(0.8/uv.y) * wave;
      return vec4(col);
    }
    `
  },  
  colortunnel: {
    type: 'src',
    inputs: [
      {
        name: 'wave',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 colortunnel(vec2 _st, float wave)
    {
      vec2 p = -1.0+2.0*_st;	 
      vec4 col;
      float x,y;
      x = atan(p.x,p.y);
      y = 1./length(p.xy);
      col.x = 0.5-sin(x*5. + sin(time)/3.) * sin(y*5. + time);
      col.y = -sin(x*5. - time + sin(y+time*wave));
      col.z = 0.6-col.x + col.y * sin(y*4.+time);
      col = clamp(col,0.,1.);
      col.y = pow(col.y,.95);
      col.z = pow(col.z,.95);
      return col*length(p.xy);
    }
    `
  }, 
  fernat: {
    type: 'src',
    inputs: [
      {
        name: 'wave',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 fernat(vec2 _st, float wave)
    {
      vec2 p = -1.0+2.0*_st;	 
      float t = sin(time *0.9) * 10.0 * wave,
          l = length(p),
          r = l * exp2( t * .1),
          f = sin(r * r) * sin(t),
          g = p.x / l;
      return vec4( .1 / abs(f - g) );
    }
    `
  }, 
  bubble: {
    type: 'src',
    inputs: [
      {
        name: 'wave',
        type: 'float',
        default: 1.0
      }
    ],
    glsl: `vec4 bubble(vec2 _st, float wave)
    {
      vec2 p = -1.0+2.0*_st;	 
      vec2 a = wave * vec2( log(length(p)), atan((p).y,(p).x) );
      vec2 f = exp((a).x)* vec2(cos((a).y), sin((a).y)) - (sin(wave * time) + 1.);
      return vec4( .03/ abs(length(f) - (2.* sin(time) + 2.)));
    }
    `
  }, 
  trapCsqr: {
    type: 'util',
    glsl: `vec2 trapCsqr( vec2 a ) { return vec2(a.x*a.x-a.y*a.y, 2.0*a.x*a.y ); }`
  },
  trapDet: {
    type: 'util',
    glsl: `float trapDet(vec2 a, vec2 b) { return a.x*b.y-a.y*b.x;}`
  }, 
  trap: {
    type: 'src',
    inputs: [
      {
        name: 'mx',
        type: 'float',
        default: 0.0
      },
      {
        name: 'my',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 trap(vec2 _st, float mx, float my)
    {
      vec2 p = -1.0+2.0*_st;    
      float brightness=.85;
      float saturation=.6;
      float zoom=0.5;
      float bailout=1e5;
      p.x*=resolution.x/resolution.y;
      p/=zoom*0.5;
      vec2 iMouse = vec2(mx, my);
      vec2 q = (iMouse.xy)/ resolution.xy-(iMouse.xy==vec2(0.,0.)?0.:0.5);
      q.x*=resolution.x/resolution.y;
      q/=zoom*0.5;
      float k = 0.0;
      float dz;
      vec2 zn=normalize(p);			
      vec2 z=p;
      vec2 z0=p;
      vec2 trap = vec2(bailout);
      for (int i=0; i<150; i++) {
          vec2 prevz=z;
      z= trapCsqr(z-z0)+ z+z0;
          trap = min(trap,vec2(
              abs(trapDet(z-z0,z-q)),
              dot(z-q,z-q)
          ));	
      dz=length(z-prevz);
          if(dz==0.)break;
          if(dz<1.0)dz=1.0/dz;
          if(dz>bailout){
              k = bailout/dz;
              z=(k*prevz+(1.-k)*z);
              float k1 =sqrt(sqrt(k))/float(i+1);
              if(dot(z,z)>0.)zn=k1*normalize(z)+(1.-k1)*zn;
              break;
          }	                          
          k = 1./float(i+1);
          if(dot(z,z)>0.)zn=k*normalize(z)+(1.-k)*zn;		
      }
      vec3 color=0.2+0.8*abs(vec3(zn.x*zn.x,zn.x*zn.x,zn.y))+0.2*sin(vec3(-0.5,-0.2,0.8)+log(abs(trap.x*trap.y*trap.y)));
	    trap =sqrt(trap);
	    trap=1.-smoothstep(0.05,0.07,trap);
      color =mix( color,vec3(1.),trap.y);
      color =mix( color,vec3(1.),1.-step(0.04,length(p-q)));
      color =mix( color,vec3(0.),1.-step(0.02,length(p-q)));       
      color=mix(vec3(length(color)),color,saturation)*brightness;
      return vec4(color,1.0);
    }
    `
  },  
  circles: {
    type: 'src',
    inputs: [
      {
        name: 'speed',
        type: 'float',
        default: 0.0
      }
    ],
    glsl: `vec4 circles(vec2 _st, float speed) {
      // vec2 p = -1.0 + 2.0 *_st;
      // p.x *= resolution.x/resolution.y;
      return vec4(sin(length(_st-0.5)*10.0-time*speed));
    }
    `
  }
}
