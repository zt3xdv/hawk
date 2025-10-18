var VideoCanvasRenderer = function (renderer, src, camera, parentMatrix)
{
    if (src.videoTexture)
    {
        camera.addToRenderList(src);

        renderer.batchSprite(src, src.frame, camera, parentMatrix);
    }
};

module.exports = VideoCanvasRenderer;
