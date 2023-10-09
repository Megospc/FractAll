"use strict";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const len = document.getElementById('len');
const lenp = document.getElementById('lenp');

var arr;
var moveX = 150;
var moveY = 200;

function handle() {
  arr = [];
  
  for (let i = 0; i < iterations; i++) {
    arr.push(1, ...arr.map(x => -x).reverse());
  }
}

function draw() {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width*scale, height*scale);
  
  ctx.lineWidth = size*scale;
  
  let d = 0;
  let x = moveX*scale;
  let y = moveY*scale;
  
  let left = [];
  let right = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0) right.push(x, y);
    else left.push(x, y);
    
    x += Math.cos(d)*len.value*scale/10;
    y += Math.sin(d)*len.value*scale/10;
    
    if (arr[i] > 0) right.push(x, y);
    else left.push(x, y);
    
    d += arr[i]*deg;
  }
  
  ctx.strokeStyle = "#0000ff";
  ctx.beginPath();
  for (let i = 0; i < left.length; i += 4) {
    ctx.moveTo(left[i], left[i+1]);
    ctx.lineTo(left[i+2], left[i+3]);
  }
  ctx.stroke();
  
  ctx.strokeStyle = "#ff0000";
  ctx.beginPath();
  for (let i = 0; i < right.length; i += 4) {
    ctx.moveTo(right[i], right[i+1]);
    ctx.lineTo(right[i+2], right[i+3]);
  }
  ctx.stroke();
  
  lenp.innerHTML = (+len.value/10).toFixed(1)+"x";
}

function download() {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = "dragon.png";
  a.click();
}

canvas.width = width*scale;
canvas.height = height*scale;

canvas.addEventListener("click", e => {
  e.preventDefault();
  
  const b = canvas.getBoundingClientRect();
  
  moveX -= (e.clientX-b.left)/b.width*width-width/2;
  moveY -= (e.clientY-b.top)/b.height*height-height/2;
});

handle();

setInterval(draw, 30);