var LayerWebGLRenderer = function (renderer, layer, camera)
{
    var children = layer.list;
    var childCount = children.length;

    if (childCount === 0)
    {
        return;
    }

    layer.depthSort();

    renderer.pipelines.preBatch(layer);

    var layerHasBlendMode = (layer.blendMode !== -1);

    if (!layerHasBlendMode)
    {

        renderer.setBlendMode(0);
    }

    var alpha = layer.alpha;

    for (var i = 0; i < childCount; i++)
    {
        var child = children[i];

        if (!child.willRender(camera))
        {
            continue;
        }

        var childAlphaTopLeft;
        var childAlphaTopRight;
        var childAlphaBottomLeft;
        var childAlphaBottomRight;

        if (child.alphaTopLeft !== undefined)
        {
            childAlphaTopLeft = child.alphaTopLeft;
            childAlphaTopRight = child.alphaTopRight;
            childAlphaBottomLeft = child.alphaBottomLeft;
            childAlphaBottomRight = child.alphaBottomRight;
        }
        else
        {
            var childAlpha = child.alpha;

            childAlphaTopLeft = childAlpha;
            childAlphaTopRight = childAlpha;
            childAlphaBottomLeft = childAlpha;
            childAlphaBottomRight = childAlpha;
        }

        if (!layerHasBlendMode && child.blendMode !== renderer.currentBlendMode)
        {

            renderer.setBlendMode(child.blendMode);
        }

        var mask = child.mask;

        if (mask)
        {
            mask.preRenderWebGL(renderer, child, camera);
        }

        var type = child.type;

        if (type !== renderer.currentType)
        {
            renderer.newType = true;
            renderer.currentType = type;
        }

        renderer.nextTypeMatch = (i < childCount - 1) ? (children[i + 1].type === renderer.currentType) : false;

        child.setAlpha(childAlphaTopLeft * alpha, childAlphaTopRight * alpha, childAlphaBottomLeft * alpha, childAlphaBottomRight * alpha);

        child.renderWebGL(renderer, child, camera);

        child.setAlpha(childAlphaTopLeft, childAlphaTopRight, childAlphaBottomLeft, childAlphaBottomRight);

        if (mask)
        {
            mask.postRenderWebGL(renderer, camera);
        }

        renderer.newType = false;
    }

    renderer.pipelines.postBatch(layer);
};

module.exports = LayerWebGLRenderer;
