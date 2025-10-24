var RoundAwayFromZero = function (value) {
  return value > 0 ? Math.ceil(value) : Math.floor(value);
};
module.exports = RoundAwayFromZero;
