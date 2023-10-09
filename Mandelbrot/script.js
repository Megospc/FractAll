"use strict";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const zoomp = document.getElementById('zoom');
const pausebtn = document.getElementById('pause');

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

var interval;
var pause = true;

var moveX = 0;
var moveY = 0;
var zoom = 1;

function draw() {
  const img = new ImageData(width, height);
  const data = new Uint32Array(img.data.buffer);
  
  for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
    const k = x+y*width;
    const c = new Complex(
      (x/width*areaw-areaw/2-moveX)/zoom+moveX,
      (y/height*areah-areah/2-moveY)/zoom+moveY
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
}

function frame() {
  draw();
  
  if (!pause) zoom *= zoomx;
  
  if (zoom > zoomm) zoom = zoomm;
  
  zoomp.innerHTML = "Приближение: "+zoomstr(zoom);
}

canvas.width = width;
canvas.height = height;

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

function backward() {
  zoom /= zoomx**zoomz;
  
  if (zoom < 1) zoom = 1;
}
function forward() {
  zoom *= zoomx**zoomz;
  
  if (zoom > zoomm) zoom = zoomm;
}

canvas.addEventListener("click", e => {
  e.preventDefault();
  
  const b = canvas.getBoundingClientRect();
  
  moveX += ((e.clientX-b.left)/b.width*areaw-areaw/2-moveX)/zoom;
  moveY += ((e.clientY-b.top)/b.height*areah-areah/2-moveY)/zoom;
});

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

function zoomstr(x) {
  const arr = ["x", "k", "m", "b", "t"];
  const log = Math.floor(Math.log10(x)/3);
  
  return (x/1000**log).toFixed(1)+arr[log]
}