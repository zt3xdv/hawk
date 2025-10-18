var Class = require('../utils/Class');
var CONST = require('../const');
var DefaultPlugins = require('../plugins/DefaultPlugins');
var Device = require('../device');
var GetFastValue = require('../utils/object/GetFastValue');
var GetValue = require('../utils/object/GetValue');
var IsPlainObject = require('../utils/object/IsPlainObject');
var NOOP = require('../utils/NOOP');
var HawkMath = require('../math/');
var PIPELINE_CONST = require('../renderer/webgl/pipelines/const');
var ValueToColor = require('../display/color/ValueToColor');

var Config = new Class({

    initialize:

    function Config (config)
    {
        if (config === undefined) { config = {}; }

        var defaultBannerColor = [
            '#ff0000',
            '#ffff00',
            '#00ff00',
            '#00ffff',
            '#000000'
        ];

        var defaultBannerTextColor = '#ffffff';

        var scaleConfig = GetValue(config, 'scale', null);

        this.width = GetValue(scaleConfig, 'width', 1024, config);

        this.height = GetValue(scaleConfig, 'height', 768, config);

        this.zoom = GetValue(scaleConfig, 'zoom', 1, config);

        this.parent = GetValue(scaleConfig, 'parent', undefined, config);

        this.scaleMode = GetValue(scaleConfig, (scaleConfig) ? 'mode' : 'scaleMode', 0, config);

        this.expandParent = GetValue(scaleConfig, 'expandParent', true, config);

        this.autoRound = GetValue(scaleConfig, 'autoRound', false, config);

        this.autoCenter = GetValue(scaleConfig, 'autoCenter', 0, config);

        this.resizeInterval = GetValue(scaleConfig, 'resizeInterval', 500, config);

        this.fullscreenTarget = GetValue(scaleConfig, 'fullscreenTarget', null, config);

        this.minWidth = GetValue(scaleConfig, 'min.width', 0, config);

        this.maxWidth = GetValue(scaleConfig, 'max.width', 0, config);

        this.minHeight = GetValue(scaleConfig, 'min.height', 0, config);

        this.maxHeight = GetValue(scaleConfig, 'max.height', 0, config);

        this.snapWidth = GetValue(scaleConfig, 'snap.width', 0, config);

        this.snapHeight = GetValue(scaleConfig, 'snap.height', 0, config);

        this.renderType = CONST.WEBGL;

        this.canvas = GetValue(config, 'canvas', null);

        this.context = GetValue(config, 'context', null);

        this.canvasStyle = GetValue(config, 'canvasStyle', null);

        this.customEnvironment = GetValue(config, 'customEnvironment', false);

        this.sceneConfig = GetValue(config, 'scene', null);

        this.seed = GetValue(config, 'seed', [ (Date.now() * Math.random()).toString() ]);

        HawkMath.RND = new HawkMath.RandomDataGenerator(this.seed);

        this.gameTitle = GetValue(config, 'title', '');

        this.gameURL = GetValue(config, 'url', '');

        this.gameVersion = GetValue(config, 'version', '');

        this.autoFocus = GetValue(config, 'autoFocus', true);

        this.stableSort = GetValue(config, 'stableSort', -1);

        if (this.stableSort === -1)
        {
            this.stableSort = (Device.browser.es2019) ? 1 : 0;
        }

        Device.features.stableSort = this.stableSort;

        this.domCreateContainer = GetValue(config, 'dom.createContainer', false);

        this.domPointerEvents = GetValue(config, 'dom.pointerEvents', 'none');

        this.inputKeyboard = GetValue(config, 'input.keyboard', true);

        this.inputKeyboardEventTarget = GetValue(config, 'input.keyboard.target', window);

        this.inputKeyboardCapture = GetValue(config, 'input.keyboard.capture', []);

        this.inputMouse = GetValue(config, 'input.mouse', true);

        this.inputMouseEventTarget = GetValue(config, 'input.mouse.target', null);

        this.inputMousePreventDefaultDown = GetValue(config, 'input.mouse.preventDefaultDown', true);

        this.inputMousePreventDefaultUp = GetValue(config, 'input.mouse.preventDefaultUp', true);

        this.inputMousePreventDefaultMove = GetValue(config, 'input.mouse.preventDefaultMove', true);

        this.inputMousePreventDefaultWheel = GetValue(config, 'input.mouse.preventDefaultWheel', true);

        this.inputTouch = GetValue(config, 'input.touch', Device.input.touch);

        this.inputTouchEventTarget = GetValue(config, 'input.touch.target', null);

        this.inputTouchCapture = GetValue(config, 'input.touch.capture', true);

        this.inputActivePointers = GetValue(config, 'input.activePointers', 1);

        this.inputSmoothFactor = GetValue(config, 'input.smoothFactor', 0);

        this.inputWindowEvents = GetValue(config, 'input.windowEvents', true);

        this.inputGamepad = GetValue(config, 'input.gamepad', false);

        this.inputGamepadEventTarget = GetValue(config, 'input.gamepad.target', window);

        this.disableContextMenu = GetValue(config, 'disableContextMenu', false);

        this.audio = GetValue(config, 'audio', {});

        this.bannerTextColor = GetValue(config, 'banner.text', defaultBannerTextColor);

        this.bannerBackgroundColor = GetValue(config, 'banner.background', defaultBannerColor);

        this.fps = GetValue(config, 'fps', null);

        this.disablePreFX = GetValue(config, 'disablePreFX', false);

        this.disablePostFX = GetValue(config, 'disablePostFX', false);

        var renderConfig = GetValue(config, 'render', null);

        this.pipeline = GetValue(renderConfig, 'pipeline', null, config);

        this.autoMobilePipeline = GetValue(renderConfig, 'autoMobilePipeline', true, config);

        this.defaultPipeline = GetValue(renderConfig, 'defaultPipeline', PIPELINE_CONST.MULTI_PIPELINE, config);

        this.antialias = GetValue(renderConfig, 'antialias', true, config);

        this.antialiasGL = GetValue(renderConfig, 'antialiasGL', true, config);

        this.mipmapFilter = GetValue(renderConfig, 'mipmapFilter', '', config);

        this.desynchronized = GetValue(renderConfig, 'desynchronized', false, config);

        this.roundPixels = GetValue(renderConfig, 'roundPixels', false, config);

        this.pixelArt = GetValue(renderConfig, 'pixelArt', this.zoom !== 1, config);

        if (this.pixelArt)
        {
            this.antialias = false;
            this.antialiasGL = false;
            this.roundPixels = true;
        }

        this.transparent = GetValue(renderConfig, 'transparent', false, config);

        this.clearBeforeRender = GetValue(renderConfig, 'clearBeforeRender', true, config);

        this.preserveDrawingBuffer = GetValue(renderConfig, 'preserveDrawingBuffer', false, config);

        this.premultipliedAlpha = GetValue(renderConfig, 'premultipliedAlpha', true, config);

        this.failIfMajorPerformanceCaveat = GetValue(renderConfig, 'failIfMajorPerformanceCaveat', false, config);

        this.powerPreference = GetValue(renderConfig, 'powerPreference', 'default', config);

        this.batchSize = GetValue(renderConfig, 'batchSize', 4096, config);

        this.maxTextures = GetValue(renderConfig, 'maxTextures', -1, config);

        this.maxLights = GetValue(renderConfig, 'maxLights', 10, config);

        var bgc = GetValue(config, 'backgroundColor', 0);

        this.backgroundColor = ValueToColor(bgc);

        if (this.transparent)
        {
            this.backgroundColor = ValueToColor(0x000000);
            this.backgroundColor.alpha = 0;
        }

        this.preBoot = GetValue(config, 'callbacks.preBoot', NOOP);

        this.postBoot = GetValue(config, 'callbacks.postBoot', NOOP);

        this.physics = GetValue(config, 'physics', {});

        this.defaultPhysicsSystem = GetValue(this.physics, 'default', false);

        this.loaderBaseURL = GetValue(config, 'loader.baseURL', '');

        this.loaderPath = GetValue(config, 'loader.path', '');

        this.loaderMaxParallelDownloads = GetValue(config, 'loader.maxParallelDownloads', (Device.os.android) ? 6 : 32);

        this.loaderCrossOrigin = GetValue(config, 'loader.crossOrigin', undefined);

        this.loaderResponseType = GetValue(config, 'loader.responseType', '');

        this.loaderAsync = GetValue(config, 'loader.async', true);

        this.loaderUser = GetValue(config, 'loader.user', '');

        this.loaderPassword = GetValue(config, 'loader.password', '');

        this.loaderTimeout = GetValue(config, 'loader.timeout', 0);

        this.loaderMaxRetries = GetValue(config, 'loader.maxRetries', 2);

        this.loaderWithCredentials = GetValue(config, 'loader.withCredentials', false);

        this.loaderImageLoadType = GetValue(config, 'loader.imageLoadType', 'XHR');

        this.loaderLocalScheme = GetValue(config, 'loader.localScheme', [ 'file://', 'capacitor://' ]);

        this.glowFXQuality = GetValue(config, 'fx.glow.quality', 0.1);

        this.glowFXDistance = GetValue(config, 'fx.glow.distance', 10);

        this.installGlobalPlugins = [];

        this.installScenePlugins = [];

        var plugins = GetValue(config, 'plugins', null);
        var defaultPlugins = DefaultPlugins.DefaultScene;

        if (plugins)
        {

            if (Array.isArray(plugins))
            {
                this.defaultPlugins = plugins;
            }
            else if (IsPlainObject(plugins))
            {
                this.installGlobalPlugins = GetFastValue(plugins, 'global', []);
                this.installScenePlugins = GetFastValue(plugins, 'scene', []);

                if (Array.isArray(plugins.default))
                {
                    defaultPlugins = plugins.default;
                }
                else if (Array.isArray(plugins.defaultMerge))
                {
                    defaultPlugins = defaultPlugins.concat(plugins.defaultMerge);
                }
            }
        }

        this.defaultPlugins = defaultPlugins;

        var pngPrefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAg';
        this.defaultImage = GetValue(config, 'images.default', pngPrefix + 'AQMAAABJtOi3AAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAABVJREFUeF7NwIEAAAAAgKD9qdeocAMAoAABm3DkcAAAAABJRU5ErkJggg==');
        this.missingImage = GetValue(config, 'images.missing', pngPrefix + 'CAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJ9JREFUeNq01ssOwyAMRFG46v//Mt1ESmgh+DFmE2GPOBARKb2NVjo+17PXLD8a1+pl5+A+wSgFygymWYHBb0FtsKhJDdZlncG2IzJ4ayoMDv20wTmSMzClEgbWYNTAkQ0Z+OJ+A/eWnAaR9+oxCF4Os0H8htsMUp+pwcgBBiMNnAwF8GqIgL2hAzaGFFgZauDPKABmowZ4GL369/0rwACp2yA/ttmvsQAAAABJRU5ErkJggg==');
        this.whiteImage = GetValue(config, 'images.white', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABdJREFUeNpi/P//PwMMMDEgAdwcgAADAJZuAwXJYZOzAAAAAElFTkSuQmCC');
    }

});

module.exports = Config;
