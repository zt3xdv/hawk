var GetCollidesWith = require('../GetCollidesWith');

var Collision = {

    setCollisionCategory: function (category)
    {
        var target = (this.body) ? this.body : this;

        target.collisionCategory = category;

        return this;
    },

    willCollideWith: function (category)
    {
        var target = (this.body) ? this.body : this;

        return (target.collisionMask & category) !== 0;
    },

    addCollidesWith: function (category)
    {
        var target = (this.body) ? this.body : this;

        target.collisionMask = target.collisionMask | category;

        return this;
    },

    removeCollidesWith: function (category)
    {
        var target = (this.body) ? this.body : this;

        target.collisionMask = target.collisionMask & ~category;

        return this;
    },

    setCollidesWith: function (categories)
    {
        var target = (this.body) ? this.body : this;

        target.collisionMask = GetCollidesWith(categories);

        return this;
    },

    resetCollisionCategory: function ()
    {
        var target = (this.body) ? this.body : this;

        target.collisionCategory = 0x0001;
        target.collisionMask = 2147483647;

        return this;
    }

};

module.exports = Collision;
