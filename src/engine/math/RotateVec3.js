var Vector3 = require('../math/Vector3');
var Matrix4 = require('../math/Matrix4');
var Quaternion = require('../math/Quaternion');

var tmpMat4 = new Matrix4();
var tmpQuat = new Quaternion();
var tmpVec3 = new Vector3();

var RotateVec3 = function (vec, axis, radians)
{

    tmpQuat.setAxisAngle(axis, radians);

    tmpMat4.fromRotationTranslation(tmpQuat, tmpVec3.set(0, 0, 0));

    return vec.transformMat4(tmpMat4);
};

module.exports = RotateVec3;
