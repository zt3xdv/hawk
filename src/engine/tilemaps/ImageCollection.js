var Class = require('../utils/Class');

var ImageCollection = new Class({

    initialize:

    function ImageCollection (name, firstgid, width, height, margin, spacing, properties)
    {
        if (width === undefined || width <= 0) { width = 32; }
        if (height === undefined || height <= 0) { height = 32; }
        if (margin === undefined) { margin = 0; }
        if (spacing === undefined) { spacing = 0; }

        this.name = name;

        this.firstgid = firstgid | 0;

        this.imageWidth = width | 0;

        this.imageHeight = height | 0;

        this.imageMargin = margin | 0;

        this.imageSpacing = spacing | 0;

        this.properties = properties || {};

        this.images = [];

        this.total = 0;
    },

    containsImageIndex: function (imageIndex)
    {
        return (imageIndex >= this.firstgid && imageIndex < (this.firstgid + this.total));
    },

    addImage: function (gid, image, width, height)
    {
        this.images.push({ gid: gid, image: image, width: width, height: height });
        this.total++;

        return this;
    }

});

module.exports = ImageCollection;
