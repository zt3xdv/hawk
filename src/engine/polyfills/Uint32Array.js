if (
  typeof window.Uint32Array !== 'function' &&
  typeof window.Uint32Array !== 'object'
) {
  var CheapArray = function (fakeType) {
    var proto = new Array();
    window[fakeType] = function (arg) {
      if (typeof arg === 'number') {
        Array.call(this, arg);
        this.length = arg;
        for (var i = 0; i < this.length; i++) {
          this[i] = 0;
        }
      } else {
        Array.call(this, arg.length);
        this.length = arg.length;
        for (var i = 0; i < this.length; i++) {
          this[i] = arg[i];
        }
      }
    };
    window[fakeType].prototype = proto;
    window[fakeType].constructor = window[fakeType];
  };
  CheapArray('Float32Array');
  CheapArray('Uint32Array');
  CheapArray('Uint16Array');
  CheapArray('Int16Array');
  CheapArray('ArrayBuffer');
  CheapArray('Int8Array');
  CheapArray('Uint8Array');
}
