var RandomXYZ = function (vec3, radius)
{
    if (radius === undefined) { radius = 1; }

    var r = Math.random() * 2 * Math.PI;
    var z = (Math.random() * 2) - 1;
    var zScale = Math.sqrt(1 - z * z) * radius;

    vec3.x = Math.cos(r) * zScale;
    vec3.y = Math.sin(r) * zScale;
    vec3.z = z * radius;

    return vec3;
};

module.exports = RandomXYZ;
