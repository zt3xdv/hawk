import Collection from './collection.js';
import Super from './super.js';
import * as u from './utils.js';





function Manager (options) {
    var self = this;
    self.ids = {};
    self.index = 0;
    self.collections = [];
    self.scroll = u.getScroll();

    self.config(options);
    self.prepareCollections();

    
    var resizeHandler = function () {
        var pos;
        self.collections.forEach(function (collection) {
            collection.forEach(function (nipple) {
                pos = nipple.el.getBoundingClientRect();
                nipple.position = {
                    x: self.scroll.x + pos.left,
                    y: self.scroll.y + pos.top
                };
            });
        });
    };
    u.bindEvt(window, 'resize', function () {
        u.throttle(resizeHandler);
    });

    
    
    var scrollHandler = function () {
        self.scroll = u.getScroll();
    };
    u.bindEvt(window, 'scroll', function () {
        u.throttle(scrollHandler);
    });

    return self.collections;
}

Manager.prototype = new Super();
Manager.constructor = Manager;

Manager.prototype.prepareCollections = function () {
    var self = this;
    
    self.collections.create = self.create.bind(self);
    
    self.collections.on = self.on.bind(self);
    
    self.collections.off = self.off.bind(self);
    
    self.collections.destroy = self.destroy.bind(self);
    
    self.collections.get = function (id) {
        var nipple;
        
        self.collections.every(function (collection) {
            nipple = collection.get(id);
            return nipple ? false : true;
        });
        return nipple;
    };
};

Manager.prototype.create = function (options) {
    return this.createCollection(options);
};


Manager.prototype.createCollection = function (options) {
    var self = this;
    var collection = new Collection(self, options);

    self.bindCollection(collection);
    self.collections.push(collection);

    return collection;
};

Manager.prototype.bindCollection = function (collection) {
    var self = this;
    var type;
    
    var handler = function (evt, data) {
        
        type = evt.type + ' ' + data.id + ':' + evt.type;
        self.trigger(type, data);
    };

    
    collection.on('destroyed', self.onDestroyed.bind(self));

    
    collection.on('shown hidden rested dir plain', handler);
    collection.on('dir:up dir:right dir:down dir:left', handler);
    collection.on('plain:up plain:right plain:down plain:left', handler);
};

Manager.prototype.bindDocument = function () {
    var self = this;
    
    if (!self.binded) {
        self.bindEvt(document, 'move')
            .bindEvt(document, 'end');
        self.binded = true;
    }
};

Manager.prototype.unbindDocument = function (force) {
    var self = this;
    
    
    if (!Object.keys(self.ids).length || force === true) {
        self.unbindEvt(document, 'move')
            .unbindEvt(document, 'end');
        self.binded = false;
    }
};

Manager.prototype.getIdentifier = function (evt) {
    var id;
    
    if (!evt) {
        id = this.index;
    } else {
        
        
        id = evt.identifier === undefined ? evt.pointerId : evt.identifier;
        if (id === undefined) {
            id = this.latest || 0;
        }
    }

    if (this.ids[id] === undefined) {
        this.ids[id] = this.index;
        this.index += 1;
    }

    
    this.latest = id;
    return this.ids[id];
};

Manager.prototype.removeIdentifier = function (identifier) {
    var removed = {};
    for (var id in this.ids) {
        if (this.ids[id] === identifier) {
            removed.id = id;
            removed.identifier = this.ids[id];
            delete this.ids[id];
            break;
        }
    }
    return removed;
};

Manager.prototype.onmove = function (evt) {
    var self = this;
    self.onAny('move', evt);
    return false;
};

Manager.prototype.onend = function (evt) {
    var self = this;
    self.onAny('end', evt);
    return false;
};

Manager.prototype.oncancel = function (evt) {
    var self = this;
    self.onAny('end', evt);
    return false;
};

Manager.prototype.onAny = function (which, evt) {
    var self = this;
    var id;
    var processFn = 'processOn' + which.charAt(0).toUpperCase() +
        which.slice(1);
    evt = u.prepareEvent(evt);
    var processColl = function (e, id, coll) {
        if (coll.ids.indexOf(id) >= 0) {
            coll[processFn](e);
            
            e._found_ = true;
        }
    };
    var processEvt = function (e) {
        id = self.getIdentifier(e);
        u.map(self.collections, processColl.bind(null, e, id));
        
        
        if (!e._found_) {
            self.removeIdentifier(id);
        }
    };

    u.map(evt, processEvt);

    return false;
};


Manager.prototype.destroy = function () {
    var self = this;
    self.unbindDocument(true);
    self.ids = {};
    self.index = 0;
    self.collections.forEach(function(collection) {
        collection.destroy();
    });
    self.off();
};



Manager.prototype.onDestroyed = function (evt, coll) {
    var self = this;
    if (self.collections.indexOf(coll) < 0) {
        return false;
    }
    self.collections.splice(self.collections.indexOf(coll), 1);
};

export default Manager;
