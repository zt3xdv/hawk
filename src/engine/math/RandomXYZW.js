var RandomXYZW = function (vec4, scale) {
  if (scale === undefined) {
    scale = 1;
  }
  vec4.x = (Math.random() * 2 - 1) * scale;
  vec4.y = (Math.random() * 2 - 1) * scale;
  vec4.z = (Math.random() * 2 - 1) * scale;
  vec4.w = (Math.random() * 2 - 1) * scale;
  return vec4;
};
module.exports = RandomXYZW;
