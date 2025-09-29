import Nipple from './nipple.js';
import Super from './super.js';
import * as u from './utils.js';





function Collection (manager, options) {
    var self = this;
    self.nipples = [];
    self.idles = [];
    self.actives = [];
    self.ids = [];
    self.pressureIntervals = {};
    self.manager = manager;
    self.id = Collection.id;
    Collection.id += 1;

    
    self.defaults = {
        zone: document.body,
        multitouch: false,
        maxNumberOfNipples: 10,
        mode: 'dynamic',
        position: {top: 0, left: 0},
        catchDistance: 200,
        size: 100,
        threshold: 0.1,
        color: 'white',
        fadeTime: 250,
        dataOnly: false,
        restJoystick: true,
        restOpacity: 0.5,
        lockX: false,
        lockY: false,
        shape: 'circle',
        dynamicPage: false,
        follow: false
    };

    self.config(options);

    
    if (self.options.mode === 'static' || self.options.mode === 'semi') {
        self.options.multitouch = false;
    }

    if (!self.options.multitouch) {
        self.options.maxNumberOfNipples = 1;
    }
    const computedStyle = getComputedStyle(self.options.zone.parentElement);
    if (computedStyle && computedStyle.display === 'flex') {
        self.parentIsFlex = true;
    }

    self.updateBox();
    self.prepareNipples();
    self.bindings();
    self.begin();

    return self.nipples;
}

Collection.prototype = new Super();
Collection.constructor = Collection;
Collection.id = 0;

Collection.prototype.prepareNipples = function () {
    var self = this;
    var nips = self.nipples;

    
    nips.on = self.on.bind(self);
    nips.off = self.off.bind(self);
    nips.options = self.options;
    nips.destroy = self.destroy.bind(self);
    nips.ids = self.ids;
    nips.id = self.id;
    nips.processOnMove = self.processOnMove.bind(self);
    nips.processOnEnd = self.processOnEnd.bind(self);
    nips.get = function (id) {
        if (id === undefined) {
            return nips[0];
        }
        for (var i = 0, max = nips.length; i < max; i += 1) {
            if (nips[i].identifier === id) {
                return nips[i];
            }
        }
        return false;
    };
};

Collection.prototype.bindings = function () {
    var self = this;
    
    self.bindEvt(self.options.zone, 'start');
    
    self.options.zone.style.touchAction = 'none';
    self.options.zone.style.msTouchAction = 'none';
};

Collection.prototype.begin = function () {
    var self = this;
    var opts = self.options;

    
    
    if (opts.mode === 'static') {
        var nipple = self.createNipple(
            opts.position,
            self.manager.getIdentifier()
        );
        
        nipple.add();
        
        self.idles.push(nipple);
    }
};


Collection.prototype.createNipple = function (position, identifier) {
    var self = this;
    var scroll = self.manager.scroll;
    var toPutOn = {};
    var opts = self.options;
    var offset = {
        x: self.parentIsFlex ? scroll.x : (scroll.x + self.box.left),
        y: self.parentIsFlex ? scroll.y : (scroll.y + self.box.top)
    };

    if (position.x && position.y) {
        toPutOn = {
            x: position.x - offset.x,
            y: position.y - offset.y
        };
    } else if (
        position.top ||
        position.right ||
        position.bottom ||
        position.left
    ) {

        
        var dumb = document.createElement('DIV');
        dumb.style.display = 'hidden';
        dumb.style.top = position.top;
        dumb.style.right = position.right;
        dumb.style.bottom = position.bottom;
        dumb.style.left = position.left;
        dumb.style.position = 'absolute';

        opts.zone.appendChild(dumb);
        var dumbBox = dumb.getBoundingClientRect();
        opts.zone.removeChild(dumb);

        toPutOn = position;
        position = {
            x: dumbBox.left + scroll.x,
            y: dumbBox.top + scroll.y
        };
    }

    var nipple = new Nipple(self, {
        color: opts.color,
        size: opts.size,
        threshold: opts.threshold,
        fadeTime: opts.fadeTime,
        dataOnly: opts.dataOnly,
        restJoystick: opts.restJoystick,
        restOpacity: opts.restOpacity,
        mode: opts.mode,
        identifier: identifier,
        position: position,
        zone: opts.zone,
        frontPosition: {
            x: 0,
            y: 0
        },
        shape: opts.shape
    });

    if (!opts.dataOnly) {
        u.applyPosition(nipple.ui.el, toPutOn);
        u.applyPosition(nipple.ui.front, nipple.frontPosition);
    }
    self.nipples.push(nipple);
    self.trigger('added ' + nipple.identifier + ':added', nipple);
    self.manager.trigger('added ' + nipple.identifier + ':added', nipple);

    self.bindNipple(nipple);

    return nipple;
};

Collection.prototype.updateBox = function () {
    var self = this;
    self.box = self.options.zone.getBoundingClientRect();
};

Collection.prototype.bindNipple = function (nipple) {
    var self = this;
    var type;
    
    var handler = function (evt, data) {
        
        type = evt.type + ' ' + data.id + ':' + evt.type;
        self.trigger(type, data);
    };

    
    nipple.on('destroyed', self.onDestroyed.bind(self));

    
    nipple.on('shown hidden rested dir plain', handler);
    nipple.on('dir:up dir:right dir:down dir:left', handler);
    nipple.on('plain:up plain:right plain:down plain:left', handler);
};

Collection.prototype.pressureFn = function (touch, nipple, identifier) {
    var self = this;
    var previousPressure = 0;
    clearInterval(self.pressureIntervals[identifier]);
    
    self.pressureIntervals[identifier] = setInterval(function () {
        var pressure = touch.force || touch.pressure ||
            touch.webkitForce || 0;
        if (pressure !== previousPressure) {
            nipple.trigger('pressure', pressure);
            self.trigger('pressure ' +
                nipple.identifier + ':pressure', pressure);
            previousPressure = pressure;
        }
    }.bind(self), 100);
};

Collection.prototype.onstart = function (evt) {
    var self = this;
    var opts = self.options;
    var origEvt = evt;
    evt = u.prepareEvent(evt);

    
    self.updateBox();

    var process = function (touch) {
        
        
        if (self.actives.length < opts.maxNumberOfNipples) {
            self.processOnStart(touch);
        }
        else if(origEvt.type.match(/^touch/)){
            
            
            
            Object.keys(self.manager.ids).forEach(function(k){
                if(Object.values(origEvt.touches).findIndex(function(t){return t.identifier===k;}) < 0){
                    
                    var e = [evt[0]];
                    e.identifier = k;
                    self.processOnEnd(e);
                }
            });
            if(self.actives.length < opts.maxNumberOfNipples){
                self.processOnStart(touch);
            }
        }
    };

    u.map(evt, process);

    
    
    self.manager.bindDocument();
    return false;
};

Collection.prototype.processOnStart = function (evt) {
    var self = this;
    var opts = self.options;
    var indexInIdles;
    var identifier = self.manager.getIdentifier(evt);
    var pressure = evt.force || evt.pressure || evt.webkitForce || 0;
    var position = {
        x: evt.pageX,
        y: evt.pageY
    };

    var nipple = self.getOrCreate(identifier, position);

    
    if (nipple.identifier !== identifier) {
        self.manager.removeIdentifier(nipple.identifier);
    }
    nipple.identifier = identifier;

    var process = function (nip) {
        
        nip.trigger('start', nip);
        self.trigger('start ' + nip.id + ':start', nip);

        nip.show();
        if (pressure > 0) {
            self.pressureFn(evt, nip, nip.identifier);
        }
        
        self.processOnMove(evt);
    };

    
    if ((indexInIdles = self.idles.indexOf(nipple)) >= 0) {
        self.idles.splice(indexInIdles, 1);
    }

    
    self.actives.push(nipple);
    self.ids.push(nipple.identifier);

    if (opts.mode !== 'semi') {
        process(nipple);
    } else {
        
        
        var distance = u.distance(position, nipple.position);
        if (distance <= opts.catchDistance) {
            process(nipple);
        } else {
            nipple.destroy();
            self.processOnStart(evt);
            return;
        }
    }

    return nipple;
};

Collection.prototype.getOrCreate = function (identifier, position) {
    var self = this;
    var opts = self.options;
    var nipple;

    
    if (/(semi|static)/.test(opts.mode)) {
        
        
        
        nipple = self.idles[0];
        if (nipple) {
            self.idles.splice(0, 1);
            return nipple;
        }

        if (opts.mode === 'semi') {
            
            return self.createNipple(position, identifier);
        }

        
        console.warn('Coudln\'t find the needed nipple.');
        return false;
    }
    
    nipple = self.createNipple(position, identifier);
    return nipple;
};

Collection.prototype.processOnMove = function (evt) {
    var self = this;
    var opts = self.options;
    var identifier = self.manager.getIdentifier(evt);
    var nipple = self.nipples.get(identifier);
    var scroll = self.manager.scroll;

    
    
    if (!u.isPressed(evt)) {
        this.processOnEnd(evt);
        return;
    }

    if (!nipple) {
        
        
        
        console.error('Found zombie joystick with ID ' + identifier);
        self.manager.removeIdentifier(identifier);
        return;
    }

    if (opts.dynamicPage) {
        var elBox = nipple.el.getBoundingClientRect();
        nipple.position = {
            x: scroll.x + elBox.left,
            y: scroll.y + elBox.top
        };
    }

    nipple.identifier = identifier;

    var size = nipple.options.size / 2;
    var pos = {
        x: evt.pageX,
        y: evt.pageY
    };

    if (opts.lockX){
        pos.y = nipple.position.y;
    }
    if (opts.lockY) {
        pos.x = nipple.position.x;
    }

    var dist = u.distance(pos, nipple.position);
    var angle = u.angle(pos, nipple.position);
    var rAngle = u.radians(angle);
    var force = dist / size;

    var raw = {
        distance: dist,
        position: pos
    };

    
    var clamped_dist;
    var clamped_pos;
    if (nipple.options.shape === 'circle') {
        
        clamped_dist = Math.min(dist, size);
        clamped_pos = u.findCoord(nipple.position, clamped_dist, angle);
    } else {
        
        clamped_pos = u.clamp(pos, nipple.position, size);
        clamped_dist = u.distance(clamped_pos, nipple.position);
    }

    if (opts.follow) {
        
        if (dist > size) {
            let delta_x = pos.x - clamped_pos.x;
            let delta_y = pos.y - clamped_pos.y;
            nipple.position.x += delta_x;
            nipple.position.y += delta_y;
            nipple.el.style.top = (nipple.position.y - (self.box.top + scroll.y)) + 'px';
            nipple.el.style.left = (nipple.position.x - (self.box.left + scroll.x)) + 'px';

            dist = u.distance(pos, nipple.position);
        }
    } else {
        
        pos = clamped_pos;
        dist = clamped_dist;
    }

    var xPosition = pos.x - nipple.position.x;
    var yPosition = pos.y - nipple.position.y;

    nipple.frontPosition = {
        x: xPosition,
        y: yPosition
    };

    if (!opts.dataOnly) {
        nipple.ui.front.style.transform = 'translate(' + xPosition + 'px,' + yPosition + 'px)';
    }

    
    var toSend = {
        identifier: nipple.identifier,
        position: pos,
        force: force,
        pressure: evt.force || evt.pressure || evt.webkitForce || 0,
        distance: dist,
        angle: {
            radian: rAngle,
            degree: angle
        },
        vector: {
            x: xPosition / size,
            y: - yPosition / size
        },
        raw: raw,
        instance: nipple,
        lockX: opts.lockX,
        lockY: opts.lockY
    };

    
    toSend = nipple.computeDirection(toSend);

    
    toSend.angle = {
        radian: u.radians(180 - angle),
        degree: 180 - angle
    };

    
    nipple.trigger('move', toSend);
    self.trigger('move ' + nipple.id + ':move', toSend);
};

Collection.prototype.processOnEnd = function (evt) {
    var self = this;
    var opts = self.options;
    var identifier = self.manager.getIdentifier(evt);
    var nipple = self.nipples.get(identifier);
    var removedIdentifier = self.manager.removeIdentifier(nipple.identifier);

    if (!nipple) {
        return;
    }

    if (!opts.dataOnly) {
        nipple.hide(function () {
            if (opts.mode === 'dynamic') {
                nipple.trigger('removed', nipple);
                self.trigger('removed ' + nipple.id + ':removed', nipple);
                self.manager
                    .trigger('removed ' + nipple.id + ':removed', nipple);
                nipple.destroy();
            }
        });
    }

    
    clearInterval(self.pressureIntervals[nipple.identifier]);

    
    
    nipple.resetDirection();

    nipple.trigger('end', nipple);
    self.trigger('end ' + nipple.id + ':end', nipple);

    
    if (self.ids.indexOf(nipple.identifier) >= 0) {
        self.ids.splice(self.ids.indexOf(nipple.identifier), 1);
    }

    
    if (self.actives.indexOf(nipple) >= 0) {
        self.actives.splice(self.actives.indexOf(nipple), 1);
    }

    if (/(semi|static)/.test(opts.mode)) {
        
        
        self.idles.push(nipple);
    } else if (self.nipples.indexOf(nipple) >= 0) {
        
        
        self.nipples.splice(self.nipples.indexOf(nipple), 1);
    }

    
    self.manager.unbindDocument();

    
    if (/(semi|static)/.test(opts.mode)) {
        self.manager.ids[removedIdentifier.id] = removedIdentifier.identifier;
    }
};


Collection.prototype.onDestroyed = function(evt, nipple) {
    var self = this;
    if (self.nipples.indexOf(nipple) >= 0) {
        self.nipples.splice(self.nipples.indexOf(nipple), 1);
    }
    if (self.actives.indexOf(nipple) >= 0) {
        self.actives.splice(self.actives.indexOf(nipple), 1);
    }
    if (self.idles.indexOf(nipple) >= 0) {
        self.idles.splice(self.idles.indexOf(nipple), 1);
    }
    if (self.ids.indexOf(nipple.identifier) >= 0) {
        self.ids.splice(self.ids.indexOf(nipple.identifier), 1);
    }

    
    self.manager.removeIdentifier(nipple.identifier);

    
    self.manager.unbindDocument();
};


Collection.prototype.destroy = function () {
    var self = this;
    self.unbindEvt(self.options.zone, 'start');

    
    self.nipples.forEach(function(nipple) {
        nipple.destroy();
    });

    
    for (var i in self.pressureIntervals) {
        if (self.pressureIntervals.hasOwnProperty(i)) {
            clearInterval(self.pressureIntervals[i]);
        }
    }

    
    self.trigger('destroyed', self.nipples);
    
    self.manager.unbindDocument();
    
    self.off();
};

export default Collection;
