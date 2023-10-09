"use strict";

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