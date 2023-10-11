"use strict";

const canvas = document.getElementById('canvas');
const zoomp = document.getElementById('zoom');
const pausebtn = document.getElementById('pause');
const pu = document.getElementById('pu');

const url = new URL(location.href);

var interval;
var draw, frame, forward, backward;
var pause = true;

var moveX = 0;
var moveY = 0;
var zoom = 1;

if (url.searchParams.get("gpu") == "true") {
  pu.checked = true;
  
  const scrx = 0.7;
  
  const width = 600;
  const height = width*scrx;
  const area = 3;
  
  const max = 4;
  const iterations = 100;
  
  const zoomx = 1.02;
  const zoomz = 10;
  const zoomm = 1e5;
  const move = 0.03;
  
  const contrast = 3;
  const flevel = (1 << 23);
  
  canvas.width = width;
  canvas.height = height;
  
  const gl = canvas.getContext('webgl');
  
  function createShader(type, text) {
    const shader = gl.createShader(type);
    
    gl.shaderSource(shader, text);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw Error(`Can not create shader: ${log}`);
    return shader;
  }
  
  function createProgram(vertex, fragment) {
    const program = gl.createProgram();
    
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    
    return program;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const vertex = `
attribute vec4 a_position;
varying vec2 v_coord;
void main() {
  v_coord = a_position.xy;
  gl_Position = a_position;
}`;
  
  const fragment = `
precision highp float;

uniform float u_center_x;
uniform float u_center_y;
uniform float u_scale;

varying vec2 v_coord;

vec3 grad(float x) {
  float r, g, b;
  
  if (x <= 0.5) {
    r = 1.-(x*2.);
    g = 0.;
    b = 0.5-x;
  } else if (x <= 1.) {
    r = 0.;
    g = (x-0.5)*2.;
    b = (x-0.5)/2.;
  } else {
    r = 0.;
    g = 1.-((x-1.)/${contrast-1}.*0.875);
    b = 0.25;
  }
  
  return vec3(r, g, b);
}

void main() {
  float ar, ai, cr, ci;
  
  vec3 color = grad(${contrast}.);
  
  ar = 0.;
  ai = 0.;
  
  cr = v_coord.x*u_scale+u_center_x;
  ci = v_coord.y*u_scale*${scrx}+u_center_y;
  
  for (int i = 0; i < ${iterations}; i++) {
    float nr = ar;
    float ni = ai;
    
    ar = nr*nr-ni*ni;
    ai = 2.*nr*ni;
    
    ar += cr;
    ai += ci;
    
    if (ar*ar+ai*ai > ${max}.) {
      color = grad(float(i)/${iterations}.*${contrast}.);
      break;
    }
  }
  
  gl_FragColor = vec4(color, 1.);
}`;
  
  const program = createProgram(
    createShader(gl.VERTEX_SHADER, vertex),
    createShader(gl.FRAGMENT_SHADER, fragment),
  );
  
  const positions = [
    -1, -1,
    -1, 1,
    1, 1,
    -1, -1,
    1, 1,
    1, -1,
  ];
  
  const posloc = gl.getAttribLocation(program, 'a_position');
  const centerXloc = gl.getUniformLocation(program, 'u_center_x');
  const centerYloc = gl.getUniformLocation(program, 'u_center_y');
  const scaleloc = gl.getUniformLocation(program, 'u_scale');
  
  const pos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posloc);
  gl.vertexAttribPointer(posloc, 2, gl.FLOAT, false, 0, 0);
  
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  
  draw = function() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform1f(centerXloc, moveX);
    gl.uniform1f(centerYloc, moveY);
    gl.uniform1f(scaleloc, area/zoom);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  
  frame = function() {
    if (!pause) zoom *= zoomx;
    
    if (zoom > zoomm) zoom = zoomm;
    
    draw();
    
    zoomp.innerHTML = "Приближение: "+zoomstr(zoom);
  };
  
  backward = function() {
    zoom /= zoomx**zoomz;
    
    if (zoom < 1) zoom = 1;
  };
  forward = function() {
    zoom *= zoomx**zoomz;
    
    if (zoom > zoomm) zoom = zoomm;
  };
  
  canvas.addEventListener("click", e => {
    e.preventDefault();
    
    const b = canvas.getBoundingClientRect();
    moveX += ((e.clientX-b.left)/b.width*2-1)*area/zoom;
    moveY -= ((e.clientY-b.top)/b.height*2-1)*area*scrx/zoom;
  });
} else {
  pu.checked = false;
  
  const scrx = 0.7;
  
  const width = 200;
  const height = width*scrx;
  const areaw = 5;
  const areah = areaw*scrx;
  
  const max = 4;
  const pow = 2;
  const iterations = 100;
  
  const zoomx = 1.02;
  const zoomz = 10;
  const zoomm = 1e14;
  const move = 0.03;
  
  const contrast = 3;
  
  function grad(x) {
    return (
      (dot(x, [
        [0, 255],
        [0.5, 0],
        [1, 0],
        [contrast, 0]
      ]) << 0) +
      (dot(x, [
        [0, 0],
        [0.5, 0],
        [1, 255],
        [contrast, 32]
      ]) << 8) +
      (dot(x, [
        [0, 128],
        [0.5, 0],
        [1, 64],
        [contrast, 64]
      ]) << 16) +
      (255 << 24)
    );
  }
  
  function dot(x, arr) {
    for (let i = 0; i < arr.length-1; i++) {
      const a = arr[i];
      const b = arr[i+1];
      
      if (a[0] <= x && b[0] >= x) return (x-a[0])/(b[0]-a[0])*(b[1]-a[1])+a[1];
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  class Complex {
    constructor(r, i) {
      this.r = r;
      this.i = i;
    }
    
    pow(n) {
      const r = this.r;
      const i = this.i;
      
      this.r = r**n-i**n;
      this.i = n*r*i;
    }
    
    add(n) {
      this.r += n.r;
      this.i += n.i;
    }
  }
  
  draw = function() {
    const img = new ImageData(width, height);
    const data = new Uint32Array(img.data.buffer);
    
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
      const k = x+y*width;
      const c = new Complex(
        (x/width*areaw-areaw/2)/zoom+moveX,
        (y/height*areah-areah/2)/zoom+moveY
      );
      
      let a = new Complex(0, 0);
      
      let i;
      
      for (i = 0; i < iterations; i++) {
        a.pow(pow);
        a.add(c);
        
        if (a.r**2+a.i**2 > max) break;
      }
      
      data[k] = grad(i/iterations*contrast);
    }
    
    ctx.putImageData(img, 0, 0);
  };
  
  frame = function() {
    if (!pause) zoom *= zoomx;
    
    if (zoom > zoomm) zoom = zoomm;
    
    draw();
    
    zoomp.innerHTML = "Приближение: "+zoomstr(zoom);
  };
  
  backward = function() {
    zoom /= zoomx**zoomz;
    
    if (zoom < 1) zoom = 1;
  };
  forward = function() {
    zoom *= zoomx**zoomz;
    
    if (zoom > zoomm) zoom = zoomm;
  };
  
  canvas.addEventListener("click", e => {
    e.preventDefault();
    
    const b = canvas.getBoundingClientRect();
    moveX += ((e.clientX-b.left)/b.width*2-1)*area/zoom;
    moveY += ((e.clientY-b.top)/b.height*2-1)*area*scrx/zoom;
  });
}

function zoomstr(x) {
  const arr = ["x", "k", "m", "b", "t"];
  const log = Math.floor(Math.log10(x)/3);
  
  return (x/1000**log).toFixed(1)+arr[log]
}

draw();

function reset() {
  zoom = 1;
  if (pause) toggle();
}
function download() {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = "mandelbrot.png";
  a.click();
}
function toggle() {
  pause = !pause;
  
  if (pause) pausebtn.innerHTML = "запуск";
  else pausebtn.innerHTML = "пауза";
}

function tpu() {
  location.href = "?gpu="+pu.checked;
}

document.addEventListener("keydown", e => {
  switch (e.code) {
    case "NumpadAdd":
      forward();
      break;
    case "NumpadSubstract":
      backward();
      break;
    case "Digit0":
      reset();
      break;
    case "Space":
      toggle();
      break;
    case "ArrowLeft":
      moveX -= (areaw-areaw/2-moveX)/zoom;
      break;
    case "ArrowRight":
      moveX += (areaw-areaw/2-moveX)/zoom;
      break;
    case "ArrowUp":
      moveY -= (areah-areah/2-moveY)/zoom;
      break;
    case "ArrowDown":
      moveY += (areah-areah/2-moveY)/zoom;
      break;
  }
});

if (interval) clearInterval(interval);
interval = setInterval(frame, 30);