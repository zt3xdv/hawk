var GetCalcMatrix = require('../GetCalcMatrix');

var ExternWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    renderer.pipelines.clear();

    var calcMatrix = GetCalcMatrix(src, camera, parentMatrix).calc;

    src.render.call(src, renderer, camera, calcMatrix);

    renderer.pipelines.rebind();
};

module.exports = ExternWebGLRenderer;
