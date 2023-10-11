"use strict";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const deg = document.getElementById('deg');
const degp = document.getElementById('degp');
const count = document.getElementById('count');
const countp = document.getElementById('countp');
const level = document.getElementById('level');
const levelp = document.getElementById('levelp');

function line(x, y, d, l, i) {
  ctx.moveTo(x, y);
  
  x += Math.cos(d)*l;
  y += Math.sin(d)*l;
  
  ctx.lineTo(x, y);
  
  if (i++ < +level.value) {
    const a = +deg.value/180*Math.PI;
    
    switch (+count.value) {
      case 2:
        line(x, y, d-a/2, l*len, i);
        line(x, y, d+a/2, l*len, i);
        break;
      case 3:
        line(x, y, d-a/2, l*len, i);
        line(x, y, d, l*len, i);
        line(x, y, d+a/2, l*len, i);
        break;
      case 4:
        line(x, y, d-a/2, l*len, i);
        line(x, y, d-a/6, l*len, i);
        line(x, y, d+a/6, l*len, i);
        line(x, y, d+a/2, l*len, i);
        break;
    }
  }
}

function draw() {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  
  ctx.beginPath();
  line(centerX, centerY, -Math.PI/2, 100, 0);
  ctx.stroke();
  
  degp.innerHTML = deg.value+"°";
  countp.innerHTML = count.value;
  levelp.innerHTML = level.value;
}

canvas.width = width;
canvas.height = height;

function download() {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = "tree.png";
  a.click();
}

setInterval(draw, 30);