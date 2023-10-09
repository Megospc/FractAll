"use strict";

const width = 330;
const height = 330;
const count = 2e5;

function color(x) {
  x = Math.min(x, 3);
  
  if (x == 0) return [ 255, 255, 255 ];
  else if (x == 1) return [ 255, 64, 64 ];
  else if (x == 2) return [ 255, 200, 64 ];
  else if (x == 3) return [ 64, 64, 255 ];
}