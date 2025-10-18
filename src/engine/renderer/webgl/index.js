var WEBGL_CONST = require('./const');
var Extend = require('../../utils/object/Extend');

var WebGL = {

    PipelineManager: require('./PipelineManager'),
    Pipelines: require('./pipelines'),
    RenderTarget: require('./RenderTarget'),
    Utils: require('./Utils'),
    WebGLPipeline: require('./WebGLPipeline'),
    WebGLRenderer: require('./WebGLRenderer'),
    WebGLShader: require('./WebGLShader'),
    Wrappers: require('./wrappers')

};

WebGL = Extend(false, WebGL, WEBGL_CONST);

module.exports = WebGL;
