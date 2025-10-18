var VideoWebGLRenderer = function (renderer, src, camera, parentMatrix)
{
    if (src.videoTexture)
    {
        camera.addToRenderList(src);

        src.pipeline.batchSprite(src, camera, parentMatrix);
    }
};

module.exports = VideoWebGLRenderer;
