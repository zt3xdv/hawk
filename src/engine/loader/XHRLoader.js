

var MergeXHRSettings = require('./MergeXHRSettings');


var XHRLoader = function (file, globalXHRSettings)
{
    var config = MergeXHRSettings(globalXHRSettings, file.xhrSettings);

    if (file.base64)
    {
        var base64Data = file.url.split(';base64,').pop() || file.url.split(',').pop();

        var fakeXHR;

        if (file.xhrSettings.responseType === 'arraybuffer')
        {
            fakeXHR = {
                response: Uint8Array.from(atob(base64Data), function (c)
                {
                    return c.charCodeAt(0);
                }).buffer
            };
        }
        else
        {
            fakeXHR = {
                responseText: atob(base64Data)
            };
        }

        file.onBase64Load(fakeXHR);

        return;
    }

    var xhr = new XMLHttpRequest();

    xhr.open('GET', file.src, config.async, config.user, config.password);

    xhr.responseType = file.xhrSettings.responseType;
    xhr.timeout = config.timeout;

    if (config.headers)
    {
        for (var key in config.headers)
        {
            xhr.setRequestHeader(key, config.headers[key]);
        }
    }

    if (config.header && config.headerValue)
    {
        xhr.setRequestHeader(config.header, config.headerValue);
    }

    if (config.requestedWith)
    {
        xhr.setRequestHeader('X-Requested-With', config.requestedWith);
    }

    if (config.overrideMimeType)
    {
        xhr.overrideMimeType(config.overrideMimeType);
    }

    if (config.withCredentials)
    {
        xhr.withCredentials = true;
    }

    // After a successful request, the xhr.response property will contain the requested data as a DOMString, ArrayBuffer, Blob, or Document (depending on what was set for responseType.)

    xhr.onload = file.onLoad.bind(file, xhr);
    xhr.onerror = file.onError.bind(file, xhr);
    xhr.onprogress = file.onProgress.bind(file);
    xhr.ontimeout = file.onError.bind(file, xhr);

    //  This is the only standard method, the ones above are browser additions (maybe not universal?)
    // xhr.onreadystatechange

    xhr.send();

    return xhr;
};

module.exports = XHRLoader;
