var Class = require('../utils/Class');
var CONST = require('./const');
var Events = require('./events');
var GetFastValue = require('../utils/object/GetFastValue');
var GetURL = require('./GetURL');
var MergeXHRSettings = require('./MergeXHRSettings');
var XHRLoader = require('./XHRLoader');
var XHRSettings = require('./XHRSettings');
var File = new Class({
  initialize: function File(loader, fileConfig) {
    this.loader = loader;
    this.cache = GetFastValue(fileConfig, 'cache', false);
    this.type = GetFastValue(fileConfig, 'type', false);
    if (!this.type) {
      throw new Error('Invalid File type: ' + this.type);
    }
    this.key = GetFastValue(fileConfig, 'key', false);
    var loadKey = this.key;
    if (loader.prefix && loader.prefix !== '') {
      this.key = loader.prefix + loadKey;
    }
    if (!this.key) {
      throw new Error('Invalid File key: ' + this.key);
    }
    var url = GetFastValue(fileConfig, 'url');
    if (url === undefined) {
      url =
        loader.path + loadKey + '.' + GetFastValue(fileConfig, 'extension', '');
    } else if (
      typeof url === 'string' &&
      !url.match(/^(?:blob:|data:|capacitor:\/\/|http:\/\/|https:\/\/|\/\/)/)
    ) {
      url = loader.path + url;
    }
    this.url = url;
    this.src = '';
    this.xhrSettings = XHRSettings(
      GetFastValue(fileConfig, 'responseType', undefined),
    );
    if (GetFastValue(fileConfig, 'xhrSettings', false)) {
      this.xhrSettings = MergeXHRSettings(
        this.xhrSettings,
        GetFastValue(fileConfig, 'xhrSettings', {}),
      );
    }
    this.xhrLoader = null;
    this.state =
      typeof this.url === 'function'
        ? CONST.FILE_POPULATED
        : CONST.FILE_PENDING;
    this.bytesTotal = 0;
    this.bytesLoaded = -1;
    this.percentComplete = -1;
    this.crossOrigin = undefined;
    this.data = undefined;
    this.config = GetFastValue(fileConfig, 'config', {});
    this.multiFile;
    this.linkFile;
    this.base64 = typeof url === 'string' && url.indexOf('data:') === 0;
    this.retryAttempts = GetFastValue(
      fileConfig,
      'maxRetries',
      loader.maxRetries,
    );
  },
  setLink: function (fileB) {
    this.linkFile = fileB;
    fileB.linkFile = this;
  },
  resetXHR: function () {
    if (this.xhrLoader) {
      this.xhrLoader.onload = undefined;
      this.xhrLoader.onerror = undefined;
      this.xhrLoader.onprogress = undefined;
    }
  },
  load: function () {
    if (this.state === CONST.FILE_POPULATED) {
      this.loader.nextFile(this, true);
    } else {
      this.state = CONST.FILE_LOADING;
      this.src = GetURL(this, this.loader.baseURL);
      if (!this.src) {
        throw new Error(
          'URL Error in File: ' + this.key + ' from: ' + this.url,
        );
      }
      if (this.src.indexOf('data:') === 0) {
        this.base64 = true;
      }
      this.xhrLoader = XHRLoader(this, this.loader.xhr);
    }
  },
  onLoad: function (xhr, event) {
    var isLocalFile =
      xhr.responseURL &&
      this.loader.localSchemes.some(function (scheme) {
        return xhr.responseURL.indexOf(scheme) === 0;
      });
    var localFileOk = isLocalFile && event.target.status === 0;
    var success = !(event.target && event.target.status !== 200) || localFileOk;
    if (xhr.readyState === 4 && xhr.status >= 400 && xhr.status <= 599) {
      success = false;
    }
    this.state = CONST.FILE_LOADED;
    this.resetXHR();
    this.loader.nextFile(this, success);
  },
  onBase64Load: function (xhr) {
    this.xhrLoader = xhr;
    this.state = CONST.FILE_LOADED;
    this.percentComplete = 1;
    this.loader.emit(Events.FILE_PROGRESS, this, this.percentComplete);
    this.loader.nextFile(this, true);
  },
  onError: function () {
    this.resetXHR();
    if (this.retryAttempts > 0) {
      this.retryAttempts--;
      this.load();
    } else {
      this.loader.nextFile(this, false);
    }
  },
  onProgress: function (event) {
    if (event.lengthComputable) {
      this.bytesLoaded = event.loaded;
      this.bytesTotal = event.total;
      this.percentComplete = Math.min(this.bytesLoaded / this.bytesTotal, 1);
      this.loader.emit(Events.FILE_PROGRESS, this, this.percentComplete);
    }
  },
  onProcess: function () {
    this.state = CONST.FILE_PROCESSING;
    this.onProcessComplete();
  },
  onProcessComplete: function () {
    this.state = CONST.FILE_COMPLETE;
    if (this.multiFile) {
      this.multiFile.onFileComplete(this);
    }
    this.loader.fileProcessComplete(this);
  },
  onProcessError: function () {
    console.error('Failed to process file: %s "%s"', this.type, this.key);
    this.state = CONST.FILE_ERRORED;
    if (this.multiFile) {
      this.multiFile.onFileFailed(this);
    }
    this.loader.fileProcessComplete(this);
  },
  hasCacheConflict: function () {
    return this.cache && this.cache.exists(this.key);
  },
  addToCache: function () {
    if (this.cache && this.data) {
      this.cache.add(this.key, this.data);
    }
  },
  pendingDestroy: function (data) {
    if (this.state === CONST.FILE_PENDING_DESTROY) {
      return;
    }
    if (data === undefined) {
      data = this.data;
    }
    var key = this.key;
    var type = this.type;
    this.loader.emit(Events.FILE_COMPLETE, key, type, data);
    this.loader.emit(
      Events.FILE_KEY_COMPLETE + type + '-' + key,
      key,
      type,
      data,
    );
    this.loader.flagForRemoval(this);
    this.state = CONST.FILE_PENDING_DESTROY;
  },
  destroy: function () {
    this.loader = null;
    this.cache = null;
    this.xhrSettings = null;
    this.multiFile = null;
    this.linkFile = null;
    this.data = null;
  },
});
File.createObjectURL = function (image, blob, defaultType) {
  if (typeof URL === 'function') {
    image.src = URL.createObjectURL(blob);
  } else {
    var reader = new FileReader();
    reader.onload = function () {
      image.removeAttribute('crossOrigin');
      image.src =
        'data:' +
        (blob.type || defaultType) +
        ';base64,' +
        reader.result.split(',')[1];
    };
    reader.onerror = image.onerror;
    reader.readAsDataURL(blob);
  }
};
File.revokeObjectURL = function (image) {
  if (typeof URL === 'function') {
    URL.revokeObjectURL(image.src);
  }
};
module.exports = File;
