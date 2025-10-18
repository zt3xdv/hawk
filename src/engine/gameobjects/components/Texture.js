var Frame = require('../../textures/Frame');

var _FLAG = 8; 

var Texture = {

    texture: null,

    frame: null,

    isCropped: false,

    setTexture: function (key, frame, updateSize, updateOrigin)
    {
        this.texture = this.scene.sys.textures.get(key);

        return this.setFrame(frame, updateSize, updateOrigin);
    },

    setFrame: function (frame, updateSize, updateOrigin)
    {
        if (updateSize === undefined) { updateSize = true; }
        if (updateOrigin === undefined) { updateOrigin = true; }

        if (frame instanceof Frame)
        {
            this.texture = this.scene.sys.textures.get(frame.texture.key);

            this.frame = frame;
        }
        else
        {
            this.frame = this.texture.get(frame);
        }

        if (!this.frame.cutWidth || !this.frame.cutHeight)
        {
            this.renderFlags &= ~_FLAG;
        }
        else
        {
            this.renderFlags |= _FLAG;
        }

        if (this._sizeComponent && updateSize)
        {
            this.setSizeToFrame();
        }

        if (this._originComponent && updateOrigin)
        {
            if (this.frame.customPivot)
            {
                this.setOrigin(this.frame.pivotX, this.frame.pivotY);
            }
            else
            {
                this.updateDisplayOrigin();
            }
        }

        return this;
    }

};

module.exports = Texture;
