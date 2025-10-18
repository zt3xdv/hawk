var AdvanceKeyCombo = require('./AdvanceKeyCombo');

var ProcessKeyCombo = function (event, combo)
{
    if (combo.matched)
    {
        return true;
    }

    var comboMatched = false;
    var keyMatched = false;

    if (event.keyCode === combo.current)
    {

        if (combo.index > 0 && combo.maxKeyDelay > 0)
        {

            var timeLimit = combo.timeLastMatched + combo.maxKeyDelay;

            if (event.timeStamp <= timeLimit)
            {
                keyMatched = true;
                comboMatched = AdvanceKeyCombo(event, combo);
            }
        }
        else
        {
            keyMatched = true;

            comboMatched = AdvanceKeyCombo(event, combo);
        }
    }

    if (!keyMatched && combo.resetOnWrongKey)
    {

        combo.index = 0;
        combo.current = combo.keyCodes[0];
    }

    if (comboMatched)
    {
        combo.timeLastMatched = event.timeStamp;
        combo.matched = true;
        combo.timeMatched = event.timeStamp;
    }

    return comboMatched;
};

module.exports = ProcessKeyCombo;
