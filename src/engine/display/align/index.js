var CONST = require('./const');
var Extend = require('../../utils/object/Extend');

var Align = {

    In: require('./in'),
    To: require('./to')

};

Align = Extend(false, Align, CONST);

module.exports = Align;
