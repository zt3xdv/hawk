var ContainerCanvasRenderer = function (renderer, container, camera, parentMatrix)
{
    camera.addToRenderList(container);

    var children = container.list;

    if (children.length === 0)
    {
        return;
    }

    var transformMatrix = container.localTransform;

    if (parentMatrix)
    {
        transformMatrix.loadIdentity();
        transformMatrix.multiply(parentMatrix);
        transformMatrix.translate(container.x, container.y);
        transformMatrix.rotate(container.rotation);
        transformMatrix.scale(container.scaleX, container.scaleY);
    }
    else
    {
        transformMatrix.applyITRS(container.x, container.y, container.rotation, container.scaleX, container.scaleY);
    }

    var containerHasBlendMode = (container.blendMode !== -1);

    if (!containerHasBlendMode)
    {

        renderer.setBlendMode(0);
    }

    var alpha = container._alpha;
    var scrollFactorX = container.scrollFactorX;
    var scrollFactorY = container.scrollFactorY;

    if (container.mask)
    {
        container.mask.preRenderCanvas(renderer, null, camera);
    }

    for (var i = 0; i < children.length; i++)
    {
        var child = children[i];

        if (!child.willRender(camera))
        {
            continue;
        }

        var childAlpha = child.alpha;
        var childScrollFactorX = child.scrollFactorX;
        var childScrollFactorY = child.scrollFactorY;

        if (!containerHasBlendMode && child.blendMode !== renderer.currentBlendMode)
        {

            renderer.setBlendMode(child.blendMode);
        }

        child.setScrollFactor(childScrollFactorX * scrollFactorX, childScrollFactorY * scrollFactorY);
        child.setAlpha(childAlpha * alpha);

        child.renderCanvas(renderer, child, camera, transformMatrix);

        child.setAlpha(childAlpha);
        child.setScrollFactor(childScrollFactorX, childScrollFactorY);
    }

    if (container.mask)
    {
        container.mask.postRenderCanvas(renderer);
    }
};

module.exports = ContainerCanvasRenderer;
