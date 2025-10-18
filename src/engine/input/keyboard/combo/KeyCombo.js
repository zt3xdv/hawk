var Class = require('../../../utils/Class');
var Events = require('../events');
var GetFastValue = require('../../../utils/object/GetFastValue');
var ProcessKeyCombo = require('./ProcessKeyCombo');
var ResetKeyCombo = require('./ResetKeyCombo');

var KeyCombo = new Class({

    initialize:

    function KeyCombo (keyboardPlugin, keys, config)
    {
        if (config === undefined) { config = {}; }

        if (keys.length < 2)
        {
            return false;
        }

        this.manager = keyboardPlugin;

        this.enabled = true;

        this.keyCodes = [];

        for (var i = 0; i < keys.length; i++)
        {
            var char = keys[i];

            if (typeof char === 'string')
            {
                this.keyCodes.push(char.toUpperCase().charCodeAt(0));
            }
            else if (typeof char === 'number')
            {
                this.keyCodes.push(char);
            }
            else if (char.hasOwnProperty('keyCode'))
            {
                this.keyCodes.push(char.keyCode);
            }
        }

        this.current = this.keyCodes[0];

        this.index = 0;

        this.size = this.keyCodes.length;

        this.timeLastMatched = 0;

        this.matched = false;

        this.timeMatched = 0;

        this.resetOnWrongKey = GetFastValue(config, 'resetOnWrongKey', true);

        this.maxKeyDelay = GetFastValue(config, 'maxKeyDelay', 0);

        this.resetOnMatch = GetFastValue(config, 'resetOnMatch', false);

        this.deleteOnMatch = GetFastValue(config, 'deleteOnMatch', false);

        var _this = this;

        var onKeyDownHandler = function (event)
        {
            if (_this.matched || !_this.enabled)
            {
                return;
            }

            var matched = ProcessKeyCombo(event, _this);

            if (matched)
            {
                _this.manager.emit(Events.COMBO_MATCH, _this, event);

                if (_this.resetOnMatch)
                {
                    ResetKeyCombo(_this);
                }
                else if (_this.deleteOnMatch)
                {
                    _this.destroy();
                }
            }
        };

        this.onKeyDown = onKeyDownHandler;

        this.manager.on(Events.ANY_KEY_DOWN, this.onKeyDown);
    },

    progress: {

        get: function ()
        {
            return this.index / this.size;
        }

    },

    destroy: function ()
    {
        this.enabled = false;
        this.keyCodes = [];

        this.manager.off(Events.ANY_KEY_DOWN, this.onKeyDown);

        this.manager = null;
    }

});

module.exports = KeyCombo;
