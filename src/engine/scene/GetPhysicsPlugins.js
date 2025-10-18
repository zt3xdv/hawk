var GetFastValue = require('../utils/object/GetFastValue');
var UppercaseFirst = require('../utils/string/UppercaseFirst');

var GetPhysicsPlugins = function (sys)
{
    var defaultSystem = sys.game.config.defaultPhysicsSystem;
    var sceneSystems = GetFastValue(sys.settings, 'physics', false);

    if (!defaultSystem && !sceneSystems)
    {

        return;
    }

    var output = [];

    if (defaultSystem)
    {
        output.push(UppercaseFirst(defaultSystem + 'Physics'));
    }

    if (sceneSystems)
    {
        for (var key in sceneSystems)
        {
            key = UppercaseFirst(key.concat('Physics'));

            if (output.indexOf(key) === -1)
            {
                output.push(key);
            }
        }
    }

    return output;
};

module.exports = GetPhysicsPlugins;
