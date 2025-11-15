var IsEven = function (value) {
  return value == parseFloat(value) ? !(value % 2) : void 0;
};
module.exports = IsEven;
