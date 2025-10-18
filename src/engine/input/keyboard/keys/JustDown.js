var JustDown = function (key)
{
    if (key._justDown)
    {
        key._justDown = false;

        return true;
    }
    else
    {
        return false;
    }
};

module.exports = JustDown;
