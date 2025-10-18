var Class = require('../../../utils/Class');

var WebGLBufferWrapper = new Class({

    initialize:

    function WebGLBufferWrapper (gl, initialDataOrSize, bufferType, bufferUsage)
    {

        this.webGLBuffer = null;

        this.gl = gl;

        this.initialDataOrSize = initialDataOrSize;

        this.bufferType = bufferType;

        this.bufferUsage = bufferUsage;

        this.createResource();
    },

    createResource: function ()
    {
        if (this.initialDataOrSize === null)
        {
            return;
        }

        var gl = this.gl;

        if (gl.isContextLost())
        {

            return;
        }

        var bufferType = this.bufferType;
        var webGLBuffer = gl.createBuffer();

        this.webGLBuffer = webGLBuffer;

        gl.bindBuffer(bufferType, this.webGLBuffer);
        gl.bufferData(bufferType, this.initialDataOrSize, this.bufferUsage);
        gl.bindBuffer(bufferType, null);
    },

    destroy: function ()
    {
        var gl = this.gl;
        if (!gl.isContextLost())
        {
            gl.deleteBuffer(this.webGLBuffer);
        }
        this.webGLBuffer = null;
        this.initialDataOrSize = null;
        this.gl = null;
    }
});

module.exports = WebGLBufferWrapper;
