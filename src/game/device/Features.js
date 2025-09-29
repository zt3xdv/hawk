

import OS from "./OS.js";
import Browser from "./Browser.js";

var Features = {

    canvas: false,
    canvasBitBltShift: null,
    file: false,
    fileSystem: false,
    getUserMedia: true,
    littleEndian: false,
    localStorage: false,
    pointerLock: false,
    stableSort: false,
    support32bit: false,
    vibration: false,
    webGL: false,
    worker: false

};



function checkIsLittleEndian ()
{
    var a = new ArrayBuffer(4);
    var b = new Uint8Array(a);
    var c = new Uint32Array(a);

    b[0] = 0xa1;
    b[1] = 0xb2;
    b[2] = 0xc3;
    b[3] = 0xd4;

    if (c[0] === 0xd4c3b2a1)
    {
        return true;
    }

    if (c[0] === 0xa1b2c3d4)
    {
        return false;
    }
    else
    {
        
        return null;
    }
}

export default function init ()
{
    if (typeof importScripts === 'function')
    {
        return Features;
    }

    Features.canvas = !!window['CanvasRenderingContext2D'];

    try
    {
        Features.localStorage = !!localStorage.getItem;
    }
    catch (error)
    {
        Features.localStorage = false;
    }

    Features.file = !!window['File'] && !!window['FileReader'] && !!window['FileList'] && !!window['Blob'];
    Features.fileSystem = !!window['requestFileSystem'];

    var isUint8 = false;

    var testWebGL = function ()
    {
        if (window['WebGLRenderingContext'])
        {
            try
            {
                var canvas = document.createElement("canvas");

                var ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

                var canvas2D = document.createElement("canvas");

                var ctx2D = canvas2D.getContext('2d', { willReadFrequently: true });

                
                var image = ctx2D.createImageData(1, 1);

                
                
                isUint8 = image.data instanceof Uint8ClampedArray;

                return !!ctx;
            }
            catch (e)
            {
                return false;
            }
        }

        return false;
    };

    Features.webGL = testWebGL();

    Features.worker = !!window['Worker'];

    Features.pointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    Features.getUserMedia = Features.getUserMedia && !!navigator.getUserMedia && !!window.URL;

    
    if (Browser().firefox && Browser().firefoxVersion < 21)
    {
        Features.getUserMedia = false;
    }

    
    
    if (!OS().iOS && (Browser().ie || Browser().firefox || Browser().chrome))
    {
        Features.canvasBitBltShift = true;
    }

    
    if (Browser().safari || Browser().mobileSafari)
    {
        Features.canvasBitBltShift = false;
    }

    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

    if (navigator.vibrate)
    {
        Features.vibration = true;
    }

    if (typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined' && typeof Uint32Array !== 'undefined')
    {
        Features.littleEndian = checkIsLittleEndian();
    }

    Features.support32bit = (
        typeof ArrayBuffer !== 'undefined' &&
        typeof Uint8ClampedArray !== 'undefined' &&
        typeof Int32Array !== 'undefined' &&
        Features.littleEndian !== null &&
        isUint8
    );

    return Features;
}
