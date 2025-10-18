var Class = require('../../utils/Class');
var GetValue = require('../../utils/object/GetValue');

var SmoothedKeyControl = new Class({

    initialize:

    function SmoothedKeyControl (config)
    {

        this.camera = GetValue(config, 'camera', null);

        this.left = GetValue(config, 'left', null);

        this.right = GetValue(config, 'right', null);

        this.up = GetValue(config, 'up', null);

        this.down = GetValue(config, 'down', null);

        this.zoomIn = GetValue(config, 'zoomIn', null);

        this.zoomOut = GetValue(config, 'zoomOut', null);

        this.zoomSpeed = GetValue(config, 'zoomSpeed', 0.01);

        this.minZoom = GetValue(config, 'minZoom', 0.001);

        this.maxZoom = GetValue(config, 'maxZoom', 1000);

        this.accelX = 0;

        this.accelY = 0;

        var accel = GetValue(config, 'acceleration', null);

        if (typeof accel === 'number')
        {
            this.accelX = accel;
            this.accelY = accel;
        }
        else
        {
            this.accelX = GetValue(config, 'acceleration.x', 0);
            this.accelY = GetValue(config, 'acceleration.y', 0);
        }

        this.dragX = 0;

        this.dragY = 0;

        var drag = GetValue(config, 'drag', null);

        if (typeof drag === 'number')
        {
            this.dragX = drag;
            this.dragY = drag;
        }
        else
        {
            this.dragX = GetValue(config, 'drag.x', 0);
            this.dragY = GetValue(config, 'drag.y', 0);
        }

        this.maxSpeedX = 0;

        this.maxSpeedY = 0;

        var maxSpeed = GetValue(config, 'maxSpeed', null);

        if (typeof maxSpeed === 'number')
        {
            this.maxSpeedX = maxSpeed;
            this.maxSpeedY = maxSpeed;
        }
        else
        {
            this.maxSpeedX = GetValue(config, 'maxSpeed.x', 0);
            this.maxSpeedY = GetValue(config, 'maxSpeed.y', 0);
        }

        this._speedX = 0;

        this._speedY = 0;

        this._zoom = 0;

        this.active = (this.camera !== null);
    },

    start: function ()
    {
        this.active = (this.camera !== null);

        return this;
    },

    stop: function ()
    {
        this.active = false;

        return this;
    },

    setCamera: function (camera)
    {
        this.camera = camera;

        return this;
    },

    update: function (delta)
    {
        if (!this.active)
        {
            return;
        }

        if (delta === undefined) { delta = 1; }

        var cam = this.camera;

        if (this._speedX > 0)
        {
            this._speedX -= this.dragX * delta;

            if (this._speedX < 0)
            {
                this._speedX = 0;
            }
        }
        else if (this._speedX < 0)
        {
            this._speedX += this.dragX * delta;

            if (this._speedX > 0)
            {
                this._speedX = 0;
            }
        }

        if (this._speedY > 0)
        {
            this._speedY -= this.dragY * delta;

            if (this._speedY < 0)
            {
                this._speedY = 0;
            }
        }
        else if (this._speedY < 0)
        {
            this._speedY += this.dragY * delta;

            if (this._speedY > 0)
            {
                this._speedY = 0;
            }
        }

        if (this.up && this.up.isDown)
        {
            this._speedY += this.accelY;

            if (this._speedY > this.maxSpeedY)
            {
                this._speedY = this.maxSpeedY;
            }
        }
        else if (this.down && this.down.isDown)
        {
            this._speedY -= this.accelY;

            if (this._speedY < -this.maxSpeedY)
            {
                this._speedY = -this.maxSpeedY;
            }
        }

        if (this.left && this.left.isDown)
        {
            this._speedX += this.accelX;

            if (this._speedX > this.maxSpeedX)
            {
                this._speedX = this.maxSpeedX;
            }
        }
        else if (this.right && this.right.isDown)
        {
            this._speedX -= this.accelX;

            if (this._speedX < -this.maxSpeedX)
            {
                this._speedX = -this.maxSpeedX;
            }
        }

        if (this.zoomIn && this.zoomIn.isDown)
        {
            this._zoom = -this.zoomSpeed;
        }
        else if (this.zoomOut && this.zoomOut.isDown)
        {
            this._zoom = this.zoomSpeed;
        }
        else
        {
            this._zoom = 0;
        }

        if (this._speedX !== 0)
        {
            cam.scrollX -= ((this._speedX * delta) | 0);
        }

        if (this._speedY !== 0)
        {
            cam.scrollY -= ((this._speedY * delta) | 0);
        }

        if (this._zoom !== 0)
        {
            cam.zoom += this._zoom;

            if (cam.zoom < this.minZoom)
            {
                cam.zoom = this.minZoom;
            }
            else if (cam.zoom > this.maxZoom)
            {
                cam.zoom = this.maxZoom;
            }
        }
    },

    destroy: function ()
    {
        this.camera = null;

        this.left = null;
        this.right = null;
        this.up = null;
        this.down = null;

        this.zoomIn = null;
        this.zoomOut = null;
    }

});

module.exports = SmoothedKeyControl;
