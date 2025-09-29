import OS from "./OS.js";

var Browser = {

    chrome: false,
    chromeVersion: 0,
    edge: false,
    firefox: false,
    firefoxVersion: 0,
    ie: false,
    ieVersion: 0,
    mobileSafari: false,
    opera: false,
    safari: false,
    safariVersion: 0,
    silk: false,
    trident: false,
    tridentVersion: 0,
    es2019: false

};

export default function init ()
{
    var ua = navigator.userAgent;

    if ((/Edg\/\d+/).test(ua))
    {
        Browser.edge = true;
        Browser.es2019 = true;
    }
    else if ((/OPR/).test(ua))
    {
        Browser.opera = true;
        Browser.es2019 = true;
    }
    else if ((/Chrome\/(\d+)/).test(ua) && !OS().windowsPhone)
    {
        Browser.chrome = true;
        Browser.chromeVersion = parseInt(RegExp.$1, 10);
        Browser.es2019 = (Browser.chromeVersion > 69);
    }
    else if ((/Firefox\D+(\d+)/).test(ua))
    {
        Browser.firefox = true;
        Browser.firefoxVersion = parseInt(RegExp.$1, 10);
        Browser.es2019 = (Browser.firefoxVersion > 10);
    }
    else if ((/AppleWebKit\/(?!.*CriOS)/).test(ua) && OS().iOS)
    {
        Browser.mobileSafari = true;
        Browser.es2019 = true;
    }
    else if ((/MSIE (\d+\.\d+);/).test(ua))
    {
        Browser.ie = true;
        Browser.ieVersion = parseInt(RegExp.$1, 10);
    }
    else if ((/Version\/(\d+\.\d+(\.\d+)?) Safari/).test(ua) && !OS().windowsPhone)
    {
        Browser.safari = true;
        Browser.safariVersion = parseInt(RegExp.$1, 10);
        Browser.es2019 = (Browser.safariVersion > 10);
    }
    else if ((/Trident\/(\d+\.\d+)(.*)rv:(\d+\.\d+)/).test(ua))
    {
        Browser.ie = true;
        Browser.trident = true;
        Browser.tridentVersion = parseInt(RegExp.$1, 10);
        Browser.ieVersion = parseInt(RegExp.$3, 10);
    }

    
    if ((/Silk/).test(ua))
    {
        Browser.silk = true;
    }

    return Browser;
}
