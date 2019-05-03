// Copyright (c) 2018 8th Wall, Inc.

const fragmentShaders = [
  `
  precision mediump float;
  uniform sampler2D sampler; // 0
  uniform float vx_offset;
  varying vec2 texUv;

  vec3 heat(float v) {
    float value = 1.0 - v;
    return (0.5+0.5*smoothstep(0.0, 0.1, value))*vec3(
      	smoothstep(0.5, 0.3, value),
      	value < 0.3 ? smoothstep(0.0, 0.3, value) : smoothstep(1.0, 0.6, value),
    	smoothstep(0.4, 0.6, value)
	  );
  }

  void main() 
  { 
    // float sum = iTimeDelta;
    float sum = 0.2;
    // vec3 color = texture(iChannel0, texUv).rgb;
    vec3 color = texture2D(sampler, texUv).rgb;
    sum += smoothstep(color.z, 0.0, distance(color.xy, texUv));
    
    gl_FragColor = vec4(heat(sum), 1.0);   
  }`,
  `#define C_RED vec4(1.0, 0.0, 0.0, 1.0)
   #define C_YELLOW vec4(1.0, 1.0, 0.0, 1.0)
   #define C_BLUE vec4(0.0, 0.0, 1.0, 1.0)

  precision mediump float;
  uniform sampler2D sampler; // 0
  uniform float vx_offset;
  varying vec2 texUv;
  void main() 
  { 
    vec3 c = texture2D(sampler, texUv).rgb;

    float luminance = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    // float THRESHOLD = (length(iMouse.xy) < 1e-2) ? 0.5 : iMouse.x / iResolution.x;
    float THRESHOLD = 0.5;
    gl_FragColor = (luminance < THRESHOLD) ? mix(C_BLUE, C_YELLOW, luminance * 2.0 ) : mix(C_YELLOW, C_RED, (luminance - 0.5) * 2.0);
    gl_FragColor.rgb *= 0.1 + 0.25 + 0.75 * pow( 16.0 * texUv.x * texUv.y * (1.0 - texUv.x) * (1.0 - texUv.y), 0.15 );
  }`,
  `precision mediump float;
  uniform sampler2D sampler; // 0
  uniform float vx_offset;
  varying vec2 texUv;
  void main() 
  { 
    vec3 pixcol = texture2D(sampler, texUv).rgb;
    gl_FragColor = vec4(pixcol, 1.0);

    float a = pixcol.r;
        // if(darkIsHot)
        //     a = 1.0 - a;

    //fast shader version
      gl_FragColor.r = 1.0 - clamp(step(0.166, a)*a, 0.0, 0.333) - 0.667*step(0.333, a) + step(0.666, a)*a + step(0.833, a)*1.0;
      gl_FragColor.b = clamp(step(0.333, a)*a, 0.0, 0.5) + step(0.5, a)*0.5;
      gl_FragColor.g = clamp(a, 0.0, 0.166) + 0.834*step(0.166, a) - step(0.5, a)*a - step(0.666, a)*1.0;
  }`,
  `precision mediump float;
  uniform sampler2D sampler; // 0
  uniform float vx_offset;
  varying vec2 texUv;
  void main() 
  { 
    vec3 tc = vec3(1.0, 0.0, 0.0);
    vec3 pixcol = texture2D(sampler, texUv).rgb;
    vec3 colors[3];
    colors[0] = vec3(0.,0.,1.);
    colors[1] = vec3(1.,1.,0.);
    colors[2] = vec3(1.,0.,0.);
    // float lum = dot(vec3(0.30, 0.59, 0.11), pixcol.rgb);
    float lum = (pixcol.r+pixcol.g+pixcol.b)/3.;
    int ix = (lum < 0.5)? 0:1;

    if(ix == 1)tc = mix(colors[1],colors[2],(lum-float(ix)*0.5)/0.5);
    if(ix == 0)tc = mix(colors[0],colors[1],(lum-float(ix)*0.5)/0.5);
    
    gl_FragColor = vec4(tc, 1.0);
  }`,
  ` precision mediump float;  // Just the camera feed.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() { gl_FragColor = texture2D(sampler, texUv); }`,
  ` precision mediump float;  // Color boost.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      float y = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float u = dot(c.rgb, vec3(-.159, -.331, .5)) * 6.0;
      float v = dot(c.rgb, vec3(.5, -.419, -.081)) * 3.0;
      gl_FragColor = vec4(y + 1.4 * v, y - .343 * u - .711 * v, y + 1.765 * u, c.a);
    }`,
  ` precision mediump float;  // Vignette.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      float x = texUv.x - .5;
      float y = texUv.y - .5;
      float v = 1.5 - sqrt(x * x + y * y) * 2.5;
      vec4 c = texture2D(sampler, texUv);
      gl_FragColor = vec4(c.rgb * (v > 1.0 ? 1.0 : v), c.a);
    }`,
  ` precision mediump float;  // Black and white.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      gl_FragColor = vec4(vec3(dot(c.rgb, vec3(0.299, 0.587, 0.114))), c.a);
    }`,
  ` precision mediump float;  // Sepia.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      gl_FragColor.r = dot(c.rgb, vec3(.393, .769, .189));
      gl_FragColor.g = dot(c.rgb, vec3(.349, .686, .168));
      gl_FragColor.b = dot(c.rgb, vec3(.272, .534, .131));
      gl_FragColor.a = c.a;
    }`,
  ` precision mediump float;  // Purple.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      float y = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      vec3 p = vec3(.463, .067, .712);
      vec3 rgb = y < .25 ? (y * 4.0) * p : ((y - .25) * 1.333) * (vec3(1.0, 1.0, 1.0) - p) + p;
      gl_FragColor = vec4(rgb, c.a);
    }`
]

// Define a custom pipeline module. This module cycles through a set of pre-defined shaders each
// time the next button is pressed. It also updates the button style on orientation changes.
const nextbuttonPipelineModule = () => {
  const nextButton = document.getElementById('nextbutton')
  let idx = 0 // Index of the shader to use next.

  const nextShader = () => {
    // Reconfigure the texture renderer pipline module to use the next shader.
    XR.GlTextureRenderer.configure({ fragmentSource: fragmentShaders[idx] })
    idx = (idx + 1) % fragmentShaders.length
  }

  nextShader() // Call 'nextShader' once to set the first shader.
  nextButton.onclick = nextShader // Switch to the next shader when the next button is pressed.

  const adjustButtonTextCenter = ({ orientation }) => {
    // Update the line height on the button.
    const ww = window.innerWidth
    const wh = window.innerHeight

    // Wait for orientation change to take effect before handling resize.
    if (
      ((orientation == 0 || orientation == 180) && ww > wh) ||
      ((orientation == 90 || orientation == -90) && wh > ww)
    ) {
      window.requestAnimationFrame(() => adjustButtonTextCenter({ orientation }))
      return
    }

    nextButton.style.lineHeight = `${nextButton.getBoundingClientRect().height}px`
  }

  // Return a pipeline module that updates the state of the UI on relevant lifecycle events.
  return {
    name: 'nextbutton',
    onStart: ({ orientation }) => {
      nextButton.style.visibility = 'visible'
      adjustButtonTextCenter({ orientation })
    },
    onDeviceOrientationChange: ({ orientation }) => {
      adjustButtonTextCenter({ orientation })
    }
  }
}

const onxrloaded = () => {
  XR.addCameraPipelineModules([
    // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(), // Draws the camera feed.
    XRExtras.AlmostThere.pipelineModule(), // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(), // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(), // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(), // Shows an error image on runtime error.
    // Custom pipeline modules.
    nextbuttonPipelineModule() // Cycles through shaders and keeps UI up to date.
  ])

  // Request camera permissions and run the camera.
  XR.run({ canvas: document.getElementById('camerafeed') })
}

// Show loading screen before the full XR library has been loaded.
const load = () => {
  XRExtras.Loading.showLoading({ onxrloaded })
}
window.onload = () => {
  window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load)
}
