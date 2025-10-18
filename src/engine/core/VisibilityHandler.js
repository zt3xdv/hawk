var Events = require('./events');

var VisibilityHandler = function (game)
{
    var hiddenVar;
    var eventEmitter = game.events;

    if (document.hidden !== undefined)
    {
        hiddenVar = 'visibilitychange';
    }
    else
    {
        var vendors = [ 'webkit', 'moz', 'ms' ];

        vendors.forEach(function (prefix)
        {
            if (document[prefix + 'Hidden'] !== undefined)
            {
                document.hidden = function ()
                {
                    return document[prefix + 'Hidden'];
                };

                hiddenVar = prefix + 'visibilitychange';
            }

        });
    }

    var onChange = function (event)
    {
        if (document.hidden || event.type === 'pause')
        {
            eventEmitter.emit(Events.HIDDEN);
        }
        else
        {
            eventEmitter.emit(Events.VISIBLE);
        }
    };

    if (hiddenVar)
    {
        document.addEventListener(hiddenVar, onChange, false);
    }

    window.onblur = function ()
    {
        eventEmitter.emit(Events.BLUR);
    };

    window.onfocus = function ()
    {
        eventEmitter.emit(Events.FOCUS);
    };

    if (window.focus && game.config.autoFocus)
    {
        window.focus();
    }
};

module.exports = VisibilityHandler;
