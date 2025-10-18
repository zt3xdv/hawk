var Class = require('../../utils/Class');

var GeometryMask = new Class({

    initialize:

    function GeometryMask (scene, graphicsGeometry)
    {

        this.geometryMask = graphicsGeometry;

        this.invertAlpha = false;

        this.isStencil = true;

        this.level = 0;
    },

    setShape: function (graphicsGeometry)
    {
        this.geometryMask = graphicsGeometry;

        return this;
    },

    setInvertAlpha: function (value)
    {
        if (value === undefined) { value = true; }

        this.invertAlpha = value;

        return this;
    },

    preRenderWebGL: function (renderer, child, camera)
    {
        var gl = renderer.gl;

        renderer.flush();

        if (renderer.maskStack.length === 0)
        {
            gl.enable(gl.STENCIL_TEST);
            gl.clear(gl.STENCIL_BUFFER_BIT);

            renderer.maskCount = 0;
        }

        if (renderer.currentCameraMask.mask !== this)
        {
            renderer.currentMask.mask = this;
        }

        renderer.maskStack.push({ mask: this, camera: camera });

        this.applyStencil(renderer, camera, true);

        renderer.maskCount++;
    },

    applyStencil: function (renderer, camera, inc)
    {
        var gl = renderer.gl;
        var geometryMask = this.geometryMask;
        var level = renderer.maskCount;
        var mask = 0xff;

        gl.colorMask(false, false, false, false);

        if (inc)
        {
            gl.stencilFunc(gl.EQUAL, level, mask);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);

            level++;
        }
        else
        {
            gl.stencilFunc(gl.EQUAL, level + 1, mask);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
        }

        this.level = level;

        geometryMask.renderWebGL(renderer, geometryMask, camera);

        renderer.flush();

        gl.colorMask(true, true, true, true);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

        if (this.invertAlpha)
        {
            gl.stencilFunc(gl.NOTEQUAL, level, mask);
        }
        else
        {
            gl.stencilFunc(gl.EQUAL, level, mask);
        }
    },

    postRenderWebGL: function (renderer)
    {
        var gl = renderer.gl;

        renderer.maskStack.pop();

        renderer.maskCount--;

        renderer.flush();

        var current = renderer.currentMask;

        if (renderer.maskStack.length === 0)
        {

            current.mask = null;

            gl.disable(gl.STENCIL_TEST);
        }
        else
        {
            var prev = renderer.maskStack[renderer.maskStack.length - 1];

            prev.mask.applyStencil(renderer, prev.camera, false);

            if (renderer.currentCameraMask.mask !== prev.mask)
            {
                current.mask = prev.mask;
                current.camera = prev.camera;
            }
            else
            {
                current.mask = null;
            }
        }
    },

    preRenderCanvas: function (renderer, mask, camera)
    {
        var geometryMask = this.geometryMask;

        renderer.currentContext.save();

        geometryMask.renderCanvas(renderer, geometryMask, camera, null, null, true);

        renderer.currentContext.clip();
    },

    postRenderCanvas: function (renderer)
    {
        renderer.currentContext.restore();
    },

    destroy: function ()
    {
        this.geometryMask = null;
    }

});

module.exports = GeometryMask;
