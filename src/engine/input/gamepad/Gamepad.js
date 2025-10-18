var Axis = require('./Axis');
var Button = require('./Button');
var Class = require('../../utils/Class');
var EventEmitter = require('eventemitter3');
var Vector2 = require('../../math/Vector2');

var Gamepad = new Class({

    Extends: EventEmitter,

    initialize:

    function Gamepad (manager, pad)
    {
        EventEmitter.call(this);

        this.manager = manager;

        this.pad = pad;

        this.id = pad.id;

        this.index = pad.index;

        var buttons = [];

        for (var i = 0; i < pad.buttons.length; i++)
        {
            buttons.push(new Button(this, i));
        }

        this.buttons = buttons;

        var axes = [];

        for (i = 0; i < pad.axes.length; i++)
        {
            axes.push(new Axis(this, i));
        }

        this.axes = axes;

        this.vibration = pad.vibrationActuator;

        var _noButton = { value: 0, pressed: false };

        this._LCLeft = (buttons[14]) ? buttons[14] : _noButton;

        this._LCRight = (buttons[15]) ? buttons[15] : _noButton;

        this._LCTop = (buttons[12]) ? buttons[12] : _noButton;

        this._LCBottom = (buttons[13]) ? buttons[13] : _noButton;

        this._RCLeft = (buttons[2]) ? buttons[2] : _noButton;

        this._RCRight = (buttons[1]) ? buttons[1] : _noButton;

        this._RCTop = (buttons[3]) ? buttons[3] : _noButton;

        this._RCBottom = (buttons[0]) ? buttons[0] : _noButton;

        this._FBLeftTop = (buttons[4]) ? buttons[4] : _noButton;

        this._FBLeftBottom = (buttons[6]) ? buttons[6] : _noButton;

        this._FBRightTop = (buttons[5]) ? buttons[5] : _noButton;

        this._FBRightBottom = (buttons[7]) ? buttons[7] : _noButton;

        var _noAxis = { value: 0 };

        this._HAxisLeft = (axes[0]) ? axes[0] : _noAxis;

        this._VAxisLeft = (axes[1]) ? axes[1] : _noAxis;

        this._HAxisRight = (axes[2]) ? axes[2] : _noAxis;

        this._VAxisRight = (axes[3]) ? axes[3] : _noAxis;

        this.leftStick = new Vector2();

        this.rightStick = new Vector2();

        this._created = performance.now();
    },

    getAxisTotal: function ()
    {
        return this.axes.length;
    },

    getAxisValue: function (index)
    {
        return this.axes[index].getValue();
    },

    setAxisThreshold: function (value)
    {
        for (var i = 0; i < this.axes.length; i++)
        {
            this.axes[i].threshold = value;
        }
    },

    getButtonTotal: function ()
    {
        return this.buttons.length;
    },

    getButtonValue: function (index)
    {
        return this.buttons[index].value;
    },

    isButtonDown: function (index)
    {
        return this.buttons[index].pressed;
    },

    update: function (pad)
    {
        if (pad.timestamp < this._created)
        {
            return;
        }

        var i;

        var localButtons = this.buttons;
        var gamepadButtons = pad.buttons;

        var len = localButtons.length;

        for (i = 0; i < len; i++)
        {
            localButtons[i].update(gamepadButtons[i].value);
        }

        var localAxes = this.axes;
        var gamepadAxes = pad.axes;

        len = localAxes.length;

        for (i = 0; i < len; i++)
        {
            localAxes[i].update(gamepadAxes[i]);
        }

        if (len >= 2)
        {
            this.leftStick.set(localAxes[0].getValue(), localAxes[1].getValue());

            if (len >= 4)
            {
                this.rightStick.set(localAxes[2].getValue(), localAxes[3].getValue());
            }
        }
    },

    destroy: function ()
    {
        this.removeAllListeners();

        this.manager = null;
        this.pad = null;

        var i;

        for (i = 0; i < this.buttons.length; i++)
        {
            this.buttons[i].destroy();
        }

        for (i = 0; i < this.axes.length; i++)
        {
            this.axes[i].destroy();
        }

        this.buttons = [];
        this.axes = [];
    },

    connected: {

        get: function ()
        {
            return this.pad.connected;
        }

    },

    timestamp: {

        get: function ()
        {
            return this.pad.timestamp;
        }

    },

    left: {

        get: function ()
        {
            return this._LCLeft.pressed;
        }

    },

    right: {

        get: function ()
        {
            return this._LCRight.pressed;
        }

    },

    up: {

        get: function ()
        {
            return this._LCTop.pressed;
        }

    },

    down: {

        get: function ()
        {
            return this._LCBottom.pressed;
        }

    },

    A: {

        get: function ()
        {
            return this._RCBottom.pressed;
        }

    },

    Y: {

        get: function ()
        {
            return this._RCTop.pressed;
        }

    },

    X: {

        get: function ()
        {
            return this._RCLeft.pressed;
        }

    },

    B: {

        get: function ()
        {
            return this._RCRight.pressed;
        }

    },

    L1: {

        get: function ()
        {
            return this._FBLeftTop.value;
        }

    },

    L2: {

        get: function ()
        {
            return this._FBLeftBottom.value;
        }

    },

    R1: {

        get: function ()
        {
            return this._FBRightTop.value;
        }

    },

    R2: {

        get: function ()
        {
            return this._FBRightBottom.value;
        }

    }

});

module.exports = Gamepad;
