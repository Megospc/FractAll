"use strict";

const canvas = document.getElementById('canvas');
const zoomp = document.getElementById('zoom');
const pausebtn = document.getElementById('pause');
const pu = document.getElementById('pu');
const doublec = document.getElementById('double');
const doublediv = document.getElementById('doublediv');

const url = new URL(location.href);

var draw, frame, forward, backward;
var pause = true;

var moveX = 0;
var moveY = 0;
var zoom = 1;

const gpu = url.searchParams.get("gpu") == "true";
const double = url.searchParams.get("double") == "true";

if (gpu) {
  pu.checked = true;
  
  const scrx = 0.7;
  
  const width = 640;
  const height = width*scrx;
  const area = 3;
  
  const max = 4;
  const iterations = 100;
  
  const zoomx = 1.02;
  const zoomz = 10;
  const zoomm = 1e5;
  const move = 0.03;
  
  const contrast = 3;
  
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
  if (double) doublec.checked = true;
  doublediv.style.display = "inline";
  
  const scrx = 0.7;
  
  const iscale = 8;
  const timeout = 50;
  
  const width = double ? 320:640;
  const height = width*scrx;
  const areaw = 5;
  const areah = areaw*scrx;
  
  const max = 4;
  const iterations = 100;
  
  const zoomx = 1.5;
  const zoomz = 3;
  const zoomm = double ? 1e30:1e14;
  const move = 0.03;
  
  const contrast = 3;
  
  let grad;
  
  switch (url.searchParams.get("theme")) {
    case "rainbow":
      grad = function(x) {
        return (
          (dot(x, [
            [0/5, 200],
            [1/5, 200],
            [2/5, 0],
            [3/5, 0],
            [4/5, 0],
            [5/5, 200],
            [contrast, 255]
          ]) << 0) +
          (dot(x, [
            [0/5, 0],
            [1/5, 200],
            [2/5, 200],
            [3/5, 200],
            [4/5, 0],
            [5/5, 0],
            [contrast, 255]
          ]) << 8) +
          (dot(x, [
            [0/5, 0],
            [1/5, 0],
            [2/5, 0],
            [3/5, 200],
            [4/5, 200],
            [5/5, 200],
            [contrast, 255]
          ]) << 16) +
          (255 << 24)
        );
      };
      break;
    default:
      grad = function(x) {
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
      };
      break;
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
  
  const doub = x => new Double(x);
  
  if (double) {
    moveX = doub(0);
    moveY = doub(0);
    zoom = doub(1);
  }
  
  const Complex = double ? class {
    constructor(r, i) {
      this.r = doub(r);
      this.i = doub(i);
    }
    
    sq() {
      const r = doub(this.r);
      const i = doub(this.i);
      
      this.r = r.mul(r).sub(i.mul(i));
      this.i = r.mul(i).mul(2);
    }
    
    add(n) {
      this.r = this.r.add(n.r);
      this.i = this.i.add(n.i);
    }
    
    length() {
      return this.r.mul(this.r).add(this.i.mul(this.i));
    }
    
    is() {
      return this.length().gt(max);
    }
  }:class {
    constructor(r, i) {
      this.r = r;
      this.i = i;
    }
    
    sq() {
      const r = this.r;
      const i = this.i;
      
      this.r = r**2-i**2;
      this.i = 2*r*i;
    }
    
    add(n) {
      this.r += n.r;
      this.i += n.i;
    }
    
    length() {
      return this.r**2+this.i**2;
    }
    
    is() {
      return this.length() > max;
    }
  };
  
  let dids = 0;
  
  draw = function() {
    const did = ++dids;
    
    const img = new ImageData(width, height);
    const data = new Uint32Array(img.data.buffer);
    
    function f(id, ix = 0, iy = 0, iw = iscale, ih = iscale) {
      if (id != dids) return;
      
      for (let x = 0; x < width; x += iscale) for (let y = 0; y < height; y += iscale) {
        const cr = double ? doub(x+ix).div(width/areaw).sub(areaw/2).div(zoom).add(moveX):((x+ix)/width*areaw-areaw/2)/zoom+moveX;
        const ci = double ? doub(y+iy).div(height/areah).sub(areah/2).div(zoom).add(moveY):((y+iy)/height*areah-areah/2)/zoom+moveY;
        
        const c = new Complex(cr, ci);
        
        let a = new Complex(0, 0);
        
        let i;
        
        for (i = 0; i < iterations; i++) {
          a.sq();
          a.add(c);
          
          if (a.is()) break;
        }
        
        const k = x+y*width;
        const clr = grad(i/iterations*contrast);
        for (let l = ix; l < ix+iw; l++) for (let m = iy; m < iy+ih; m++) data[k+l+m*width] = clr;
      }
      
      ctx.putImageData(img, 0, 0);
    }
    
    f(did);
    
    let t = 1;
    
    function d(s) {
      for (let x = 0; x < iscale; x += s) for (let y = 0; y < iscale; y += s) if (x > 0 || y > 0) setTimeout(() => f(did, x, y, s, s), timeout*(t++));
      if (s > 1) for (let x = 0; x < iscale; x += s) for (let y = 0; y < iscale; y += s) d(s/2);
    }
    
    d(iscale/2);
    
    zoomp.innerHTML = "Приближение: "+zoomstr(zoom);
  };
  
  frame = function() {
    if (double) zoom = zoom.mul(zoomx);
    else zoom *= zoomx;
    
    if ((double && zoom.gt(zoomm)) || (!double && zoom > zoomm)) zoom = double ? doub(zoomm):zoomm;
    
    draw();
  };
  
  backward = function() {
    if (double) zoom = zoom.div(zoomx**zoomz);
    else zoom /= zoomx**zoomz;
    
    if ((double && zoom.lt(1)) || (!double && zoom < 1)) zoom = double ? doub(1):1;
    
    draw();
  };
  forward = function() {
    if (double) zoom = zoom.mul(zoomx**zoomz);
    else zoom *= zoomx**zoomz;
    
    if ((double && zoom.gt(zoomm)) || (!double && zoom > zoomm)) zoom = double ? doub(zoomm):zoomm;
    
    draw();
  };
  
  canvas.addEventListener("click", e => {
    e.preventDefault();
    
    const b = canvas.getBoundingClientRect();
    
    if (double) {
      moveX = moveX.add(doub(((e.clientX-b.left)/b.width*2-1)*areaw/2).div(zoom));
      moveY = moveY.add(doub(((e.clientY-b.top)/b.height*2-1)*areah/2).div(zoom));
    } else {
      moveX += ((e.clientX-b.left)/b.width*2-1)*areaw/zoom/2;
      moveY += ((e.clientY-b.top)/b.height*2-1)*areah/zoom/2;
    }
    
    frame();
  });
  
  document.getElementById('pause').style.display = "none";
}

function zoomstr(x) {
  if (typeof x == "object") x = x.toNumber();
  
  const arr = ["x", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N"];
  const log = Math.floor(Math.log10(x)/3);
  
  return (x/1000**log).toFixed(1)+arr[log];
}

draw();

function reset() {
  zoom = double ? new Double(1):1;
  if (pause) toggle();
  if (!gpu) draw();
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
function doublet() {
  location.href = "?gpu=false&double="+doublec.checked;
}

if (gpu) setInterval(frame, gpu ? 30:300);