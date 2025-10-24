var TransformMatrix = require('./components/TransformMatrix');
var tempMatrix1 = new TransformMatrix();
var tempMatrix2 = new TransformMatrix();
var tempMatrix3 = new TransformMatrix();
var result = { camera: tempMatrix1, sprite: tempMatrix2, calc: tempMatrix3 };
var GetCalcMatrix = function (src, camera, parentMatrix) {
  var camMatrix = tempMatrix1;
  var spriteMatrix = tempMatrix2;
  var calcMatrix = tempMatrix3;
  spriteMatrix.applyITRS(src.x, src.y, src.rotation, src.scaleX, src.scaleY);
  camMatrix.copyFrom(camera.matrix);
  if (parentMatrix) {
    camMatrix.multiplyWithOffset(
      parentMatrix,
      -camera.scrollX * src.scrollFactorX,
      -camera.scrollY * src.scrollFactorY,
    );
    spriteMatrix.e = src.x;
    spriteMatrix.f = src.y;
  } else {
    spriteMatrix.e -= camera.scrollX * src.scrollFactorX;
    spriteMatrix.f -= camera.scrollY * src.scrollFactorY;
  }
  camMatrix.multiply(spriteMatrix, calcMatrix);
  return result;
};
module.exports = GetCalcMatrix;
