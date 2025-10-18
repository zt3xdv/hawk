var Class = require('../../../utils/Class');

var errors = {
    36054: 'Incomplete Attachment',
    36055: 'Missing Attachment',
    36057: 'Incomplete Dimensions',
    36061: 'Framebuffer Unsupported'
};

var WebGLFramebufferWrapper = new Class({

    initialize:

    function WebGLFramebufferWrapper (gl, width, height, renderTexture, addDepthStencilBuffer)
    {

        this.webGLFramebuffer = null;

        this.gl = gl;

        this.width = width;

        this.height = height;

        this.renderTexture = renderTexture;

        this.addDepthStencilBuffer = !!addDepthStencilBuffer;

        this.createResource();
    },

    createResource: function ()
    {
        var gl = this.gl;

        if (gl.isContextLost())
        {

            return;
        }

        var renderTexture = this.renderTexture;
        var complete = 0;
        var framebuffer = gl.createFramebuffer();

        this.webGLFramebuffer = framebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        renderTexture.isRenderTexture = true;
        renderTexture.isAlphaPremultiplied = false;

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture.webGLTexture, 0);

        complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if (complete !== gl.FRAMEBUFFER_COMPLETE)
        {
            throw new Error('Framebuffer status: ' + (errors[complete] || complete));
        }

        if (this.addDepthStencilBuffer)
        {
            var depthStencilBuffer = gl.createRenderbuffer();

            gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, this.width, this.height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilBuffer);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },

    destroy: function ()
    {
        if (this.webGLFramebuffer === null)
        {
            return;
        }

        var gl = this.gl;

        if (!gl.isContextLost())
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.webGLFramebuffer);

            var colorAttachment = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);

            if (colorAttachment !== null)
            {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);

                gl.deleteTexture(colorAttachment);
            }

            var depthStencilAttachment = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);

            if (depthStencilAttachment !== null)
            {
                gl.deleteRenderbuffer(depthStencilAttachment);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.deleteFramebuffer(this.webGLFramebuffer);
        }

        this.renderTexture = null;
        this.webGLFramebuffer = null;
        this.gl = null;
    }
});

module.exports = WebGLFramebufferWrapper;
