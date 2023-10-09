"use strict";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const speed = document.getElementById('speed');
const speedp = document.getElementById('speedp');
const pausebtn = document.getElementById('pause');

var arr, fx, sx, fy, sy;

var pause = false;

function reset() {
  arr = new Uint32Array(width*height);

  fx = Math.floor(width/2-1);
  sx = Math.floor(width/2+1);
  fy = Math.floor(height/2-1);
  sy = Math.floor(height/2+1);
  
  arr[f(Math.floor(width/2), Math.floor(height/2))] = count;
}
function download() {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = "sandbuch.png";
  a.click();
}
function toggle() {
  pause = !pause;
  
  if (pause) pausebtn.innerHTML = "запуск";
  else pausebtn.innerHTML = "пауза";
}   

function f(x, y) {
  while (x < 0) x += width;
  while (x >= width) x -= width;
  while (y < 0) y += height;
  while (y >= height) y -= height;
  
  return x+y*width;
}

function handle() {
  let next = new Uint32Array(width*height);
  
  function incr(x, y) {
    next[f(x, y)]++;
    
    if (fx > x) fx = x;
    if (sx < x) sx = x;
    if (fy > y) fy = y;
    if (sy < y) sy = y;
  }
  
  for (let i = 0; i < next.length; i++) next[i] = arr[i];
  
  for (let x = fx-1; x <= sx+1; x++) for (let y = fy-1; y <= sy+1; y++) {
    if (arr[f(x, y)] >= 4) {
      next[f(x, y)] -= 4;
      incr(x-1, y);
      incr(x+1, y);
      incr(x, y-1);
      incr(x, y+1);
    }
  }
  
  arr.set(next);
}

function draw() {
  const w = sx-fx+3;
  const h = sy-fy+3;
  
  canvas.width = w;
  canvas.height = h;
  
  const img = new ImageData(w, h);
  const data = img.data;
  
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const k = (x+y*w)*4;
    
    const g = color(arr[f(x+fx-1, y+fy-1)]);
    
    data[k] = g[0];
    data[k+1] = g[1];
    data[k+2] = g[2];
    data[k+3] = 255;
  }
  
  ctx.putImageData(img, 0, 0);
}

reset();

canvas.width = width;
canvas.height = height;

setInterval(() => {
  draw();
  
  if (!pause) for (let i = 0; i < +speed.value; i++) handle();
  
  speedp.innerHTML = speed.value+"x";
}, 5);