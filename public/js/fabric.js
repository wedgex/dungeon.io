/* build: `node build.js modules=` */
/*! Fabric.js Copyright 2008-2013, Printio (Juriy Zaytsev, Maxim Chernyak) */

var fabric = fabric || { version: "1.1.16" };

if (typeof exports !== 'undefined') {
  exports.fabric = fabric;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  fabric.document = document;
  fabric.window = window;
}
else {
  // assume we're running under node.js when document/window are not present
  fabric.document = require("jsdom").jsdom("<!DOCTYPE html><html><head></head><body></body></html>");
  fabric.window = fabric.document.createWindow();
}

/**
 * True when in environment that supports touch events
 * @type boolean
 */
fabric.isTouchSupported = "ontouchstart" in fabric.document.documentElement;

/**
 * True when in environment that's probably Node.js
 * @type boolean
 */
fabric.isLikelyNode = typeof Buffer !== 'undefined' && typeof window === 'undefined';
/**
 * Wrapper around `console.log` (when available)
 * @param {Any} values Values to log
 */
fabric.log = function() { };

/**
 * Wrapper around `console.warn` (when available)
 * @param {Any} Values to log as a warning
 */
fabric.warn = function() { };

if (typeof console !== 'undefined') {
  if (typeof console.log !== 'undefined' && console.log.apply) {
    fabric.log = function() {
      return console.log.apply(console, arguments);
    };
  }
  if (typeof console.warn !== 'undefined' && console.warn.apply) {
    fabric.warn = function() {
      return console.warn.apply(console, arguments);
    };
  }
}
(function(){

  /**
   * Observes specified event
   * @deprecated `observe` deprecated since 0.8.34 (use `on` instead)
   * @memberOf fabric.Observable
   * @alias on
   * @param {String} eventName
   * @param {Function} handler
   */
  function observe(eventName, handler) {
    if (!this.__eventListeners) {
      this.__eventListeners = { };
    }
    // one object with key/value pairs was passed
    if (arguments.length === 1) {
      for (var prop in eventName) {
        this.on(prop, eventName[prop]);
      }
    }
    else {
      if (!this.__eventListeners[eventName]) {
        this.__eventListeners[eventName] = [ ];
      }
      this.__eventListeners[eventName].push(handler);
    }
  }

  /**
   * Stops event observing for a particular event handler
   * @deprecated `stopObserving` deprecated since 0.8.34 (use `off` instead)
   * @memberOf fabric.Observable
   * @alias off
   * @param {String} eventName
   * @param {Function} handler
   */
  function stopObserving(eventName, handler) {
    if (!this.__eventListeners) {
      this.__eventListeners = { };
    }
    if (this.__eventListeners[eventName]) {
      if (handler) {
        fabric.util.removeFromArray(this.__eventListeners[eventName], handler);
      }
      else {
        this.__eventListeners[eventName].length = 0;
      }
    }
  }

  /**
   * Fires event with an optional options object
   * @deprecated `fire` deprecated since 1.0.7 (use `trigger` instead)
   * @memberOf fabric.Observable
   * @alias trigger
   * @param {String} eventName
   * @param {Object} [options]
   */
  function fire(eventName, options) {
    if (!this.__eventListeners) {
      this.__eventListeners = { };
    }
    var listenersForEvent = this.__eventListeners[eventName];
    if (!listenersForEvent) return;
    for (var i = 0, len = listenersForEvent.length; i < len; i++) {
      // avoiding try/catch for perf. reasons
      listenersForEvent[i](options || { });
    }
  }

  /**
   * @namespace fabric.Observable
   */
  fabric.Observable = {
    observe: observe,
    stopObserving: stopObserving,
    fire: fire,

    on: observe,
    off: stopObserving,
    trigger: fire
  };
})();
/**
 * @namespace fabric.Collection
 */
fabric.Collection = {

  /**
   * Adds objects to collection, then renders canvas (if `renderOnAddition` is not `false`)
   * Objects should be instances of (or inherit from) fabric.Object
   * @param [...] Zero or more fabric instances
   * @return {Self} thisArg
   */
  add: function () {
    this._objects.push.apply(this._objects, arguments);
    for (var i = arguments.length; i--; ) {
      this._onObjectAdded(arguments[i]);
    }
    this.renderOnAddition && this.renderAll();
    return this;
  },

  /**
   * Inserts an object into collection at specified index and renders canvas
   * An object should be an instance of (or inherit from) fabric.Object
   * @param object {Object} Object to insert
   * @param index {Number} index to insert object at
   * @param nonSplicing {Boolean} when `true`, no splicing (shifting) of objects occurs
   * @return {Self} thisArg
   */
  insertAt: function (object, index, nonSplicing) {
    var objects = this.getObjects();
    if (nonSplicing) {
      objects[index] = object;
    }
    else {
      objects.splice(index, 0, object);
    }
    this._onObjectAdded(object);
    this.renderOnAddition && this.renderAll();
    return this;
  },

  /**
   * Removes an object from a group
   * @param {Object} object
   * @return {Self} thisArg
   */
  remove: function(object) {

    var objects = this.getObjects();
    var index = objects.indexOf(object);

    // only call onObjectRemoved if an object was actually removed
    if (index !== -1) {
      objects.splice(index, 1);
      this._onObjectRemoved(object);
    }

    this.renderAll && this.renderAll();
    return object;
  },

  /**
   * Executes given function for each object in this group
   * @param {Function} callback
   *                   Callback invoked with current object as first argument,
   *                   index - as second and an array of all objects - as third.
   *                   Iteration happens in reverse order (for performance reasons).
   *                   Callback is invoked in a context of Global Object (e.g. `window`)
   *                   when no `context` argument is given
   *
   * @param {Object} context Context (aka thisObject)
   * @return {Self} thisArg
   */
  forEachObject: function(callback, context) {
    var objects = this.getObjects(),
        i = objects.length;
    while (i--) {
      callback.call(context, objects[i], i, objects);
    }
    return this;
  },

  /**
   * Returns object at specified index
   * @param {Number} index
   * @return {Self} thisArg
   */
  item: function (index) {
    return this.getObjects()[index];
  },

  /**
   * Returns true if collection contains no objects
   * @return {Boolean} true if collection is empty
   */
  isEmpty: function () {
    return this.getObjects().length === 0;
  },

  /**
   * Returns a size of a collection (i.e: length of an array containing its objects)
   * @return {Number} Collection size
   */
  size: function() {
    return this.getObjects().length;
  },

  /**
   * Returns true if collection contains an object
   * @param {Object} object Object to check against
   * @return {Boolean} `true` if collection contains an object
   */
  contains: function(object) {
    return this.getObjects().indexOf(object) > -1;
  },

  /**
   * Returns number representation of a collection complexity
   * @return {Number} complexity
   */
  complexity: function () {
    return this.getObjects().reduce(function (memo, current) {
      memo += current.complexity ? current.complexity() : 0;
      return memo;
    }, 0);
  },

  /**
   * Makes all of the collection objects grayscale (i.e. calling `toGrayscale` on them)
   * @return {Self} thisArg
   */
  toGrayscale: function() {
    return this.forEachObject(function(obj) {
      obj.toGrayscale();
    });
  }
};
(function() {

  var sqrt = Math.sqrt,
      atan2 = Math.atan2;

  /**
   * @namespace fabric.util
   */
  fabric.util = { };

  /**
   * Removes value from an array.
   * Presence of value (and its position in an array) is determined via `Array.prototype.indexOf`
   * @static
   * @memberOf fabric.util
   * @param {Array} array
   * @param {Any} value
   * @return {Array} original array
   */
  function removeFromArray(array, value) {
    var idx = array.indexOf(value);
    if (idx !== -1) {
      array.splice(idx, 1);
    }
    return array;
  }

  /**
   * Returns random number between 2 specified ones.
   * @static
   * @memberOf fabric.util
   * @param {Number} min lower limit
   * @param {Number} max upper limit
   * @return {Number} random value (between min and max)
   */
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  var PiBy180 = Math.PI / 180;

  /**
   * Transforms degrees to radians.
   * @static
   * @memberOf fabric.util
   * @param {Number} degrees value in degrees
   * @return {Number} value in radians
   */
  function degreesToRadians(degrees) {
    return degrees * PiBy180;
  }

  /**
   * Transforms radians to degrees.
   * @static
   * @memberOf fabric.util
   * @param {Number} radians value in radians
   * @return {Number} value in degrees
   */
  function radiansToDegrees(radians) {
    return radians / PiBy180;
  }

  /**
   * Rotates `point` around `origin` with `radians`
   * @static
   * @memberOf fabric.util
   * @param {fabric.Point} The point to rotate
   * @param {fabric.Point} The origin of the rotation
   * @param {Number} The radians of the angle for the rotation
   * @return {fabric.Point} The new rotated point
   */
  function rotatePoint(point, origin, radians) {
    var sin = Math.sin(radians),
        cos = Math.cos(radians);

    point.subtractEquals(origin);

    var rx = point.x * cos - point.y * sin;
    var ry = point.x * sin + point.y * cos;

    return new fabric.Point(rx, ry).addEquals(origin);
  }

  /**
   * A wrapper around Number#toFixed, which contrary to native method returns number, not string.
   * @static
   * @memberOf fabric.util
   * @param {Number | String} number number to operate on
   * @param {Number} fractionDigits number of fraction digits to "leave"
   * @return {Number}
   */
   function toFixed(number, fractionDigits) {
     return parseFloat(Number(number).toFixed(fractionDigits));
   }

   /**
    * Function which always returns `false`.
    * @static
    * @memberOf fabric.util
    * @return {Boolean}
    */
   function falseFunction() {
     return false;
   }

   /**
    * Changes value from one to another within certain period of time, invoking callbacks as value is being changed.
    * @memberOf fabric.util
    * @param {Object} [options] Animation options
    * @param {Function} [options.onChange] Callback; invoked on every value change
    * @param {Function} [options.onComplete] Callback; invoked when value change is completed
    * @param {Number} [options.startValue=0] Starting value
    * @param {Number} [options.endValue=100] Ending value
    * @param {Number} [options.byValue=100] Value to modify the property by
    * @param {Function} [options.easing] Easing function
    * @param {Number} [options.duration=500] Duration of change
    */
  function animate(options) {

    options || (options = { });

    var start = +new Date(),
      duration = options.duration || 500,
      finish = start + duration, time,
      onChange = options.onChange || function() { },
      abort = options.abort || function() { return false; },
      easing = options.easing || function(t, b, c, d) {return -c * Math.cos(t/d * (Math.PI/2)) + c + b;},
      startValue = 'startValue' in options ? options.startValue : 0,
      endValue = 'endValue' in options ? options.endValue : 100,
      byValue = options.byValue || endValue - startValue;

    options.onStart && options.onStart();

    (function tick() {
      time = +new Date();
      var currentTime = time > finish ? duration : (time - start);
      onChange(easing(currentTime, startValue, byValue, duration));
      if (time > finish || abort()) {
        options.onComplete && options.onComplete();
        return;
      }
      requestAnimFrame(tick);
    })();
  }

  var _requestAnimFrame = fabric.window.requestAnimationFrame       ||
                          fabric.window.webkitRequestAnimationFrame ||
                          fabric.window.mozRequestAnimationFrame    ||
                          fabric.window.oRequestAnimationFrame      ||
                          fabric.window.msRequestAnimationFrame     ||
                          function(callback) {
                            fabric.window.setTimeout(callback, 1000 / 60);
                          };
  /**
    * requestAnimationFrame polyfill based on http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    * @memberOf fabric.util
    * @param {Function} callback Callback to invoke
    * @param {DOMElement} element optional Element to associate with animation
    */
  var requestAnimFrame = function() {
    return _requestAnimFrame.apply(fabric.window, arguments);
  };

  /**
    * Loads image element from given url and passes it to a callback
    * @memberOf fabric.util
    * @param {String} url URL representing an image
    * @param {Function} callback Callback; invoked with loaded image
    * @param {Any} context optional Context to invoke callback in
    */
  function loadImage(url, callback, context) {
    if (url) {
      var img = fabric.util.createImage();
      /** @ignore */
      img.onload = function () {
        callback && callback.call(context, img);
        img = img.onload = null;
      };
      img.src = url;
    }
    else {
      callback && callback.call(context, url);
    }
  }

  /**
   * Creates corresponding fabric instances from their object representations
   * @static
   * @memberOf fabric.util
   * @param {Array} objects Objects to enliven
   * @param {Function} callback Callback to invoke when all objects are created
   */
  function enlivenObjects(objects, callback) {

    function getKlass(type) {
      return fabric[fabric.util.string.camelize(fabric.util.string.capitalize(type))];
    }

    function onLoaded() {
      if (++numLoadedObjects === numTotalObjects) {
        if (callback) {
          callback(enlivenedObjects);
        }
      }
    }

    var enlivenedObjects = [ ],
        numLoadedObjects = 0,
        numTotalObjects = objects.length;

    objects.forEach(function (o, index) {
      if (!o.type) {
        return;
      }
      var klass = getKlass(o.type);
      if (klass.async) {
        klass.fromObject(o, function (o, error) {
          if (!error) {
            enlivenedObjects[index] = o;
          }
          onLoaded();
        });
      }
      else {
        enlivenedObjects[index] = klass.fromObject(o);
        onLoaded();
      }
    });
  }

  /**
   * Groups SVG elements (usually those retrieved from SVG document)
   * @static
   * @memberOf fabric.util
   * @param {Array} elements SVG elements to group
   * @param {Object} [options] Options object
   * @return {fabric.Object|fabric.PathGroup}
   */
  function groupSVGElements(elements, options, path) {
    var object;

    if (elements.length > 1) {
      //var hasText = elements.some(function(el) { return el.type === 'text'; });

      // if (hasText) {
      //   object = new fabric.Group([ ], options);
      //   elements.reverse().forEach(function(obj) {
      //     if (obj.cx) {
      //       obj.left = obj.cx;
      //     }
      //     if (obj.cy) {
      //       obj.top = obj.cy;
      //     }
      //     object.addWithUpdate(obj);
      //   });
      // }
      // else {
        object = new fabric.PathGroup(elements, options);
      //}
    }
    else {
      object = elements[0];
    }

    if (typeof path !== 'undefined') {
      object.setSourcePath(path);
    }
    return object;
  }

  /**
   * Populates an object with properties of another object
   * @static
   * @memberOf fabric.util
   * @param {Object} source Source object
   * @param {Object} destination Destination object
   * @return {Array} properties Propertie names to include
   */
  function populateWithProperties(source, destination, properties) {
    if (properties && Object.prototype.toString.call(properties) === '[object Array]') {
      for (var i = 0, len = properties.length; i < len; i++) {
        destination[properties[i]] = source[properties[i]];
      }
    }
  }

  /**
   * Draws a dashed line between two points
   *
   * This method is used to draw dashed line around selection area.
   * See <a href="http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas">dotted stroke in canvas</a>
   *
   * @param ctx {Canvas} context
   * @param x {Number} start x coordinate
   * @param y {Number} start y coordinate
   * @param x2 {Number} end x coordinate
   * @param y2 {Number} end y coordinate
   * @param da {Array} dash array pattern
   */
  function drawDashedLine(ctx, x, y, x2, y2, da) {
    var dx = x2 - x,
        dy = y2 - y,
        len = sqrt(dx*dx + dy*dy),
        rot = atan2(dy, dx),
        dc = da.length,
        di = 0,
        draw = true;

    ctx.save();
    ctx.translate(x, y);
    ctx.moveTo(0, 0);
    ctx.rotate(rot);

    x = 0;
    while (len > x) {
      x += da[di++ % dc];
      if (x > len) {
        x = len;
      }
      ctx[draw ? 'lineTo' : 'moveTo'](x, 0);
      draw = !draw;
    }

    ctx.restore();
  }

  /**
   * Creates canvas element and initializes it via excanvas if necessary
   * @static
   * @memberOf fabric.util
   * @param {CanvasElement} [canvasEl] optional canvas element to initialize; when not given, element is created implicitly
   * @return {CanvasElement} initialized canvas element
   */
  function createCanvasElement(canvasEl) {
    canvasEl || (canvasEl = fabric.document.createElement('canvas'));
    if (!canvasEl.getContext && typeof G_vmlCanvasManager !== 'undefined') {
      G_vmlCanvasManager.initElement(canvasEl);
    }
    return canvasEl;
  }

  /**
   * Creates image element (works on client and node)
   * @static
   * @memberOf fabric.util
   * @return {Image} image element
   */
  function createImage() {
    return fabric.isLikelyNode
      ? new (require('canvas').Image)()
      : fabric.document.createElement('img');
  }

  /**
   * Creates accessors (getXXX, setXXX) for a "class", based on "stateProperties" array
   * @static
   * @memberOf fabric.util
   * @param {Object} klass "Class" to create accessors for
   */
  function createAccessors(klass) {
    var proto = klass.prototype;

    for (var i = proto.stateProperties.length; i--; ) {

      var propName = proto.stateProperties[i],
          capitalizedPropName = propName.charAt(0).toUpperCase() + propName.slice(1),
          setterName = 'set' + capitalizedPropName,
          getterName = 'get' + capitalizedPropName;

      // using `new Function` for better introspection
      if (!proto[getterName]) {
        proto[getterName] = (function(property) {
          return new Function('return this.get("' + property + '")');
        })(propName);
      }
      if (!proto[setterName]) {
        proto[setterName] = (function(property) {
          return new Function('value', 'return this.set("' + property + '", value)');
        })(propName);
      }
    }
  }

  /**
   * @static
   * @memberOf fabric.util
   * @param {fabric.Object} receiver Object implementing `clipTo` method
   * @param {CanvasRenderingContext2D} ctx Context to clip
   */
  function clipContext(receiver, ctx) {
    ctx.save();
    ctx.beginPath();
    receiver.clipTo(ctx);
    ctx.clip();
  }

  /**
   * Multiply matrix A by matrix B to nest transformations
   * @static
   * @memberOf fabric.util
   * @param  {Array} matrixA First transformMatrix
   * @param  {Array} matrixB Second transformMatrix
   * @return {Array} The product of the two transform matrices
   */
  function multiplyTransformMatrices(matrixA, matrixB) {
    // Matrix multiply matrixA * matrixB
    var a = [
      [matrixA[0], matrixA[2], matrixA[4]],
      [matrixA[1], matrixA[3], matrixA[5]],
      [0         , 0         , 1         ]
    ];

    var b = [
      [matrixB[0], matrixB[2], matrixB[4]],
      [matrixB[1], matrixB[3], matrixB[5]],
      [0         , 0         , 1         ]
    ];

    var result = [];
    for (var r=0; r<3; r++) {
      result[r] = [];
      for (var c=0; c<3; c++) {
        var sum = 0;
        for (var k=0; k<3; k++) {
          sum += a[r][k]*b[k][c];
        }

        result[r][c] = sum;
      }
    }

    return [
      result[0][0],
      result[1][0],
      result[0][1],
      result[1][1],
      result[0][2],
      result[1][2]
    ];
  }

  fabric.util.removeFromArray = removeFromArray;
  fabric.util.degreesToRadians = degreesToRadians;
  fabric.util.radiansToDegrees = radiansToDegrees;
  fabric.util.rotatePoint = rotatePoint;
  fabric.util.toFixed = toFixed;
  fabric.util.getRandomInt = getRandomInt;
  fabric.util.falseFunction = falseFunction;
  fabric.util.animate = animate;
  fabric.util.requestAnimFrame = requestAnimFrame;
  fabric.util.loadImage = loadImage;
  fabric.util.enlivenObjects = enlivenObjects;
  fabric.util.groupSVGElements = groupSVGElements;
  fabric.util.populateWithProperties = populateWithProperties;
  fabric.util.drawDashedLine = drawDashedLine;
  fabric.util.createCanvasElement = createCanvasElement;
  fabric.util.createImage = createImage;
  fabric.util.createAccessors = createAccessors;
  fabric.util.clipContext = clipContext;
  fabric.util.multiplyTransformMatrices = multiplyTransformMatrices;

})();
(function() {

  var slice = Array.prototype.slice;

  /* _ES5_COMPAT_START_ */

  if (!Array.prototype.indexOf) {
    /**
     * Finds index of an element in an array
     * @param {Any} searchElement
     * @param {Number} [fromIndex]
     * @return {Number}
     */
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
      if (this === void 0 || this === null) {
        throw new TypeError();
      }
      var t = Object(this), len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 0) {
        n = Number(arguments[1]);
        if (n !== n) { // shortcut for verifying if it's NaN
          n = 0;
        }
        else if (n !== 0 && n !== Number.POSITIVE_INFINITY && n !== Number.NEGATIVE_INFINITY) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    };
  }

  if (!Array.prototype.forEach) {
    /**
     * Iterates an array, invoking callback for each element
     * @param {Function} fn Callback to invoke for each element
     * @param {Object} [context] Context to invoke callback in
     * @return {Array}
     */
    Array.prototype.forEach = function(fn, context) {
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this) {
          fn.call(context, this[i], i, this);
        }
      }
    };
  }

  if (!Array.prototype.map) {
    /**
     * Returns a result of iterating over an array, invoking callback for each element
     * @param {Function} fn Callback to invoke for each element
     * @param {Object} [context] Context to invoke callback in
     * @return {Array}
     */
    Array.prototype.map = function(fn, context) {
      var result = [ ];
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this) {
          result[i] = fn.call(context, this[i], i, this);
        }
      }
      return result;
    };
  }

  if (!Array.prototype.every) {
    /**
     * Returns true if a callback returns truthy value for all elements in an array
     * @param {Function} fn Callback to invoke for each element
     * @param {Object} [context] Context to invoke callback in
     * @return {Boolean}
     */
    Array.prototype.every = function(fn, context) {
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this && !fn.call(context, this[i], i, this)) {
          return false;
        }
      }
      return true;
    };
  }

  if (!Array.prototype.some) {
    /**
     * Returns true if a callback returns truthy value for at least one element in an array
     * @param {Function} fn Callback to invoke for each element
     * @param {Object} [context] Context to invoke callback in
     * @return {Boolean}
     */
    Array.prototype.some = function(fn, context) {
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this && fn.call(context, this[i], i, this)) {
          return true;
        }
      }
      return false;
    };
  }

  if (!Array.prototype.filter) {
    /**
     * Returns the result of iterating over elements in an array
     * @param {Function} fn Callback to invoke for each element
     * @param {Object} [context] Context to invoke callback in
     * @return {Array}
     */
    Array.prototype.filter = function(fn, context) {
      var result = [ ], val;
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this) {
          val = this[i]; // in case fn mutates this
          if (fn.call(context, val, i, this)) {
            result.push(val);
          }
        }
      }
      return result;
    };
  }

  if (!Array.prototype.reduce) {
    /**
     * Returns "folded" (reduced) result of iterating over elements in an array
     * @param {Function} fn Callback to invoke for each element
     * @param {Object} [context] Context to invoke callback in
     * @return {Any}
     */
    Array.prototype.reduce = function(fn /*, initial*/) {
      var len = this.length >>> 0,
          i = 0,
          rv;

      if (arguments.length > 1) {
        rv = arguments[1];
      }
      else {
        do {
          if (i in this) {
            rv = this[i++];
            break;
          }
          // if array contains no values, no initial value to return
          if (++i >= len) {
            throw new TypeError();
          }
        }
        while (true);
      }
      for (; i < len; i++) {
        if (i in this) {
          rv = fn.call(null, rv, this[i], i, this);
        }
      }
      return rv;
    };
  }

  /* _ES5_COMPAT_END_ */

  /**
   * Invokes method on all items in a given array
   * @memberOf fabric.util.array
   * @param {Array} array Array to iterate over
   * @param {String} method Name of a method to invoke
   * @return {Array}
   */
  function invoke(array, method) {
    var args = slice.call(arguments, 2), result = [ ];
    for (var i = 0, len = array.length; i < len; i++) {
      result[i] = args.length ? array[i][method].apply(array[i], args) : array[i][method].call(array[i]);
    }
    return result;
  }

  /**
   * Finds maximum value in array (not necessarily "first" one)
   * @memberOf fabric.util.array
   * @param {Array} array Array to iterate over
   * @param {String} byProperty
   * @return {Any}
   */
  function max(array, byProperty) {
    if (!array || array.length === 0) return undefined;

    var i = array.length - 1,
        result = byProperty ? array[i][byProperty] : array[i];
    if (byProperty) {
      while (i--) {
        if (array[i][byProperty] >= result) {
          result = array[i][byProperty];
        }
      }
    }
    else {
      while (i--) {
        if (array[i] >= result) {
          result = array[i];
        }
      }
    }
    return result;
  }

  /**
   * Finds minimum value in array (not necessarily "first" one)
   * @memberOf fabric.util.array
   * @param {Array} array Array to iterate over
   * @param {String} byProperty
   * @return {Any}
   */
  function min(array, byProperty) {
    if (!array || array.length === 0) return undefined;

    var i = array.length - 1,
        result = byProperty ? array[i][byProperty] : array[i];

    if (byProperty) {
      while (i--) {
        if (array[i][byProperty] < result) {
          result = array[i][byProperty];
        }
      }
    }
    else {
      while (i--) {
        if (array[i] < result) {
          result = array[i];
        }
      }
    }
    return result;
  }

  /**
   * @namespace fabric.util.array
   */
  fabric.util.array = {
    invoke: invoke,
    min: min,
    max: max
  };

})();
(function(){

  /**
   * Copies all enumerable properties of one object to another
   * @memberOf fabric.util.object
   * @param {Object} destination Where to copy to
   * @param {Object} source Where to copy from
   * @return {Object}
   */
  function extend(destination, source) {
    // JScript DontEnum bug is not taken care of
    for (var property in source) {
      destination[property] = source[property];
    }
    return destination;
  }

  /**
   * Creates an empty object and copies all enumerable properties of another object to it
   * @memberOf fabric.util.object
   * @param {Object} object Object to clone
   * @return {Object}
   */
  function clone(object) {
    return extend({ }, object);
  }

  /** @namespace fabric.util.object */
  fabric.util.object = {
    extend: extend,
    clone: clone
  };

})();
(function() {

/* _ES5_COMPAT_START_ */
if (!String.prototype.trim) {
  /**
   * Trims a string (removing whitespace from the beginning and the end)
   * @function external:String#trim
   * @see <a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/Trim">String#trim on MDN</a>
   */
  String.prototype.trim = function () {
    // this trim is not fully ES3 or ES5 compliant, but it should cover most cases for now
    return this.replace(/^[\s\xA0]+/, '').replace(/[\s\xA0]+$/, '');
  };
}
/* _ES5_COMPAT_END_ */

/**
 * Camelizes a string
 * @memberOf fabric.util.string
 * @param {String} string String to camelize
 * @return {String} Camelized version of a string
 */
function camelize(string) {
  return string.replace(/-+(.)?/g, function(match, character) {
    return character ? character.toUpperCase() : '';
  });
}

/**
 * Capitalizes a string
 * @memberOf fabric.util.string
 * @param {String} string String to capitalize
 * @return {String} Capitalized version of a string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Escapes XML in a string
 * @memberOf fabric.util.string
 * @param {String} string String to escape
 * @return {String} Escaped version of a string
 */
function escapeXml(string) {
  return string.replace(/&/g, '&amp;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;');
}

/**
 * String utilities
 * @namespace fabric.util.string
 */
fabric.util.string = {
  camelize: camelize,
  capitalize: capitalize,
  escapeXml: escapeXml
};
}());
/* _ES5_COMPAT_START_ */
(function() {

  var slice = Array.prototype.slice,
      apply = Function.prototype.apply,
      Dummy = function() { };

  if (!Function.prototype.bind) {
    /**
     * Cross-browser approximation of ES5 Function.prototype.bind (not fully spec conforming)
     * @see <a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind">Function#bind on MDN</a>
     * @param {Object} thisArg Object to bind function to
     * @param {Any[]} [...] Values to pass to a bound function
     * @return {Function}
     */
    Function.prototype.bind = function(thisArg) {
      var fn = this, args = slice.call(arguments, 1), bound;
      if (args.length) {
        bound = function() {
          return apply.call(fn, this instanceof Dummy ? this : thisArg, args.concat(slice.call(arguments)));
        };
      }
      else {
        /** @ignore */
        bound = function() {
          return apply.call(fn, this instanceof Dummy ? this : thisArg, arguments);
        };
      }
      Dummy.prototype = this.prototype;
      bound.prototype = new Dummy();

      return bound;
    };
  }

})();
/* _ES5_COMPAT_END_ */
(function() {

  var slice = Array.prototype.slice, emptyFunction = function() { };

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  /** @ignore */
  var addMethods = function(klass, source, parent) {
    for (var property in source) {

      if (property in klass.prototype &&
          typeof klass.prototype[property] === 'function' &&
          (source[property] + '').indexOf('callSuper') > -1) {

        klass.prototype[property] = (function(property) {
          return function() {

            var superclass = this.constructor.superclass;
            this.constructor.superclass = parent;
            var returnValue = source[property].apply(this, arguments);
            this.constructor.superclass = superclass;

            if (property !== 'initialize') {
              return returnValue;
            }
          };
        })(property);
      }
      else {
        klass.prototype[property] = source[property];
      }

      if (IS_DONTENUM_BUGGY) {
        if (source.toString !== Object.prototype.toString) {
          klass.prototype.toString = source.toString;
        }
        if (source.valueOf !== Object.prototype.valueOf) {
          klass.prototype.valueOf = source.valueOf;
        }
      }
    }
  };

  function Subclass() { }

  function callSuper(methodName) {
    var fn = this.constructor.superclass.prototype[methodName];
    return (arguments.length > 1)
      ? fn.apply(this, slice.call(arguments, 1))
      : fn.call(this);
  }

  /**
   * Helper for creation of "classes". Note that pr
   * @param parent optional "Class" to inherit from
   * @param properties Properties shared by all instances of this class
   *                  (be careful modifying objects defined here as this would affect all instances)
   * @memberOf fabric.util
   */
  function createClass() {
    var parent = null,
        properties = slice.call(arguments, 0);

    if (typeof properties[0] === 'function') {
      parent = properties.shift();
    }
    function klass() {
      this.initialize.apply(this, arguments);
    }

    klass.superclass = parent;
    klass.subclasses = [ ];

    if (parent) {
      Subclass.prototype = parent.prototype;
      klass.prototype = new Subclass();
      parent.subclasses.push(klass);
    }
    for (var i = 0, length = properties.length; i < length; i++) {
      addMethods(klass, properties[i], parent);
    }
    if (!klass.prototype.initialize) {
      klass.prototype.initialize = emptyFunction;
    }
    klass.prototype.constructor = klass;
    klass.prototype.callSuper = callSuper;
    return klass;
  }

  fabric.util.createClass = createClass;
})();
(function () {

  /* EVENT HANDLING */

  function areHostMethods(object) {
    var methodNames = Array.prototype.slice.call(arguments, 1),
        t, i, len = methodNames.length;
    for (i = 0; i < len; i++) {
      t = typeof object[methodNames[i]];
      if (!(/^(?:function|object|unknown)$/).test(t)) return false;
    }
    return true;
  }
  var getUniqueId = (function () {
    var uid = 0;
    return function (element) {
      return element.__uniqueID || (element.__uniqueID = 'uniqueID__' + uid++);
    };
  })();

  /** @ignore */
  var getElement, setElement;

  (function () {
    var elements = { };
    /** @ignore */
    getElement = function (uid) {
      return elements[uid];
    };
    /** @ignore */
    setElement = function (uid, element) {
      elements[uid] = element;
    };
  })();

  function createListener(uid, handler) {
    return {
      handler: handler,
      wrappedHandler: createWrappedHandler(uid, handler)
    };
  }

  function createWrappedHandler(uid, handler) {
    return function (e) {
      handler.call(getElement(uid), e || fabric.window.event);
    };
  }

  function createDispatcher(uid, eventName) {
    return function (e) {
      if (handlers[uid] && handlers[uid][eventName]) {
        var handlersForEvent = handlers[uid][eventName];
        for (var i = 0, len = handlersForEvent.length; i < len; i++) {
          handlersForEvent[i].call(this, e || fabric.window.event);
        }
      }
    };
  }

  var shouldUseAddListenerRemoveListener = (
        areHostMethods(fabric.document.documentElement, 'addEventListener', 'removeEventListener') &&
        areHostMethods(fabric.window, 'addEventListener', 'removeEventListener')),

      shouldUseAttachEventDetachEvent = (
        areHostMethods(fabric.document.documentElement, 'attachEvent', 'detachEvent') &&
        areHostMethods(fabric.window, 'attachEvent', 'detachEvent')),

      // IE branch
      listeners = { },

      // DOM L0 branch
      handlers = { },

      addListener, removeListener;

  if (shouldUseAddListenerRemoveListener) {
    /** @ignore */
    addListener = function (element, eventName, handler) {
      element.addEventListener(eventName, handler, false);
    };
    /** @ignore */
    removeListener = function (element, eventName, handler) {
      element.removeEventListener(eventName, handler, false);
    };
  }

  else if (shouldUseAttachEventDetachEvent) {
    /** @ignore */
    addListener = function (element, eventName, handler) {
      var uid = getUniqueId(element);
      setElement(uid, element);
      if (!listeners[uid]) {
        listeners[uid] = { };
      }
      if (!listeners[uid][eventName]) {
        listeners[uid][eventName] = [ ];

      }
      var listener = createListener(uid, handler);
      listeners[uid][eventName].push(listener);
      element.attachEvent('on' + eventName, listener.wrappedHandler);
    };
    /** @ignore */
    removeListener = function (element, eventName, handler) {
      var uid = getUniqueId(element), listener;
      if (listeners[uid] && listeners[uid][eventName]) {
        for (var i = 0, len = listeners[uid][eventName].length; i < len; i++) {
          listener = listeners[uid][eventName][i];
          if (listener && listener.handler === handler) {
            element.detachEvent('on' + eventName, listener.wrappedHandler);
            listeners[uid][eventName][i] = null;
          }
        }
      }
    };
  }
  else {
    /** @ignore */
    addListener = function (element, eventName, handler) {
      var uid = getUniqueId(element);
      if (!handlers[uid]) {
        handlers[uid] = { };
      }
      if (!handlers[uid][eventName]) {
        handlers[uid][eventName] = [ ];
        var existingHandler = element['on' + eventName];
        if (existingHandler) {
          handlers[uid][eventName].push(existingHandler);
        }
        element['on' + eventName] = createDispatcher(uid, eventName);
      }
      handlers[uid][eventName].push(handler);
    };
    /** @ignore */
    removeListener = function (element, eventName, handler) {
      var uid = getUniqueId(element);
      if (handlers[uid] && handlers[uid][eventName]) {
        var handlersForEvent = handlers[uid][eventName];
        for (var i = 0, len = handlersForEvent.length; i < len; i++) {
          if (handlersForEvent[i] === handler) {
            handlersForEvent.splice(i, 1);
          }
        }
      }
    };
  }

  /**
   * Adds an event listener to an element
   * @mthod addListener
   * @memberOf fabric.util
   * @function
   * @param {HTMLElement} element
   * @param {String} eventName
   * @param {Function} handler
   */
  fabric.util.addListener = addListener;

  /**
   * Removes an event listener from an element
   * @mthod removeListener
   * @memberOf fabric.util
   * @function
   * @param {HTMLElement} element
   * @param {String} eventName
   * @param {Function} handler
   */
  fabric.util.removeListener = removeListener;

  /**
   * Cross-browser wrapper for getting event's coordinates
   * @memberOf fabric.util
   * @param {Event} event
   * @param {HTMLCanvasElement} upperCanvasEl &lt;canvas> element on which object selection is drawn
   */
  function getPointer(event, upperCanvasEl) {
    event || (event = fabric.window.event);

    var element = event.target || (typeof event.srcElement !== 'unknown' ? event.srcElement : null),
        body = fabric.document.body || {scrollLeft: 0, scrollTop: 0},
        docElement = fabric.document.documentElement,
        orgElement = element,
        scrollLeft = 0,
        scrollTop = 0,
        firstFixedAncestor;

    while (element && element.parentNode && !firstFixedAncestor) {
      element = element.parentNode;

      if (element !== fabric.document && fabric.util.getElementStyle(element, 'position') === 'fixed') firstFixedAncestor = element;

      if (element !== fabric.document && orgElement !== upperCanvasEl && fabric.util.getElementStyle(element, 'position') === 'absolute') {
        scrollLeft = 0;
        scrollTop = 0;
      }
      else if (element === fabric.document && orgElement !== upperCanvasEl) {
        scrollLeft = body.scrollLeft || docElement.scrollLeft || 0;
        scrollTop = body.scrollTop ||  docElement.scrollTop || 0;
      }
      else {
        scrollLeft += element.scrollLeft || 0;
        scrollTop += element.scrollTop || 0;
      }
    }

    return {
      x: pointerX(event) + scrollLeft,
      y: pointerY(event) + scrollTop
    };
  }

  var pointerX = function(event) {
    // looks like in IE (<9) clientX at certain point (apparently when mouseup fires on VML element)
    // is represented as COM object, with all the consequences, like "unknown" type and error on [[Get]]
    // need to investigate later
    return (typeof event.clientX !== 'unknown' ? event.clientX : 0);
  };

  var pointerY = function(event) {
    return (typeof event.clientY !== 'unknown' ? event.clientY : 0);
  };

  if (fabric.isTouchSupported) {
    pointerX = function(event) {
      if (event.type !== 'touchend') {
        return (event.touches && event.touches[0] ? (event.touches[0].pageX - (event.touches[0].pageX - event.touches[0].clientX)) || event.clientX : event.clientX);
      }
      return (event.changedTouches && event.changedTouches[0] ? (event.changedTouches[0].pageX - (event.changedTouches[0].pageX - event.changedTouches[0].clientX)) || event.clientX : event.clientX);
    };
    pointerY = function(event) {
      if (event.type !== 'touchend') {
        return (event.touches && event.touches[0] ? (event.touches[0].pageY - (event.touches[0].pageY - event.touches[0].clientY)) || event.clientY : event.clientY);
      }
      return (event.changedTouches && event.changedTouches[0] ? (event.changedTouches[0].pageY - (event.changedTouches[0].pageY - event.changedTouches[0].clientY)) || event.clientY : event.clientY);
    };
  }

  fabric.util.getPointer = getPointer;

  fabric.util.object.extend(fabric.util, fabric.Observable);

})();
(function () {

  /**
   * Cross-browser wrapper for setting element's style
   * @memberOf fabric.util
   * @param {HTMLElement} element
   * @param {Object} styles
   * @return {HTMLElement} Element that was passed as a first argument
   */
  function setStyle(element, styles) {
    var elementStyle = element.style;
    if (!elementStyle) {
      return element;
    }
    if (typeof styles === 'string') {
      element.style.cssText += ';' + styles;
      return styles.indexOf('opacity') > -1
        ? setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
        : element;
    }
    for (var property in styles) {
      if (property === 'opacity') {
        setOpacity(element, styles[property]);
      }
      else {
        var normalizedProperty = (property === 'float' || property === 'cssFloat')
          ? (typeof elementStyle.styleFloat === 'undefined' ? 'cssFloat' : 'styleFloat')
          : property;
        elementStyle[normalizedProperty] = styles[property];
      }
    }
    return element;
  }

  var parseEl = fabric.document.createElement('div'),
      supportsOpacity = typeof parseEl.style.opacity === 'string',
      supportsFilters = typeof parseEl.style.filter === 'string',
      reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/,

      /** @ignore */
      setOpacity = function (element) { return element; };

  if (supportsOpacity) {
    /** @ignore */
    setOpacity = function(element, value) {
      element.style.opacity = value;
      return element;
    };
  }
  else if (supportsFilters) {
    /** @ignore */
    setOpacity = function(element, value) {
      var es = element.style;
      if (element.currentStyle && !element.currentStyle.hasLayout) {
        es.zoom = 1;
      }
      if (reOpacity.test(es.filter)) {
        value = value >= 0.9999 ? '' : ('alpha(opacity=' + (value * 100) + ')');
        es.filter = es.filter.replace(reOpacity, value);
      }
      else {
        es.filter += ' alpha(opacity=' + (value * 100) + ')';
      }
      return element;
    };
  }

  fabric.util.setStyle = setStyle;

})();
(function() {

  var _slice = Array.prototype.slice;

  /**
   * Takes id and returns an element with that id (if one exists in a document)
   * @memberOf fabric.util
   * @param {String|HTMLElement} id
   * @return {HTMLElement|null}
   */
  function getById(id) {
    return typeof id === 'string' ? fabric.document.getElementById(id) : id;
  }

  /**
   * Converts an array-like object (e.g. arguments or NodeList) to an array
   * @memberOf fabric.util
   * @param {Object} arrayLike
   * @return {Array}
   */
  var toArray = function(arrayLike) {
    return _slice.call(arrayLike, 0);
  };

  var sliceCanConvertNodelists;
  try {
    sliceCanConvertNodelists = toArray(fabric.document.childNodes) instanceof Array;
  }
  catch(err) { }

  if (!sliceCanConvertNodelists) {
    toArray = function(arrayLike) {
      var arr = new Array(arrayLike.length), i = arrayLike.length;
      while (i--) {
        arr[i] = arrayLike[i];
      }
      return arr;
    };
  }

  /**
   * Creates specified element with specified attributes
   * @memberOf fabric.util
   * @param {String} tagName Type of an element to create
   * @param {Object} [attributes] Attributes to set on an element
   * @return {HTMLElement} Newly created element
   */
  function makeElement(tagName, attributes) {
    var el = fabric.document.createElement(tagName);
    for (var prop in attributes) {
      if (prop === 'class') {
        el.className = attributes[prop];
      }
      else if (prop === 'for') {
        el.htmlFor = attributes[prop];
      }
      else {
        el.setAttribute(prop, attributes[prop]);
      }
    }
    return el;
  }

  /**
   * Adds class to an element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to add class to
   * @param {String} className Class to add to an element
   */
  function addClass(element, className) {
    if ((' ' + element.className + ' ').indexOf(' ' + className + ' ') === -1) {
      element.className += (element.className ? ' ' : '') + className;
    }
  }

  /**
   * Wraps element with another element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to wrap
   * @param {HTMLElement|String} wrapper Element to wrap with
   * @param {Object} [attributes] Attributes to set on a wrapper
   * @return {HTMLElement} wrapper
   */
  function wrapElement(element, wrapper, attributes) {
    if (typeof wrapper === 'string') {
      wrapper = makeElement(wrapper, attributes);
    }
    if (element.parentNode) {
      element.parentNode.replaceChild(wrapper, element);
    }
    wrapper.appendChild(element);
    return wrapper;
  }

  /**
   * Returns offset for a given element
   * @function
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to get offset for
   * @return {Object} Object with "left" and "top" properties
   */
  function getElementOffset(element) {
    var docElem, win,
        box = {left: 0, top: 0},
        doc = element && element.ownerDocument,
        offset = {left: 0, top: 0},
        offsetAttributes = {
           'borderLeftWidth': 'left',
           'borderTopWidth':  'top',
           'paddingLeft':     'left',
           'paddingTop':      'top'
        };

    if (!doc){
      return {left: 0, top: 0};
    }

    for (var attr in offsetAttributes) {
      offset[offsetAttributes[attr]] += parseInt(getElementStyle(element, attr), 10) || 0;
    }

    docElem = doc.documentElement;
    if ( typeof element.getBoundingClientRect !== "undefined" ) {
      box = element.getBoundingClientRect();
    }
    if(doc != null && doc === doc.window){
      win = doc;
    } else {
      win = doc.nodeType === 9 && doc.defaultView;
    }
    return {
      left: box.left + win.pageXOffset - (docElem.clientLeft || 0) + offset.left,
      top: box.top + win.pageYOffset - (docElem.clientTop || 0)  + offset.top
    };
  }

  /**
  * Returns style attribute value of a given element
  * @memberOf fabric.util
  * @param {HTMLElement} element Element to get style attribute for
  * @param {String} attr Style attribute to get for element
  * @return {String} Style attribute value of the given element.
  */
  function getElementStyle(element, attr) {
    if (!element.style) {
      element.style = { };
    }

    if (fabric.document.defaultView && fabric.document.defaultView.getComputedStyle) {
      return fabric.document.defaultView.getComputedStyle(element, null)[attr];
    }
    else {
      var value = element.style[attr];
      if (!value && element.currentStyle) value = element.currentStyle[attr];
      return value;
    }
  }

  (function () {
    var style = fabric.document.documentElement.style;

    var selectProp = 'userSelect' in style
      ? 'userSelect'
      : 'MozUserSelect' in style
        ? 'MozUserSelect'
        : 'WebkitUserSelect' in style
          ? 'WebkitUserSelect'
          : 'KhtmlUserSelect' in style
            ? 'KhtmlUserSelect'
            : '';

    /**
     * Makes element unselectable
     * @memberOf fabric.util
     * @param {HTMLElement} element Element to make unselectable
     * @return {HTMLElement} Element that was passed in
     */
    function makeElementUnselectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = fabric.util.falseFunction;
      }
      if (selectProp) {
        element.style[selectProp] = 'none';
      }
      else if (typeof element.unselectable === 'string') {
        element.unselectable = 'on';
      }
      return element;
    }

    /**
     * Makes element selectable
     * @memberOf fabric.util
     * @param {HTMLElement} element Element to make selectable
     * @return {HTMLElement} Element that was passed in
     */
    function makeElementSelectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = null;
      }
      if (selectProp) {
        element.style[selectProp] = '';
      }
      else if (typeof element.unselectable === 'string') {
        element.unselectable = '';
      }
      return element;
    }

    fabric.util.makeElementUnselectable = makeElementUnselectable;
    fabric.util.makeElementSelectable = makeElementSelectable;
  })();

  (function() {

    /**
     * Inserts a script element with a given url into a document; invokes callback, when that script is finished loading
     * @memberOf fabric.util
     * @param {String} url URL of a script to load
     * @param {Function} callback Callback to execute when script is finished loading
     */
    function getScript(url, callback) {
      var headEl = fabric.document.getElementsByTagName("head")[0],
          scriptEl = fabric.document.createElement('script'),
          loading = true;

      /** @ignore */
      scriptEl.onload = /** @ignore */ scriptEl.onreadystatechange = function(e) {
        if (loading) {
          if (typeof this.readyState === 'string' &&
              this.readyState !== 'loaded' &&
              this.readyState !== 'complete') return;
          loading = false;
          callback(e || fabric.window.event);
          scriptEl = scriptEl.onload = scriptEl.onreadystatechange = null;
        }
      };
      scriptEl.src = url;
      headEl.appendChild(scriptEl);
      // causes issue in Opera
      // headEl.removeChild(scriptEl);
    }

    fabric.util.getScript = getScript;
  })();

  fabric.util.getById = getById;
  fabric.util.toArray = toArray;
  fabric.util.makeElement = makeElement;
  fabric.util.addClass = addClass;
  fabric.util.wrapElement = wrapElement;
  fabric.util.getElementOffset = getElementOffset;
  fabric.util.getElementStyle = getElementStyle;

})();
(function(){

  function addParamToUrl(url, param) {
    return url + (/\?/.test(url) ? '&' : '?') + param;
  }

  var makeXHR = (function() {
    var factories = [
      function() { return new ActiveXObject("Microsoft.XMLHTTP"); },
      function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
      function() { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); },
      function() { return new XMLHttpRequest(); }
    ];
    for (var i = factories.length; i--; ) {
      try {
        var req = factories[i]();
        if (req) {
          return factories[i];
        }
      }
      catch (err) { }
    }
  })();

  function emptyFn() { }

  /**
   * Cross-browser abstraction for sending XMLHttpRequest
   * @memberOf fabric.util
   * @param {String} url URL to send XMLHttpRequest to
   * @param {Object} [options] Options object
   * @param {String} [options.method="GET"]
   * @param {Function} options.onComplete Callback to invoke when request is completed
   * @return {XMLHttpRequest} request
   */
  function request(url, options) {

    options || (options = { });

    var method = options.method ? options.method.toUpperCase() : 'GET',
        onComplete = options.onComplete || function() { },
        xhr = makeXHR(),
        body;

    /** @ignore */
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        onComplete(xhr);
        xhr.onreadystatechange = emptyFn;
      }
    };

    if (method === 'GET') {
      body = null;
      if (typeof options.parameters === 'string') {
        url = addParamToUrl(url, options.parameters);
      }
    }

    xhr.open(method, url, true);

    if (method === 'POST' || method === 'PUT') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.send(body);
    return xhr;
  }

  fabric.util.request = request;
})();
(function(global) {

  "use strict";

  /* Adaptation of work of Kevin Lindsey (kevin@kevlindev.com) */

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Point) {
    fabric.warn('fabric.Point is already defined');
    return;
  }

  fabric.Point = Point;

  /**
   * Point class
   * @class fabric.Point
   * @constructor
   * @param {Number} x
   * @param {Number} y
   * @return {fabric.Point} thisArg
   */
  function Point(x, y) {
    if (arguments.length > 0) {
      this.init(x, y);
    }
  }

  Point.prototype = /** @lends fabric.Point.prototype */ {

    constructor: Point,

    /**
     * Constructor
     * @param {Number} x left offset
     * @param {Number} y top offset
     */
    init: function (x, y) {
      this.x = x;
      this.y = y;
    },

    /**
     * Adds another point to this one and returns another one
     * @param {fabric.Point} that
     * @return {fabric.Point} new Point instance with added values
     */
    add: function (that) {
      return new Point(this.x + that.x, this.y + that.y);
    },

    /**
     * Adds another point to this one
     * @param {fabric.Point} that
     * @return {fabric.Point} thisArg
     */
    addEquals: function (that) {
      this.x += that.x;
      this.y += that.y;
      return this;
    },

    /**
     * Adds value to this point and returns a new one
     * @param {Number} scalar
     * @return {fabric.Point} new Point with added value
     */
    scalarAdd: function (scalar) {
      return new Point(this.x + scalar, this.y + scalar);
    },

    /**
     * Adds value to this point
     * @param {Number} scalar
     * @param {fabric.Point} thisArg
     */
    scalarAddEquals: function (scalar) {
      this.x += scalar;
      this.y += scalar;
      return this;
    },

    /**
     * Subtracts another point from this point and returns a new one
     * @param {fabric.Point} that
     * @return {fabric.Point} new Point object with subtracted values
     */
    subtract: function (that) {
      return new Point(this.x - that.x, this.y - that.y);
    },

    /**
     * Subtracts another point from this point
     * @param {fabric.Point} that
     * @return {fabric.Point} thisArg
     */
    subtractEquals: function (that) {
      this.x -= that.x;
      this.y -= that.y;
      return this;
    },

    /**
     * Subtracts value from this point and returns a new one
     * @param {Number} scalar
     * @return {fabric.Point}
     */
    scalarSubtract: function (scalar) {
      return new Point(this.x - scalar, this.y - scalar);
    },

    /**
     * Subtracts value from this point
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     */
    scalarSubtractEquals: function (scalar) {
      this.x -= scalar;
      this.y -= scalar;
      return this;
    },

    /**
     * Miltiplies this point by a value and returns a new one
     * @param {Number} scalar
     * @return {fabric.Point}
     */
    multiply: function (scalar) {
      return new Point(this.x * scalar, this.y * scalar);
    },

    /**
     * Miltiplies this point by a value
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     */
    multiplyEquals: function (scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    },

    /**
     * Divides this point by a value and returns a new one
     * @param {Number} scalar
     * @return {fabric.Point}
     */
    divide: function (scalar) {
      return new Point(this.x / scalar, this.y / scalar);
    },

    /**
     * Divides this point by a value
     * @param {Number} scalar
     * @return {fabric.Point} thisArg
     */
    divideEquals: function (scalar) {
      this.x /= scalar;
      this.y /= scalar;
      return this;
    },

    /**
     * Returns true if this point is equal to another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    eq: function (that) {
      return (this.x === that.x && this.y === that.y);
    },

    /**
     * Returns true if this point is less than another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    lt: function (that) {
      return (this.x < that.x && this.y < that.y);
    },

    /**
     * Returns true if this point is less than or equal to another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    lte: function (that) {
      return (this.x <= that.x && this.y <= that.y);
    },

    /**

     * Returns true if this point is greater another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    gt: function (that) {
      return (this.x > that.x && this.y > that.y);
    },

    /**
     * Returns true if this point is greater than or equal to another one
     * @param {fabric.Point} that
     * @return {Boolean}
     */
    gte: function (that) {
      return (this.x >= that.x && this.y >= that.y);
    },

    /**
     * Returns new point which is the result of linear interpolation with this one and another one
     * @param {fabric.Point} that
     * @param {Number} t
     * @return {fabric.Point}
     */
    lerp: function (that, t) {
      return new Point(this.x + (that.x - this.x) * t, this.y + (that.y - this.y) * t);
    },

    /**
     * Returns distance from this point and another one
     * @param {fabric.Point} that
     * @return {Number}
     */
    distanceFrom: function (that) {
      var dx = this.x - that.x,
          dy = this.y - that.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Returns the point between this point and another one
     * @param {fabric.Point} that
     * @return {fabric.Point}
     */
    midPointFrom: function (that) {
      return new Point(this.x + (that.x - this.x)/2, this.y + (that.y - this.y)/2);
    },

    /**
     * Returns a new point which is the min of this and another one
     * @param {fabric.Point} that
     * @return {fabric.Point}
     */
    min: function (that) {
      return new Point(Math.min(this.x, that.x), Math.min(this.y, that.y));
    },

    /**
     * Returns a new point which is the max of this and another one
     * @param {fabric.Point} that
     * @return {fabric.Point}
     */
    max: function (that) {
      return new Point(Math.max(this.x, that.x), Math.max(this.y, that.y));
    },

    /**
     * Returns string representation of this point
     * @return {String}
     */
    toString: function () {
      return this.x + "," + this.y;
    },

    /**
     * Sets x/y of this point
     * @param {Number} x
     * @return {Number} y
     */
    setXY: function (x, y) {
      this.x = x;
      this.y = y;
    },

    /**
     * Sets x/y of this point from another point
     * @param {fabric.Point} that
     */
    setFromPoint: function (that) {
      this.x = that.x;
      this.y = that.y;
    },

    /**
     * Swaps x/y of this point and another point
     * @param {fabric.Point} that
     */
    swap: function (that) {
      var x = this.x,
          y = this.y;
      this.x = that.x;
      this.y = that.y;
      that.x = x;
      that.y = y;
    }
  };

})(typeof exports !== 'undefined' ? exports : this);
(function() {

  /* _FROM_SVG_START_ */
  function getColorStop(el) {
    var style = el.getAttribute('style'),
        offset = el.getAttribute('offset'),
        color, opacity;

    // convert percents to absolute values
    offset = parseFloat(offset) / (/%$/.test(offset) ? 100 : 1);

    if (style) {
      var keyValuePairs = style.split(/\s*;\s*/);

      if (keyValuePairs[keyValuePairs.length-1] === '') {
        keyValuePairs.pop();
      }

      for (var i = keyValuePairs.length; i--; ) {

        var split = keyValuePairs[i].split(/\s*:\s*/),
            key = split[0].trim(),
            value = split[1].trim();

        if (key === 'stop-color') {
          color = value;
        }
        else if (key === 'stop-opacity') {
          opacity = value;
        }
      }
    }

    if (!color) {
      color = el.getAttribute('stop-color');
    }
    if (!opacity) {
      opacity = el.getAttribute('stop-opacity');
    }

    // convert rgba color to rgb color - alpha value has no affect in svg
    color = new fabric.Color(color).toRgb();

    return {
      offset: offset,
      color: color,
      opacity: opacity
    };
  }
  /* _FROM_SVG_END_ */

  /**
   * Gradient class
   * @class fabric.Gradient
   */
  fabric.Gradient = fabric.util.createClass(/** @lends fabric.Gradient.prototype */ {

    /**
     * Constructor
     * @param {Object} [options] Options object with type, coords, gradientUnits and colorStops
     * @return {fabric.Gradient} thisArg
     */
    initialize: function(options) {
      options || (options = { });

      var coords = { };

      this.id = fabric.Object.__uid++;
      this.type = options.type || 'linear';

      coords = {
        x1: options.coords.x1 || 0,
        y1: options.coords.y1 || 0,
        x2: options.coords.x2 || 0,
        y2: options.coords.y2 || 0
      };

      if (this.type === 'radial') {
        coords.r1 = options.coords.r1 || 0;
        coords.r2 = options.coords.r2 || 0;
      }

      this.coords = coords;
      this.gradientUnits = options.gradientUnits || 'objectBoundingBox';
      this.colorStops = options.colorStops.slice();
    },

    /**
     * Adds another colorStop
     * @param {Object} colorStop Object with offset and color
     * @return {fabric.Gradient} thisArg
     */
    addColorStop: function(colorStop) {
      for (var position in colorStop) {
        var color = new fabric.Color(colorStop[position]);
        this.colorStops.push({offset: position, color: color.toRgb(), opacity: color.getAlpha()});
      }
      return this;
    },

    /**
     * Returns object representation of a gradient
     * @return {Object}
     */
    toObject: function() {
      return {
        type: this.type,
        coords: this.coords,
        gradientUnits: this.gradientUnits,
        colorStops: this.colorStops
      };
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an gradient
     * @param {Object} object Object to create a gradient for
     * @param {Boolean} normalize Whether coords should be normalized
     * @return {String} SVG representation of an gradient (linear/radial)
     */
    toSVG: function(object, normalize) {
      var coords = fabric.util.object.clone(this.coords),
          markup;

      // colorStops must be sorted ascending
      this.colorStops.sort(function(a, b) {
        return a.offset - b.offset;
      });

      if (normalize && this.gradientUnits === 'userSpaceOnUse') {
        coords.x1 += object.width / 2;
        coords.y1 += object.height / 2;
        coords.x2 += object.width / 2;
        coords.y2 += object.height / 2;
      }
      else if (this.gradientUnits === 'objectBoundingBox') {
        _convertValuesToPercentUnits(object, coords);
      }

      if (this.type === 'linear') {
        markup = [
          '<linearGradient ',
            'id="SVGID_', this.id,
            '" gradientUnits="', this.gradientUnits,
            '" x1="', coords.x1,
            '" y1="', coords.y1,
            '" x2="', coords.x2,
            '" y2="', coords.y2,
          '">'
        ];
      }
      else if (this.type === 'radial') {
        markup = [
          '<radialGradient ',
            'id="SVGID_', this.id,
            '" gradientUnits="', this.gradientUnits,
            '" cx="', coords.x2,
            '" cy="', coords.y2,
            '" r="', coords.r2,
            '" fx="', coords.x1,
            '" fy="', coords.y1,
          '">'
        ];
      }

      for (var i = 0; i < this.colorStops.length; i++) {
        markup.push(
          '<stop ',
            'offset="', (this.colorStops[i].offset * 100) + '%',
            '" style="stop-color:', this.colorStops[i].color,
            (this.colorStops[i].opacity ? ';stop-opacity: ' + this.colorStops[i].opacity : ';'),
          '"/>'
        );
      }

      markup.push((this.type === 'linear' ? '</linearGradient>' : '</radialGradient>'));

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns an instance of CanvasGradient
     * @param ctx
     * @return {CanvasGradient}
     */
    toLive: function(ctx) {
      var gradient;

      if (!this.type) return;

      if (this.type === 'linear') {
        gradient = ctx.createLinearGradient(
          this.coords.x1, this.coords.y1, this.coords.x2 || ctx.canvas.width, this.coords.y2);
      }
      else if (this.type === 'radial') {
        gradient = ctx.createRadialGradient(
          this.coords.x1, this.coords.y1, this.coords.r1, this.coords.x2, this.coords.y2, this.coords.r2);
      }

      for (var i = 0; i < this.colorStops.length; i++) {
        var color = this.colorStops[i].color,
            opacity = this.colorStops[i].opacity,
            offset = this.colorStops[i].offset;

        if (opacity) {
          color = new fabric.Color(color).setAlpha(opacity).toRgba();
        }
        gradient.addColorStop(parseFloat(offset), color);
      }

      return gradient;
    }
  });

  fabric.util.object.extend(fabric.Gradient, {

    /* _FROM_SVG_START_ */
    /**
     * Returns {@link fabric.Gradient} instance from an SVG element
     * @static
     * @memberof fabric.Gradient
     * @see http://www.w3.org/TR/SVG/pservers.html#LinearGradientElement
     * @see http://www.w3.org/TR/SVG/pservers.html#RadialGradientElement
     */
    fromElement: function(el, instance) {

      /**
       *  @example:
       *
       *  <linearGradient id="linearGrad1">
       *    <stop offset="0%" stop-color="white"/>
       *    <stop offset="100%" stop-color="black"/>
       *  </linearGradient>
       *
       *  OR
       *
       *  <linearGradient id="linearGrad2">
       *    <stop offset="0" style="stop-color:rgb(255,255,255)"/>
       *    <stop offset="1" style="stop-color:rgb(0,0,0)"/>
       *  </linearGradient>
       *
       *  OR
       *
       *  <radialGradient id="radialGrad1">
       *    <stop offset="0%" stop-color="white" stop-opacity="1" />
       *    <stop offset="50%" stop-color="black" stop-opacity="0.5" />
       *    <stop offset="100%" stop-color="white" stop-opacity="1" />
       *  </radialGradient>
       *
       *  OR
       *
       *  <radialGradient id="radialGrad2">
       *    <stop offset="0" stop-color="rgb(255,255,255)" />
       *    <stop offset="0.5" stop-color="rgb(0,0,0)" />
       *    <stop offset="1" stop-color="rgb(255,255,255)" />
       *  </radialGradient>
       *
       */

      var colorStopEls = el.getElementsByTagName('stop'),
          type = (el.nodeName === 'linearGradient' ? 'linear' : 'radial'),
          gradientUnits = el.getAttribute('gradientUnits') || 'objectBoundingBox',
          colorStops = [],
          coords = { };

      if (type === 'linear') {
        coords = {
          x1: el.getAttribute('x1') || 0,
          y1: el.getAttribute('y1') || 0,
          x2: el.getAttribute('x2') || '100%',
          y2: el.getAttribute('y2') || 0
        };
      }
      else if (type === 'radial') {
        coords = {
          x1: el.getAttribute('fx') || el.getAttribute('cx') || '50%',
          y1: el.getAttribute('fy') || el.getAttribute('cy') || '50%',
          r1: 0,
          x2: el.getAttribute('cx') || '50%',
          y2: el.getAttribute('cy') || '50%',
          r2: el.getAttribute('r') || '50%'
        };
      }

      for (var i = colorStopEls.length; i--; ) {
        colorStops.push(getColorStop(colorStopEls[i]));
      }

      _convertPercentUnitsToValues(instance, coords);

      return new fabric.Gradient({
        type: type,
        coords: coords,
        gradientUnits: gradientUnits,
        colorStops: colorStops
      });
    },
    /* _FROM_SVG_END_ */

    /**
     * Returns {@link fabric.Gradient} instance from its object representation
     * @static
     * @param {Object} obj
     * @param {Object} [options] Options object
     * @memberof fabric.Gradient
     */
    forObject: function(obj, options) {
      options || (options = { });
      _convertPercentUnitsToValues(obj, options);
      return new fabric.Gradient(options);
    }
  });

  /**
   * @private
   */
  function _convertPercentUnitsToValues(object, options) {
    for (var prop in options) {
      if (typeof options[prop] === 'string' && /^\d+%$/.test(options[prop])) {
        var percents = parseFloat(options[prop], 10);
        if (prop === 'x1' || prop === 'x2' || prop === 'r2') {
          options[prop] = fabric.util.toFixed(object.width * percents / 100, 2);
        }
        else if (prop === 'y1' || prop === 'y2') {
          options[prop] = fabric.util.toFixed(object.height * percents / 100, 2);
        }
      }
      // normalize rendering point (should be from top/left corner rather than center of the shape)
      if (prop === 'x1' || prop === 'x2') {
        options[prop] -= fabric.util.toFixed(object.width / 2, 2);
      }
      else if (prop === 'y1' || prop === 'y2') {
        options[prop] -= fabric.util.toFixed(object.height / 2, 2);
      }
    }
  }

  /* _TO_SVG_START_ */
  /**
   * @private
   */
  function _convertValuesToPercentUnits(object, options) {
    for (var prop in options) {
      // normalize rendering point (should be from center rather than top/left corner of the shape)
      if (prop === 'x1' || prop === 'x2') {
        options[prop] += fabric.util.toFixed(object.width / 2, 2);
      }
      else if (prop === 'y1' || prop === 'y2') {
        options[prop] += fabric.util.toFixed(object.height / 2, 2);
      }
      // convert to percent units
      if (prop === 'x1' || prop === 'x2' || prop === 'r2') {
        options[prop] = fabric.util.toFixed(options[prop] / object.width * 100, 2) + '%';
      }
      else if (prop === 'y1' || prop === 'y2') {
        options[prop] = fabric.util.toFixed(options[prop] / object.height * 100, 2) + '%';
      }
    }
  }
  /* _TO_SVG_END_ */

})();
/**
 * Pattern class
 * @class fabric.Pattern
 */
fabric.Pattern = fabric.util.createClass(/** @lends fabric.Pattern.prototype */ {

  /**
   * Repeat property of a pattern (one of repeat, repeat-x, repeat-y)
   * @type String
   */
  repeat: 'repeat',

  /**
   * Pattern horizontal offset from object's left/top corner
   * @type Number
   */
  offsetX: 0,

  /**
   * Pattern vertical offset from object's left/top corner
   * @type Number
   */
  offsetY: 0,

  /**
   * Constructor
   * @param {Object} [options]
   * @return {fabric.Pattern} thisArg
   */
  initialize: function(options) {
    options || (options = { });

    if (options.source) {
      this.source = typeof options.source === 'string'
        ? new Function(options.source)
        : options.source;
    }
    if (options.repeat) {
      this.repeat = options.repeat;
    }
    if (options.offsetX) {
      this.offsetX = options.offsetX;
    }
    if (options.offsetY) {
      this.offsetY = options.offsetY;
    }
  },

  /**
   * Returns object representation of a pattern
   * @return {Object}
   */
  toObject: function() {

    var source;

    // callback
    if (typeof this.source === 'function') {
      source = String(this.source)
                .match(/function\s+\w*\s*\(.*\)\s+\{([\s\S]*)\}/)[1];
    }
    // <img> element
    else if (typeof this.source.src === 'string') {
      source = this.source.src;
    }

    return {
      source: source,
      repeat: this.repeat,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  },

  /**
   * Returns an instance of CanvasPattern
   * @param ctx
   * @return {CanvasPattern}
   */
  toLive: function(ctx) {
    var source = typeof this.source === 'function' ? this.source() : this.source;
    return ctx.createPattern(source, this.repeat);
  }
});
/**
 * Shadow class
 * @class fabric.Shadow
 */
fabric.Shadow = fabric.util.createClass(/** @lends fabric.Shadow.prototype */ {

  /**
   * Shadow color
   * @type String
   */
  color: 'rgb(0,0,0)',

  /**
   * Shadow blur
   * @type Number
   */
  blur: 0,

  /**
   * Shadow horizontal offset
   * @type Number
   */
  offsetX: 0,

  /**
   * Shadow vertical offset
   * @type Number
   */
  offsetY: 0,

  /**
   * Whether the shadow should affect stroke operations
   * @type Boolean
   */
  affectStroke: false,

  /**
   * Constructor
   * @param [options] Options object with any of color, blur, offsetX, offsetX properties
   * @return {fabric.Shadow} thisArg
   */
  initialize: function(options) {
    for (var prop in options) {
      this[prop] = options[prop];
    }
  },

  /**
   * Returns object representation of a shadow
   * @return {Object}
   */
  toObject: function() {
    return {
      color: this.color,
      blur: this.blur,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  },

  /* _TO_SVG_START_ */
  /**
   * Returns SVG representation of a shadow
   * @return {String}
   */
  toSVG: function() {

  }
  /* _TO_SVG_END_ */
});
(function(global) {

  "use strict";

  /* Adaptation of work of Kevin Lindsey (kevin@kevlindev.com) */

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Intersection) {
    fabric.warn('fabric.Intersection is already defined');
    return;
  }

  /**
   * Intersection class
   * @class fabric.Intersection
   * @constructor
   */
  function Intersection(status) {
    if (arguments.length > 0) {
      this.init(status);
    }
  }

  fabric.Intersection = Intersection;

  fabric.Intersection.prototype = /** @lends fabric.Intersection.prototype */ {

    /**
     * Constructor
     * @param {String} status
     */
    init: function (status) {
      this.status = status;
      this.points = [];
    },

    /**
     * Appends a point to intersection
     * @param {fabric.Point} point
     */
    appendPoint: function (point) {
      this.points.push(point);
    },

    /**
     * Appends points to intersection
     * @param {Array} points
     */
    appendPoints: function (points) {
      this.points = this.points.concat(points);
    }
  };

  /**
   * Checks if one line intersects another
   * @static
   * @param {fabric.Point} a1
   * @param {fabric.Point} a2
   * @param {fabric.Point} b1
   * @param {fabric.Point} b2
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectLineLine = function (a1, a2, b1, b2) {
    var result,
        ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
        ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
        u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b !== 0) {
      var ua = ua_t / u_b,
          ub = ub_t / u_b;
      if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        result = new Intersection("Intersection");
        result.points.push(new fabric.Point(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
      }
      else {
        result = new Intersection("No Intersection");
      }
    }
    else {
      if (ua_t === 0 || ub_t === 0) {
        result = new Intersection("Coincident");
      }
      else {
        result = new Intersection("Parallel");
      }
    }
    return result;
  };

  /**
   * Checks if line intersects polygon
   * @static
   * @param {fabric.Point} a1
   * @param {fabric.Point} a2
   * @param {Array} points
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectLinePolygon = function(a1,a2,points){
    var result = new Intersection("No Intersection"),
        length = points.length;

    for (var i = 0; i < length; i++) {
      var b1 = points[i],
          b2 = points[(i+1) % length],
          inter = Intersection.intersectLineLine(a1, a2, b1, b2);

      result.appendPoints(inter.points);
    }
    if (result.points.length > 0) {
      result.status = "Intersection";
    }
    return result;
  };

  /**
   * Checks if polygon intersects another polygon
   * @static
   * @param {Array} points1
   * @param {Array} points2
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectPolygonPolygon = function (points1, points2) {
    var result = new Intersection("No Intersection"),
        length = points1.length;

    for (var i = 0; i < length; i++) {
      var a1 = points1[i],
          a2 = points1[(i+1) % length],
          inter = Intersection.intersectLinePolygon(a1, a2, points2);

      result.appendPoints(inter.points);
    }
    if (result.points.length > 0) {
      result.status = "Intersection";
    }
    return result;
  };

  /**
   * Checks if polygon intersects rectangle

   * @static
   * @param {Array} points
   * @param {Number} r1
   * @param {Number} r2
   * @return {fabric.Intersection}
   */
  fabric.Intersection.intersectPolygonRectangle = function (points, r1, r2) {
    var min = r1.min(r2),
        max = r1.max(r2),
        topRight = new fabric.Point(max.x, min.y),
        bottomLeft = new fabric.Point(min.x, max.y),
        inter1 = Intersection.intersectLinePolygon(min, topRight, points),
        inter2 = Intersection.intersectLinePolygon(topRight, max, points),
        inter3 = Intersection.intersectLinePolygon(max, bottomLeft, points),
        inter4 = Intersection.intersectLinePolygon(bottomLeft, min, points),
        result = new Intersection("No Intersection");

    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);

    if (result.points.length > 0) {
      result.status = "Intersection";
    }
    return result;
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Color) {
    fabric.warn('fabric.Color is already defined.');
    return;
  }

  /**
   * Color class
   * The purpose of {@link fabric.Color} is to abstract and encapsulate common color operations;
   * {@link fabric.Color} is a constructor and creates instances of {@link fabric.Color} objects.
   *
   * @class fabric.Color
   * @param {String} color optional in hex or rgb(a) format
   * @return {fabric.Color} thisArg
   */
  function Color(color) {
    if (!color) {
      this.setSource([0, 0, 0, 1]);
    }
    else {
      this._tryParsingColor(color);
    }
  }

  fabric.Color = Color;

  fabric.Color.prototype = /** @lends fabric.Color.prototype */ {

    /**
     * @private
     * @param {String|Array} color Color value to parse
     */
    _tryParsingColor: function(color) {
      var source;

      if (color in Color.colorNameMap) {
        color = Color.colorNameMap[color];
      }

      source = Color.sourceFromHex(color);

      if (!source) {
        source = Color.sourceFromRgb(color);
      }
      if (!source) {
        source = Color.sourceFromHsl(color);
      }
      if (source) {
        this.setSource(source);
      }
    },

    /**
     * Adapted from <a href="https://rawgithub.com/mjijackson/mjijackson.github.com/master/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript.html">https://github.com/mjijackson</a>
     * @private
     * @param {Number} r Red color value
     * @param {Number} g Green color value
     * @param {Number} b Blue color value
     * @return {Array} Hsl color
     */
    _rgbToHsl: function(r, g, b) {
      r /= 255, g /= 255, b /= 255;

      var h, s, l,
          max = fabric.util.array.max([r, g, b]),
          min = fabric.util.array.min([r, g, b]);

      l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      }
      else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      return [
        Math.round(h * 360),
        Math.round(s * 100),
        Math.round(l * 100)
      ];
    },

    /**
     * Returns source of this color (where source is an array representation; ex: [200, 200, 100, 1])
     * @return {Array}
     */
    getSource: function() {
      return this._source;
    },

    /**
     * Sets source of this color (where source is an array representation; ex: [200, 200, 100, 1])
     * @param {Array} source
     */
    setSource: function(source) {
      this._source = source;
    },

    /**
     * Returns color represenation in RGB format
     * @return {String} ex: rgb(0-255,0-255,0-255)
     */
    toRgb: function() {
      var source = this.getSource();
      return 'rgb(' + source[0] + ',' + source[1] + ',' + source[2] + ')';
    },

    /**
     * Returns color represenation in RGBA format
     * @return {String} ex: rgba(0-255,0-255,0-255,0-1)
     */
    toRgba: function() {
      var source = this.getSource();
      return 'rgba(' + source[0] + ',' + source[1] + ',' + source[2] + ',' + source[3] + ')';
    },

    /**
     * Returns color represenation in HSL format
     * @return {String} ex: hsl(0-360,0%-100%,0%-100%)
     */
    toHsl: function() {
      var source = this.getSource(),
          hsl = this._rgbToHsl(source[0], source[1], source[2]);

      return 'hsl(' + hsl[0] + ',' + hsl[1] + '%,' + hsl[2] + '%)';
    },

    /**
     * Returns color represenation in HSLA format
     * @return {String} ex: hsla(0-360,0%-100%,0%-100%,0-1)
     */
    toHsla: function() {
      var source = this.getSource(),
          hsl = this._rgbToHsl(source[0], source[1], source[2]);

      return 'hsla(' + hsl[0] + ',' + hsl[1] + '%,' + hsl[2] + '%,' + source[3] + ')';
    },

    /**
     * Returns color represenation in HEX format
     * @return {String} ex: FF5555
     */
    toHex: function() {
      var source = this.getSource();

      var r = source[0].toString(16);
      r = (r.length === 1) ? ('0' + r) : r;

      var g = source[1].toString(16);
      g = (g.length === 1) ? ('0' + g) : g;

      var b = source[2].toString(16);
      b = (b.length === 1) ? ('0' + b) : b;

      return r.toUpperCase() + g.toUpperCase() + b.toUpperCase();
    },

    /**
     * Gets value of alpha channel for this color
     * @return {Number} 0-1
     */
    getAlpha: function() {
      return this.getSource()[3];
    },

    /**
     * Sets value of alpha channel for this color
     * @param {Number} alpha 0-1
     * @return {fabric.Color} thisArg
     */
    setAlpha: function(alpha) {
      var source = this.getSource();
      source[3] = alpha;
      this.setSource(source);
      return this;
    },

    /**
     * Transforms color to its grayscale representation
     * @return {fabric.Color} thisArg
     */
    toGrayscale: function() {
      var source = this.getSource(),
          average = parseInt((source[0] * 0.3 + source[1] * 0.59 + source[2] * 0.11).toFixed(0), 10),
          currentAlpha = source[3];
      this.setSource([average, average, average, currentAlpha]);
      return this;
    },

    /**
     * Transforms color to its black and white representation
     * @param {Number} threshold
     * @return {fabric.Color} thisArg
     */
    toBlackWhite: function(threshold) {
      var source = this.getSource(),
          average = (source[0] * 0.3 + source[1] * 0.59 + source[2] * 0.11).toFixed(0),
          currentAlpha = source[3];

      threshold = threshold || 127;

      average = (Number(average) < Number(threshold)) ? 0 : 255;
      this.setSource([average, average, average, currentAlpha]);
      return this;
    },

    /**
     * Overlays color with another color
     * @param {String|fabric.Color} otherColor
     * @return {fabric.Color} thisArg
     */
    overlayWith: function(otherColor) {
      if (!(otherColor instanceof Color)) {
        otherColor = new Color(otherColor);
      }

      var result = [],
          alpha = this.getAlpha(),
          otherAlpha = 0.5,
          source = this.getSource(),
          otherSource = otherColor.getSource();

      for (var i = 0; i < 3; i++) {
        result.push(Math.round((source[i] * (1 - otherAlpha)) + (otherSource[i] * otherAlpha)));
      }

      result[3] = alpha;
      this.setSource(result);
      return this;
    }
  };

  /**
   * Regex matching color in RGB or RGBA formats (ex: rgb(0, 0, 0), rgba(255, 100, 10, 0.5), rgba( 255 , 100 , 10 , 0.5 ), rgb(1,1,1), rgba(100%, 60%, 10%, 0.5))
   * @static
   * @field
   */
  fabric.Color.reRGBa = /^rgba?\(\s*(\d{1,3}\%?)\s*,\s*(\d{1,3}\%?)\s*,\s*(\d{1,3}\%?)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/;

  /**
   * Regex matching color in HSL or HSLA formats (ex: hsl(200, 80%, 10%), hsla(300, 50%, 80%, 0.5), hsla( 300 , 50% , 80% , 0.5 ))
   * @static
   * @field
   */
  fabric.Color.reHSLa = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/;

  /**
   * Regex matching color in HEX format (ex: #FF5555, 010155, aff)
   * @static
   * @field
   */
  fabric.Color.reHex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

  /**
   * Map of the 16 basic color names with HEX code
   * @static
   * @field
   */
  fabric.Color.colorNameMap = {
    'aqua':    '#00FFFF',
    'black':   '#000000',
    'blue':    '#0000FF',
    'fuchsia': '#FF00FF',
    'gray':    '#808080',
    'green':   '#008000',
    'lime':    '#00FF00',
    'maroon':  '#800000',
    'navy':    '#000080',
    'olive':   '#808000',
    'purple':  '#800080',
    'red':     '#FF0000',
    'silver':  '#C0C0C0',
    'teal':    '#008080',
    'white':   '#FFFFFF',
    'yellow':  '#FFFF00'
  };

  /**
   * @private
   * @param {Number} p
   * @param {Number} q
   * @param {Number} t
   * @return {Number}
   */
  function hue2rgb(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
  }

  /**
   * Returns new color object, when given a color in RGB format
   * @param {String} color ex: rgb(0-255,0-255,0-255)
   * @return {fabric.Color}
   */
  fabric.Color.fromRgb = function(color) {
    return Color.fromSource(Color.sourceFromRgb(color));
  };

  /**
   * Returns array represenatation (ex: [100, 100, 200, 1]) of a color that's in RGB or RGBA format
   * @param {String} color ex: rgb(0-255,0-255,0-255), rgb(0%-100%,0%-100%,0%-100%)
   * @return {Array} source
   */
  fabric.Color.sourceFromRgb = function(color) {
    var match = color.match(Color.reRGBa);
    if (match) {
      var r = parseInt(match[1], 10) / (/%$/.test(match[1]) ? 100 : 1) * (/%$/.test(match[1]) ? 255 : 1),
          g = parseInt(match[2], 10) / (/%$/.test(match[2]) ? 100 : 1) * (/%$/.test(match[2]) ? 255 : 1),
          b = parseInt(match[3], 10) / (/%$/.test(match[3]) ? 100 : 1) * (/%$/.test(match[3]) ? 255 : 1);

      return [
        parseInt(r, 10),
        parseInt(g, 10),
        parseInt(b, 10),
        match[4] ? parseFloat(match[4]) : 1
      ];
    }
  };

  /**
   * Returns new color object, when given a color in RGBA format
   * @static
   * @function
   * @param {String} color
   * @return {fabric.Color}
   */
  fabric.Color.fromRgba = Color.fromRgb;

  /**
   * Returns new color object, when given a color in HSL format
   * @param {String} color ex: hsl(0-260,0%-100%,0%-100%)
   * @return {fabric.Color}
   */
  fabric.Color.fromHsl = function(color) {
    return Color.fromSource(Color.sourceFromHsl(color));
  };

  /**
   * Returns array represenatation (ex: [100, 100, 200, 1]) of a color that's in HSL or HSLA format.
   * Adapted from <a href="https://rawgithub.com/mjijackson/mjijackson.github.com/master/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript.html">https://github.com/mjijackson</a>
   * @param {String} color ex: hsl(0-360,0%-100%,0%-100%) or hsla(0-360,0%-100%,0%-100%, 0-1)
   * @return {Array} source
   * @see http://http://www.w3.org/TR/css3-color/#hsl-color
   */
  fabric.Color.sourceFromHsl = function(color) {
    var match = color.match(Color.reHSLa);
    if (!match) return;

    var h = (((parseFloat(match[1]) % 360) + 360) % 360) / 360,
        s = parseFloat(match[2]) / (/%$/.test(match[2]) ? 100 : 1),
        l = parseFloat(match[3]) / (/%$/.test(match[3]) ? 100 : 1),
        r, g, b;

    if (s === 0) {
      r = g = b = l;
    }
    else {
      var q = l <= 0.5 ? l * (s + 1) : l + s - l * s;
      var p = l * 2 - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
      match[4] ? parseFloat(match[4]) : 1
    ];
  };

  /**
   * Returns new color object, when given a color in HSLA format
   * @static
   * @function
   * @param {String} color
   * @return {fabric.Color}
   */
  fabric.Color.fromHsla = Color.fromHsl;

  /**
   * Returns new color object, when given a color in HEX format
   * @static
   * @return {fabric.Color}
   */
  fabric.Color.fromHex = function(color) {
    return Color.fromSource(Color.sourceFromHex(color));
  };

  /**
   * Returns array represenatation (ex: [100, 100, 200, 1]) of a color that's in HEX format
   * @static
   * @param {String} color ex: FF5555
   * @return {Array} source
   */
  fabric.Color.sourceFromHex = function(color) {
    if (color.match(Color.reHex)) {
      var value = color.slice(color.indexOf('#') + 1),
          isShortNotation = (value.length === 3),
          r = isShortNotation ? (value.charAt(0) + value.charAt(0)) : value.substring(0, 2),
          g = isShortNotation ? (value.charAt(1) + value.charAt(1)) : value.substring(2, 4),
          b = isShortNotation ? (value.charAt(2) + value.charAt(2)) : value.substring(4, 6);

      return [
        parseInt(r, 16),
        parseInt(g, 16),
        parseInt(b, 16),
        1
      ];
    }
  };

  /**
   * Returns new color object, when given color in array representation (ex: [200, 100, 100, 0.5])
   * @static
   * @param {Array} source
   * @return {fabric.Color}
   */
  fabric.Color.fromSource = function(source) {
    var oColor = new Color();
    oColor.setSource(source);
    return oColor;
  };

})(typeof exports !== 'undefined' ? exports : this);
(function () {

  "use strict";

  if (fabric.StaticCanvas) {
    fabric.warn('fabric.StaticCanvas is already defined.');
    return;
  }

  // aliases for faster resolution
  var extend = fabric.util.object.extend,
      getElementOffset = fabric.util.getElementOffset,
      removeFromArray = fabric.util.removeFromArray,
      removeListener = fabric.util.removeListener,

      CANVAS_INIT_ERROR = new Error('Could not initialize `canvas` element');

  /**
   * Static canvas class
   * @class fabric.StaticCanvas
   * @constructor
   *
   * @param {HTMLElement | String} el &lt;canvas> element to initialize instance on
   * @param {Object} [options] Options object
   *
   * @extends fabric.Collection
   * @extends fabric.Observable
   */
  fabric.StaticCanvas = function (el, options) {
    options || (options = { });

    this._initStatic(el, options);
    fabric.StaticCanvas.activeInstance = this;
  };

  extend(fabric.StaticCanvas.prototype, fabric.Observable);
  extend(fabric.StaticCanvas.prototype, fabric.Collection);

  extend(fabric.StaticCanvas.prototype, /** @lends fabric.StaticCanvas.prototype */ {

    /**
     * Background color of canvas instance
     * @type String
     */
    backgroundColor: '',

    /**
     * Background image of canvas instance
     * Should be set via {@link fabric.StaticCanvas#setBackgroundImage}
     * @type String
     */
    backgroundImage: '',

    /**
     * Opacity of the background image of the canvas instance
     * @type Float
     */
    backgroundImageOpacity: 1.0,

    /**
     * Indicates whether the background image should be stretched to fit the
     * dimensions of the canvas instance.
     * @type Boolean
     */
    backgroundImageStretch: true,

    /**
     * Overlay image of canvas instance
     * Should be set via {@link fabric.StaticCanvas#setOverlayImage}
     * @type String
     */
    overlayImage: '',

    /**
     * Left offset of overlay image (if present)
     * @type Number
     */
    overlayImageLeft: 0,

    /**
     * Top offset of overlay image (if present)
     * @type Number
     */
    overlayImageTop: 0,

    /**
     * Indicates whether toObject/toDatalessObject should include default values
     * @type Boolean
     */
    includeDefaultValues: true,

    /**
     * Indicates whether objects' state should be saved
     * @type Boolean
     */
    stateful: true,

    /**
     * Indicates whether {@link fabric.Canvas.prototype.add} should also re-render canvas.
     * Disabling this option could give a great performance boost when adding a lot of objects to canvas at once
     * (followed by a manual rendering after addition)
     * @type Boolean
     */
    renderOnAddition: true,

    /**
     * Function that determines clipping of entire canvas area
     * Being passed context as first argument. See clipping canvas area in {@link https://github.com/kangax/fabric.js/wiki/FAQ}
     * @type Function
     */
    clipTo: null,

    /**
     * Indicates whether object controls (borders/controls) are rendered above overlay image
     * @type Boolean
     */
    controlsAboveOverlay: false,

    /**
     * Callback; invoked right before object is about to be scaled/rotated
     * @param {fabric.Object} target Object that's about to be scaled/rotated
     */
    onBeforeScaleRotate: function () {
      /* NOOP */
    },

     /**
      * @private
      */
    _initStatic: function(el, options) {
      this._objects = [];

      this._createLowerCanvas(el);
      this._initOptions(options);

      if (options.overlayImage) {
        this.setOverlayImage(options.overlayImage, this.renderAll.bind(this));
      }
      if (options.backgroundImage) {
        this.setBackgroundImage(options.backgroundImage, this.renderAll.bind(this));
      }
      if (options.backgroundColor) {
        this.setBackgroundColor(options.backgroundColor, this.renderAll.bind(this));
      }
      this.calcOffset();
    },

    /**
     * Calculates canvas element offset relative to the document
     * This method is also attached as "resize" event handler of window
     * @return {fabric.Canvas} instance
     * @chainable
     */
    calcOffset: function () {
      this._offset = getElementOffset(this.lowerCanvasEl);
      return this;
    },

    /**
     * Sets overlay image for this canvas
     * @param {String} url url of an image to set overlay to
     * @param {Function} callback callback to invoke when image is loaded and set as an overlay
     * @param {Object} [options] optional options to set for the overlay image
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    setOverlayImage: function (url, callback, options) { // TODO (kangax): test callback
      fabric.util.loadImage(url, function(img) {
        this.overlayImage = img;
        if (options && ('overlayImageLeft' in options)) {
          this.overlayImageLeft = options.overlayImageLeft;
        }
        if (options && ('overlayImageTop' in options)) {
          this.overlayImageTop = options.overlayImageTop;
        }
        callback && callback();
      }, this);

      return this;
    },

    /**
     * Sets background image for this canvas
     * @param {String} url url of an image to set background to
     * @param {Function} callback callback to invoke when image is loaded and set as background
     * @param {Object} [options] optional options to set for the background image
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    setBackgroundImage: function (url, callback, options) {
      fabric.util.loadImage(url, function(img) {
        this.backgroundImage = img;
        if (options && ('backgroundImageOpacity' in options)) {
          this.backgroundImageOpacity = options.backgroundImageOpacity;
        }
        if (options && ('backgroundImageStretch' in options)) {
          this.backgroundImageStretch = options.backgroundImageStretch;
        }
        callback && callback();
      }, this);

      return this;
    },

    /**
     * Sets background color for this canvas
     * @param {String|fabric.Pattern} Color of pattern to set background color to
     * @param {Function} callback callback to invoke when background color is set
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    setBackgroundColor: function(backgroundColor, callback) {
      if (backgroundColor.source) {
        var _this = this;
        fabric.util.loadImage(backgroundColor.source, function(img) {
          _this.backgroundColor = new fabric.Pattern({
            source: img,
            repeat: backgroundColor.repeat
          });
          callback && callback();
        });
      }
      else {
        this.backgroundColor = backgroundColor;
        callback && callback();
      }

      return this;
    },

    /**
     * @private
     */
    _createCanvasElement: function() {
      var element = fabric.document.createElement('canvas');
      if (!element.style) {
        element.style = { };
      }
      if (!element) {
        throw CANVAS_INIT_ERROR;
      }
      this._initCanvasElement(element);
      return element;
    },

    /**
     * @private
     * @param {HTMLElement} element
     */
    _initCanvasElement: function(element) {
      fabric.util.createCanvasElement(element);

      if (typeof element.getContext === 'undefined') {
        throw CANVAS_INIT_ERROR;
      }
    },

    /**
     * @private
     * @param {Object} [options]
     */
    _initOptions: function (options) {
      for (var prop in options) {
        this[prop] = options[prop];
      }

      this.width = parseInt(this.lowerCanvasEl.width, 10) || 0;
      this.height = parseInt(this.lowerCanvasEl.height, 10) || 0;

      if (!this.lowerCanvasEl.style) return;

      this.lowerCanvasEl.style.width = this.width + 'px';
      this.lowerCanvasEl.style.height = this.height + 'px';
    },

    /**
     * Creates a bottom canvas
     * @private
     */
    _createLowerCanvas: function (canvasEl) {
      this.lowerCanvasEl = fabric.util.getById(canvasEl) || this._createCanvasElement();
      this._initCanvasElement(this.lowerCanvasEl);

      fabric.util.addClass(this.lowerCanvasEl, 'lower-canvas');

      if (this.interactive) {
        this._applyCanvasStyle(this.lowerCanvasEl);
      }

      this.contextContainer = this.lowerCanvasEl.getContext('2d');
    },

    /**
     * Returns canvas width (in px)
     * @return {Number}
     */
    getWidth: function () {
      return this.width;
    },

    /**
     * Returns canvas height (in px)
     * @return {Number}
     */
    getHeight: function () {
      return this.height;
    },

    /**
     * Sets width of this canvas instance
     * @param {Number} width value to set width to
     * @return {fabric.Canvas} instance
     * @chainable true
     */
    setWidth: function (value) {
      return this._setDimension('width', value);
    },

    /**
     * Sets height of this canvas instance
     * @param {Number} height value to set height to
     * @return {fabric.Canvas} instance
     * @chainable true
     */
    setHeight: function (value) {
      return this._setDimension('height', value);
    },

    /**
     * Sets dimensions (width, height) of this canvas instance
     * @param {Object} dimensions
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    setDimensions: function(dimensions) {
      for (var prop in dimensions) {
        this._setDimension(prop, dimensions[prop]);
      }
      return this;
    },

    /**
     * Helper for setting width/height
     * @private
     * @param {String} prop property (width|height)
     * @param {Number} value value to set property to
     * @return {fabric.Canvas} instance
     * @chainable true
     */
    _setDimension: function (prop, value) {
      this.lowerCanvasEl[prop] = value;
      this.lowerCanvasEl.style[prop] = value + 'px';

      if (this.upperCanvasEl) {
        this.upperCanvasEl[prop] = value;
        this.upperCanvasEl.style[prop] = value + 'px';
      }

      if (this.cacheCanvasEl) {
        this.cacheCanvasEl[prop] = value;
      }

      if (this.wrapperEl) {
        this.wrapperEl.style[prop] = value + 'px';
      }

      this[prop] = value;

      this.calcOffset();
      this.renderAll();

      return this;
    },

    /**
     * Returns &lt;canvas> element corresponding to this instance
     * @return {HTMLCanvasElement}
     */
    getElement: function () {
      return this.lowerCanvasEl;
    },

    /**
     * Returns currently selected object, if any
     * @return {fabric.Object}
     */
    getActiveObject: function() {
      return null;
    },

    /**
     * Returns currently selected group of object, if any
     * @return {fabric.Group}
     */
    getActiveGroup: function() {
      return null;
    },

    /**
     * Given a context, renders an object on that context
     * @param ctx {Object} context to render object on
     * @param object {Object} object to render
     * @private
     */
    _draw: function (ctx, object) {
      if (!object) return;

      if (this.controlsAboveOverlay) {
        var hasBorders = object.hasBorders, hasControls = object.hasControls;
        object.hasBorders = object.hasControls = false;
        object.render(ctx);
        object.hasBorders = hasBorders;
        object.hasControls = hasControls;
      }
      else {
        object.render(ctx);
      }
    },

    /**
     * @private
     */
    _onObjectAdded: function(obj) {
      this.stateful && obj.setupState();
      obj.setCoords();
      obj.canvas = this;
      this.fire('object:added', { target: obj });
      obj.fire('added');
    },

    /**
     * @private
     */
    _onObjectRemoved: function(obj) {
      this.fire('object:removed', { target: obj });
      obj.fire('removed');
    },

    /**
     * Returns an array of objects this instance has
     * @return {Array}
     */
    getObjects: function () {
      return this._objects;
    },

    /**
     * Clears specified context of canvas element
     * @param context {Object} ctx context to clear
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    clearContext: function(ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      return this;
    },

    /**
     * Returns context of canvas where objects are drawn
     * @return {CanvasRenderingContext2D}
     */
    getContext: function () {
      return this.contextContainer;
    },

    /**
     * Clears all contexts (background, main, top) of an instance
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    clear: function () {
      this._objects.length = 0;
      if (this.discardActiveGroup) {
        this.discardActiveGroup();
      }
      if (this.discardActiveObject) {
        this.discardActiveObject();
      }
      this.clearContext(this.contextContainer);
      if (this.contextTop) {
        this.clearContext(this.contextTop);
      }
      this.fire('canvas:cleared');
      this.renderAll();
      return this;
    },

    /**
     * Renders both the top canvas and the secondary container canvas.
     * @param allOnTop {Boolean} optional Whether we want to force all images to be rendered on the top canvas
     * @return {fabric.Canvas} instance
     * @chainable
     */
    renderAll: function (allOnTop) {

      var canvasToDrawOn = this[(allOnTop === true && this.interactive) ? 'contextTop' : 'contextContainer'];

      if (this.contextTop && this.selection && !this._groupSelector) {
        this.clearContext(this.contextTop);
      }

      if (!allOnTop) {
        this.clearContext(canvasToDrawOn);
      }

      this.fire('before:render');

      if (this.clipTo) {
        fabric.util.clipContext(this, canvasToDrawOn);
      }

      if (this.backgroundColor) {
        canvasToDrawOn.fillStyle = this.backgroundColor.toLive
          ? this.backgroundColor.toLive(canvasToDrawOn)
          : this.backgroundColor;

        canvasToDrawOn.fillRect(
          this.backgroundColor.offsetX || 0,
          this.backgroundColor.offsetY || 0,
          this.width,
          this.height);
      }

      if (typeof this.backgroundImage === 'object') {
        this._drawBackroundImage(canvasToDrawOn);
      }

      var activeGroup = this.getActiveGroup();
      for (var i = 0, length = this._objects.length; i < length; ++i) {
        if (!activeGroup ||
            (activeGroup && this._objects[i] && !activeGroup.contains(this._objects[i]))) {
          this._draw(canvasToDrawOn, this._objects[i]);
        }
      }

      // delegate rendering to group selection (if one exists)
      if (activeGroup) {
        //Store objects in group preserving order, then replace
        var sortedObjects = [];
        this.forEachObject(function (object) {
            if (activeGroup.contains(object)) {
                sortedObjects.push(object);
            }
        });
        activeGroup._set('objects', sortedObjects);
        this._draw(canvasToDrawOn, activeGroup);
      }

      if (this.clipTo) {
        canvasToDrawOn.restore();
      }

      if (this.overlayImage) {
        canvasToDrawOn.drawImage(this.overlayImage, this.overlayImageLeft, this.overlayImageTop);
      }

      if (this.controlsAboveOverlay) {
        this.drawControls(canvasToDrawOn);
      }

      this.fire('after:render');

      return this;
    },

    /**
     * @private
     */
    _drawBackroundImage: function(canvasToDrawOn) {
      canvasToDrawOn.save();
      canvasToDrawOn.globalAlpha = this.backgroundImageOpacity;

      if (this.backgroundImageStretch) {
        canvasToDrawOn.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
      }
      else {
        canvasToDrawOn.drawImage(this.backgroundImage, 0, 0);
      }
      canvasToDrawOn.restore();
    },

    /**
     * Method to render only the top canvas.
     * Also used to render the group selection box.
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    renderTop: function () {
      var ctx = this.contextTop || this.contextContainer;
      this.clearContext(ctx);

      // we render the top context - last object
      if (this.selection && this._groupSelector) {
        this._drawSelection();
      }

      // delegate rendering to group selection if one exists
      // used for drawing selection borders/controls
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        activeGroup.render(ctx);
      }

      if (this.overlayImage) {
        ctx.drawImage(this.overlayImage, this.overlayImageLeft, this.overlayImageTop);
      }

      this.fire('after:render');

      return this;
    },

    /**
     * Draws objects' controls (borders/controls)
     * @param {Object} ctx context to render controls on
     */
    drawControls: function(ctx) {
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        ctx.save();
        fabric.Group.prototype.transform.call(activeGroup, ctx);
        activeGroup.drawBorders(ctx).drawControls(ctx);
        ctx.restore();
      }
      else {
        for (var i = 0, len = this._objects.length; i < len; ++i) {
          if (!this._objects[i] || !this._objects[i].active) continue;

          ctx.save();
          fabric.Object.prototype.transform.call(this._objects[i], ctx);
          this._objects[i].drawBorders(ctx).drawControls(ctx);
          ctx.restore();

          this.lastRenderedObjectWithControlsAboveOverlay = this._objects[i];
        }
      }
    },

    /**
     * Exports canvas element to a dataurl image.
     * @param {Object} options
     *
     *  `format` the format of the output image. Either "jpeg" or "png".
     *  `quality` quality level (0..1)
     *  `multiplier` multiplier to scale by {Number}
     *
     * @return {String}
     */
    toDataURL: function (options) {
      options || (options = { });

      var format = options.format || 'png',
          quality = options.quality || 1,
          multiplier = options.multiplier || 1;

      if (multiplier !== 1) {
        return this.__toDataURLWithMultiplier(format, quality, multiplier);
      }
      else {
        return this.__toDataURL(format, quality);
      }
    },

    /**
     * @private
     */
    __toDataURL: function(format, quality) {
      this.renderAll(true);
      var canvasEl = this.upperCanvasEl || this.lowerCanvasEl;
      var data = (fabric.StaticCanvas.supports('toDataURLWithQuality'))
                ? canvasEl.toDataURL('image/' + format, quality)
                : canvasEl.toDataURL('image/' + format);

      this.contextTop && this.clearContext(this.contextTop);
      this.renderAll();
      return data;
    },

    /**
     * @private
     */
    __toDataURLWithMultiplier: function(format, quality, multiplier) {

      var origWidth = this.getWidth(),
          origHeight = this.getHeight(),
          scaledWidth = origWidth * multiplier,
          scaledHeight = origHeight * multiplier,
          activeObject = this.getActiveObject(),
          activeGroup = this.getActiveGroup(),

          ctx = this.contextTop || this.contextContainer;

      this.setWidth(scaledWidth).setHeight(scaledHeight);
      ctx.scale(multiplier, multiplier);

      if (activeGroup) {
        // not removing group due to complications with restoring it with correct state afterwords
        this._tempRemoveBordersControlsFromGroup(activeGroup);
      }
      else if (activeObject && this.deactivateAll) {
        this.deactivateAll();
      }

      // restoring width, height for `renderAll` to draw
      // background properly (while context is scaled)
      this.width = origWidth;
      this.height = origHeight;

      this.renderAll(true);

      var data = this.__toDataURL(format, quality);

      ctx.scale(1 / multiplier,  1 / multiplier);
      this.setWidth(origWidth).setHeight(origHeight);

      if (activeGroup) {
        this._restoreBordersControlsOnGroup(activeGroup);
      }
      else if (activeObject && this.setActiveObject) {
        this.setActiveObject(activeObject);
      }

      this.contextTop && this.clearContext(this.contextTop);
      this.renderAll();

      return data;
    },

    /**
     * Exports canvas element to a dataurl image (allowing to change image size via multiplier).
     * @deprecated since 1.0.13
     * @param {String} format (png|jpeg)
     * @param {Number} multiplier
     * @param {Number} quality (0..1)
     * @return {String}
     */
    toDataURLWithMultiplier: function (format, multiplier, quality) {
      return this.toDataURL({
        format: format,
        multiplier: multiplier,
        quality: quality
      });
    },

    /**
     * @private
     */
    _tempRemoveBordersControlsFromGroup: function(group) {
      group.origHasControls = group.hasControls;
      group.origBorderColor = group.borderColor;

      group.hasControls = true;
      group.borderColor = 'rgba(0,0,0,0)';

      group.forEachObject(function(o) {
        o.origBorderColor = o.borderColor;
        o.borderColor = 'rgba(0,0,0,0)';
      });
    },

    /**
     * @private
     */
    _restoreBordersControlsOnGroup: function(group) {
      group.hideControls = group.origHideControls;
      group.borderColor = group.origBorderColor;

      group.forEachObject(function(o) {
        o.borderColor = o.origBorderColor;
        delete o.origBorderColor;
      });
    },

    /**
     * Returns coordinates of a center of canvas.
     * Returned value is an object with top and left properties
     * @return {Object} object with "top" and "left" number values
     */
    getCenter: function () {
      return {
        top: this.getHeight() / 2,
        left: this.getWidth() / 2
      };
    },

    /**
     * Centers object horizontally.
     * @param {fabric.Object} object Object to center
     * @return {fabric.Canvas} thisArg
     */
    centerObjectH: function (object) {
      object.set('left', this.getCenter().left);
      this.renderAll();
      return this;
    },

    /**
     * Centers object vertically.
     * @param {fabric.Object} object Object to center
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    centerObjectV: function (object) {
      object.set('top', this.getCenter().top);
      this.renderAll();
      return this;
    },

    /**
     * Centers object vertically and horizontally.
     * @param {fabric.Object} object Object to center
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    centerObject: function (object) {
      return this.centerObjectH(object).centerObjectV(object);
    },

    /**
     * Returs dataless JSON representation of canvas
     * @param {Array} propertiesToInclude
     * @return {String} json string
     */
    toDatalessJSON: function (propertiesToInclude) {
      return this.toDatalessObject(propertiesToInclude);
    },

    /**
     * Returns object representation of canvas
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function (propertiesToInclude) {
      return this._toObjectMethod('toObject', propertiesToInclude);
    },

    /**
     * Returns dataless object representation of canvas
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toDatalessObject: function (propertiesToInclude) {
      return this._toObjectMethod('toDatalessObject', propertiesToInclude);
    },

    /**
     * @private
     */
    _toObjectMethod: function (methodName, propertiesToInclude) {
      var data = {
        objects: this._objects.map(function (instance) {
          // TODO (kangax): figure out how to clean this up
          var originalValue;
          if (!this.includeDefaultValues) {
            originalValue = instance.includeDefaultValues;
            instance.includeDefaultValues = false;
          }
          var object = instance[methodName](propertiesToInclude);
          if (!this.includeDefaultValues) {
            instance.includeDefaultValues = originalValue;
          }
          return object;
        }, this),
        background: (this.backgroundColor && this.backgroundColor.toObject)
                      ? this.backgroundColor.toObject()
                      : this.backgroundColor
      };
      if (this.backgroundImage) {
        data.backgroundImage = this.backgroundImage.src;
        data.backgroundImageOpacity = this.backgroundImageOpacity;
        data.backgroundImageStretch = this.backgroundImageStretch;
      }
      if (this.overlayImage) {
        data.overlayImage = this.overlayImage.src;
        data.overlayImageLeft = this.overlayImageLeft;
        data.overlayImageTop = this.overlayImageTop;
      }
      fabric.util.populateWithProperties(this, data, propertiesToInclude);
      return data;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of canvas
     * @function
     * @param {Object} [options] Options for SVG output (suppressPreamble: true/false (if true xml tag is not included),
     * viewBox: {x, y, width, height} to define the svg output viewBox)
     * @return {String}
     */
    toSVG: function(options) {
      options || (options = { });
      var markup = [];

      if (!options.suppressPreamble) {
        markup.push(
          '<?xml version="1.0" standalone="no" ?>',
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
              '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
        );
      }
      markup.push(
          '<svg ',
            'xmlns="http://www.w3.org/2000/svg" ',
            'xmlns:xlink="http://www.w3.org/1999/xlink" ',
            'version="1.1" ',
            'width="', (options.viewBox ? options.viewBox.width : this.width), '" ',
            'height="', (options.viewBox ? options.viewBox.height : this.height), '" ',
            (this.backgroundColor && !this.backgroundColor.source ? 'style="background-color: ' + this.backgroundColor +'" ' : null),
            (options.viewBox ? 'viewBox="' + options.viewBox.x + ' ' + options.viewBox.y + ' ' + options.viewBox.width + ' ' + options.viewBox.height + '" ' : null),
            'xml:space="preserve">',
          '<desc>Created with Fabric.js ', fabric.version, '</desc>',
          '<defs>', fabric.createSVGFontFacesMarkup(this.getObjects()), fabric.createSVGRefElementsMarkup(this), '</defs>'
      );

      if (this.backgroundColor && this.backgroundColor.source) {
        markup.push(
          '<rect x="0" y="0" ',
            'width="', (this.backgroundColor.repeat === 'repeat-y' || this.backgroundColor.repeat === 'no-repeat' ? this.backgroundColor.source.width : this.width),
            '" height="', (this.backgroundColor.repeat === 'repeat-x' || this.backgroundColor.repeat === 'no-repeat' ? this.backgroundColor.source.height : this.height),
            '" fill="url(#backgroundColorPattern)"',
          '></rect>'
        );
      }

      if (this.backgroundImage) {
        markup.push(
          '<image x="0" y="0" ',
            'width="', (this.backgroundImageStretch ? this.width : this.backgroundImage.width),
            '" height="', (this.backgroundImageStretch ? this.height : this.backgroundImage.height),
            '" preserveAspectRatio="', (this.backgroundImageStretch ? 'none' : 'defer'),
            '" xlink:href="', this.backgroundImage.src,
            '" style="opacity:', this.backgroundImageOpacity,
          '"></image>'
        );
      }

      if (this.overlayImage) {
        markup.push(
          '<image x="', this.overlayImageLeft,
            '" y="', this.overlayImageTop,
            '" width="', this.overlayImage.width,
            '" height="', this.overlayImage.height,
            '" xlink:href="', this.overlayImage.src,
          '"></image>'
        );
      }

      for (var i = 0, objects = this.getObjects(), len = objects.length; i < len; i++) {
        markup.push(objects[i].toSVG());
      }
      markup.push('</svg>');

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Removes an object from canvas and returns it
     * @param object {Object} Object to remove
     * @return {Object} removed object
     */
    remove: function (object) {
      // removing active object should fire "selection:cleared" events
      if (this.getActiveObject() === object) {
        this.fire('before:selection:cleared', { target: object });
        this.discardActiveObject();
        this.fire('selection:cleared');
      }

      return fabric.Collection.remove.call(this, object);
    },

    /**
     * Moves an object to the bottom of the stack of drawn objects
     * @param object {fabric.Object} Object to send to back
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    sendToBack: function (object) {
      removeFromArray(this._objects, object);
      this._objects.unshift(object);
      return this.renderAll && this.renderAll();
    },

    /**
     * Moves an object to the top of the stack of drawn objects
     * @param object {fabric.Object} Object to send
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    bringToFront: function (object) {
      removeFromArray(this._objects, object);
      this._objects.push(object);
      return this.renderAll && this.renderAll();
    },

    /**
     * Moves an object one level down in stack of drawn objects
     * @param object {fabric.Object} Object to send
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    sendBackwards: function (object) {
      var idx = this._objects.indexOf(object),
          nextIntersectingIdx = idx;

      // if object is not on the bottom of stack
      if (idx !== 0) {

        // traverse down the stack looking for the nearest intersecting object
        for (var i=idx-1; i>=0; --i) {

          var isIntersecting = object.intersectsWithObject(this._objects[i]) ||
                               object.isContainedWithinObject(this._objects[i]) ||
                               this._objects[i].isContainedWithinObject(object);

          if (isIntersecting) {
            nextIntersectingIdx = i;
            break;
          }
        }
        removeFromArray(this._objects, object);
        this._objects.splice(nextIntersectingIdx, 0, object);
      }
      return this.renderAll && this.renderAll();
    },

    /**
     * Moves an object one level up in stack of drawn objects
     * @param object {fabric.Object} Object to send
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    bringForward: function (object) {
      var objects = this.getObjects(),
          idx = objects.indexOf(object),
          nextIntersectingIdx = idx;


      // if object is not on top of stack (last item in an array)
      if (idx !== objects.length-1) {

        // traverse up the stack looking for the nearest intersecting object
        for (var i = idx + 1, l = this._objects.length; i < l; ++i) {

          var isIntersecting = object.intersectsWithObject(objects[i]) ||
                               object.isContainedWithinObject(this._objects[i]) ||
                               this._objects[i].isContainedWithinObject(object);

          if (isIntersecting) {
            nextIntersectingIdx = i;
            break;
          }
        }
        removeFromArray(objects, object);
        objects.splice(nextIntersectingIdx, 0, object);
      }
      return this.renderAll && this.renderAll();
    },

    /**
     * Moves an object to specified level in stack of drawn objects
     * @param object {fabric.Object} Object to send
     * @param {Number} index Position to move to
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    moveTo: function (object, index) {
      removeFromArray(this._objects, object);
      this._objects.splice(index, 0, object);
      return this.renderAll && this.renderAll();
    },

    /**
     * Clears a canvas element and removes all event handlers.
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    dispose: function () {
      this.clear();

      if (!this.interactive) return this;

      if (fabric.isTouchSupported) {
        removeListener(this.upperCanvasEl, 'touchstart', this._onMouseDown);
        removeListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
        if (typeof Event !== 'undefined' && 'remove' in Event) {
          Event.remove(this.upperCanvasEl, 'gesture', this._onGesture);
        }
      }
      else {
        removeListener(this.upperCanvasEl, 'mousedown', this._onMouseDown);
        removeListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
        removeListener(fabric.window, 'resize', this._onResize);
      }
      return this;
    },

    /**
     * @private
     * @param {HTMLImageElement} imgEl
     */
    _resizeImageToFit: function (imgEl) {

      var imageWidth = imgEl.width || imgEl.offsetWidth,
          widthScaleFactor = this.getWidth() / imageWidth;

      // scale image down so that it has original dimensions when printed in large resolution
      if (imageWidth) {
        imgEl.width = imageWidth * widthScaleFactor;
      }
    }
  });

  /**
   * Returns a string representation of an instance
   * @return {String} string representation of an instance
   */
  fabric.StaticCanvas.prototype.toString = function () { // Assign explicitly since `extend` doesn't take care of DontEnum bug yet
    return '#<fabric.Canvas (' + this.complexity() + '): '+
           '{ objects: ' + this.getObjects().length + ' }>';
  };

  extend(fabric.StaticCanvas, /** @lends fabric.StaticCanvas */ {

    /**
     * @static
     * @type String
     */
    EMPTY_JSON: '{"objects": [], "background": "white"}',

    /**
     * Takes &lt;canvas> element and transforms its data in such way that it becomes grayscale
     * @static
     * @param {HTMLCanvasElement} canvasEl
     */
    toGrayscale: function (canvasEl) {
       var context = canvasEl.getContext('2d'),
           imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
           data = imageData.data,
           iLen = imageData.width,
           jLen = imageData.height,
           index, average, i, j;

       for (i = 0; i < iLen; i++) {
         for (j = 0; j < jLen; j++) {

           index = (i * 4) * jLen + (j * 4);
           average = (data[index] + data[index + 1] + data[index + 2]) / 3;

           data[index]     = average;
           data[index + 1] = average;
           data[index + 2] = average;
         }
       }

       context.putImageData(imageData, 0, 0);
     },

    /**
     * Provides a way to check support of some of the canvas methods
     * (either those of HTMLCanvasElement itself, or rendering context)
     *
     * @param methodName {String} Method to check support for;
     *                            Could be one of "getImageData", "toDataURL", "toDataURLWithQuality" or "setLineDash"
     * @return {Boolean | null} `true` if method is supported (or at least exists),
     *                          `null` if canvas element or context can not be initialized
     */
    supports: function (methodName) {
      var el = fabric.util.createCanvasElement();

      if (!el || !el.getContext) {
        return null;
      }

      var ctx = el.getContext('2d');
      if (!ctx) {
        return null;
      }

      switch (methodName) {

        case 'getImageData':
          return typeof ctx.getImageData !== 'undefined';

        case 'setLineDash':
          return typeof ctx.setLineDash !== 'undefined';

        case 'toDataURL':
          return typeof el.toDataURL !== 'undefined';

        case 'toDataURLWithQuality':
          try {
            el.toDataURL('image/jpeg', 0);
            return true;
          }
          catch (e) { }
          return false;

        default:
          return null;
      }
    }
  });

  /**
   * Returs JSON representation of canvas
   * @function
   * @param {Array} propertiesToInclude
   * @return {String} json string
   */
  fabric.StaticCanvas.prototype.toJSON = fabric.StaticCanvas.prototype.toObject;

})();
fabric.util.object.extend(fabric.StaticCanvas.prototype, /** @lends fabric.StaticCanvas.prototype */ {

  /**
   * Animation duration (in ms) for fx* methods
   * @type Number
   */
  FX_DURATION: 500,

  /**
   * Centers object horizontally with animation.
   * @param {fabric.Object} object Object to center
   * @param {Object} [callbacks] Callbacks object with optional "onComplete" and/or "onChange" properties
   * @return {fabric.Canvas} thisArg
   * @chainable
   */
  fxCenterObjectH: function (object, callbacks) {
    callbacks = callbacks || { };

    var empty = function() { },
        onComplete = callbacks.onComplete || empty,
        onChange = callbacks.onChange || empty,
        _this = this;

    fabric.util.animate({
      startValue: object.get('left'),
      endValue: this.getCenter().left,
      duration: this.FX_DURATION,
      onChange: function(value) {
        object.set('left', value);
        _this.renderAll();
        onChange();
      },
      onComplete: function() {
        object.setCoords();
        onComplete();
      }
    });

    return this;
  },

  /**
   * Centers object vertically with animation.
   * @param {fabric.Object} object Object to center
   * @param {Object} [callbacks] Callbacks object with optional "onComplete" and/or "onChange" properties
   * @return {fabric.Canvas} thisArg
   * @chainable
   */
  fxCenterObjectV: function (object, callbacks) {
    callbacks = callbacks || { };

    var empty = function() { },
        onComplete = callbacks.onComplete || empty,
        onChange = callbacks.onChange || empty,
        _this = this;

    fabric.util.animate({
      startValue: object.get('top'),
      endValue: this.getCenter().top,
      duration: this.FX_DURATION,
      onChange: function(value) {
        object.set('top', value);
        _this.renderAll();
        onChange();
      },
      onComplete: function() {
        object.setCoords();
        onComplete();
      }
    });

    return this;
  },

  /**
   * Same as `fabric.Canvas#remove` but animated
   * @param {fabric.Object} object Object to remove
   * @param {Function} callback Callback, invoked on effect completion
   * @return {fabric.Canvas} thisArg
   * @chainable
   */
  fxRemove: function (object, callbacks) {
    callbacks = callbacks || { };

    var empty = function() { },
        onComplete = callbacks.onComplete || empty,
        onChange = callbacks.onChange || empty,
        _this = this;

    fabric.util.animate({
      startValue: object.get('opacity'),
      endValue: 0,
      duration: this.FX_DURATION,
      onStart: function() {
        object.set('active', false);
      },
      onChange: function(value) {
        object.set('opacity', value);
        _this.renderAll();
        onChange();
      },
      onComplete: function () {
        _this.remove(object);
        onComplete();
      }
    });

    return this;
  }
});
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      toFixed = fabric.util.toFixed,
      capitalize = fabric.util.string.capitalize,
      degreesToRadians = fabric.util.degreesToRadians,
      supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

  if (fabric.Object) {
    return;
  }

  /**
   * Root object class from which all 2d shape classes inherit from
   * @class fabric.Object
   */
  fabric.Object = fabric.util.createClass(/** @lends fabric.Object.prototype */ {

    /**
     * Type of an object (rect, circle, path, etc.)
     * @type String
     * @default
     */
    type:                     'object',

    /**
     * Horizontal origin of transformation of an object (one of "left", "right", "center")
     * @type String
     * @default
     */
    originX:                  'center',

    /**
     * Vertical origin of transformation of an object (one of "top", "bottom", "center")
     * @type String
     * @default
     */
    originY:                  'center',

    /**
     * Top position of an object. Note that by default it's relative to object center. You can change this by setting originY={top/center/bottom}
     * @type Number
     * @default
     */
    top:                      0,

    /**
     * Left position of an object. Note that by default it's relative to object center. You can change this by setting originX={left/center/right}
     * @type Number
     * @default
     */
    left:                     0,

    /**
     * Object width
     * @type Number
     * @default
     */
    width:                    0,

    /**
     * Object height
     * @type Number
     * @default
     */
    height:                   0,

    /**
     * Object scale factor (horizontal)
     * @type Number
     * @default
     */
    scaleX:                   1,

    /**
     * Object scale factor (vertical)
     * @type Number
     * @default
     */
    scaleY:                   1,

    /**
     * When true, an object is rendered as flipped horizontally
     * @type Boolean
     * @default
     */
    flipX:                    false,

    /**
     * When true, an object is rendered as flipped vertically
     * @type Boolean
     * @default
     */
    flipY:                    false,

    /**
     * Opacity of an object
     * @type Number
     * @default
     */
    opacity:                  1,

    /**
     * Angle of rotation of an object (in degrees)
     * @type Number
     * @default
     */
    angle:                    0,

    /**
     * Size of object's corners (in pixels)
     * @type Number
     * @default
     */
    cornerSize:               12,

    /**
     * When true, object's corners are rendered as transparent inside (i.e. stroke instead of fill)
     * @type Boolean
     * @default
     */
    transparentCorners:       true,

    /**
     * Padding between object and its borders (in pixels)
     * @type Number
     * @default
     */
    padding:                  0,

    /**
     * Border color of an object (when it's active)
     * @type String
     * @default
     */
    borderColor:              'rgba(102,153,255,0.75)',

    /**
     * Corner color of an object (when it's active)
     * @type String
     * @default
     */
    cornerColor:              'rgba(102,153,255,0.5)',

    /**
     * Color of object's fill
     * @type String
     * @default
     */
    fill:                     'rgb(0,0,0)',

    /**
     * Fill rule used to fill an object
     * @type String
     * @default
     */
    fillRule:                 'source-over',

    /**
     * Overlay fill (takes precedence over fill value)
     * @type String
     * @default
     */
    overlayFill:              null,

    /**
     * When defined, an object is rendered via stroke and this property specifies its color
     * @type String
     * @default
     */
    stroke:                   null,

    /**
     * Width of a stroke used to render this object
     * @type Number
     * @default
     */
    strokeWidth:              1,

    /**
     * Array specifying dash pattern of an object's stroke (stroke must be defined)
     * @type Array
     */
    strokeDashArray:          null,

    /**
     * Line endings style of an object's stroke (one of "butt", "round", "square")
     * @type String
     * @default
     */
    strokeLineCap:            'butt',

    /**
     * Corner style of an object's stroke (one of "bevil", "round", "miter")
     * @type String
     * @default
     */
    strokeLineJoin:           'miter',

    /**
     * Maximum miter length (used for strokeLineJoin = "miter") of an object's stroke
     * @type Number
     * @default
     */
    strokeMiterLimit:         10,

    /**
     * Shadow object representing shadow of this shape
     * @type fabric.Shadow
     */
    shadow:                   null,

    /**
     * Border opacity when object is active and moving
     * @type Number
     * @default
     */
    borderOpacityWhenMoving:  0.4,

    /**
     * Border scale factor
     * @type Number
     * @default
     */
    borderScaleFactor:        1,

    /**
     * Transform matrix (similar to SVG's transform matrix)
     * @type Array
     */
    transformMatrix:          null,

    /**
     * Minimum allowed scale value of an object
     * @type Number
     * @default
     */
    minScaleLimit:            0.01,

    /**
     * When set to `false`, an object can not be selected for modification (using either point-click-based or group-based selection)
     * @type Boolean
     * @default
     */
    selectable:               true,

    /**
     * When set to `false`, an object is not rendered on canvas
     * @type Boolean
     * @default
     */
    visible:                  true,

    /**
     * When set to `false`, object's controls are not displayed and can not be used to manipulate object
     * @type Boolean
     * @default
     */
    hasControls:              true,

    /**
     * When set to `false`, object's borders are not rendered
     * @type Boolean
     * @default
     */
    hasBorders:               true,

    /**
     * When set to `false`, object's rotating point will not be visible or selectable
     * @type Boolean
     * @default
     */
    hasRotatingPoint:         true,

    /**
     * Offset for object's rotating point (when enabled via `hasRotatingPoint`)
     * @type Number
     * @default
     */
    rotatingPointOffset:      40,

    /**
     * When set to `true`, objects are "found" on canvas on per-pixel basis rather than according to bounding box
     * @type Boolean
     * @default
     */
    perPixelTargetFind:       false,

    /**
     * When `false`, default object's values are not included in its serialization
     * @type Boolean
     * @default
     */
    includeDefaultValues:     true,

    /**
     * Function that determines clipping of an object (context is passed as a first argument)
     * @type Function
     */
    clipTo:                   null,

    /**
     * When `true`, object horizontal movement is locked
     * @type Boolean
     * @default
     */
    lockMovementX:            false,

    /**
     * When `true`, object vertical movement is locked
     * @type Boolean
     * @default
     */
    lockMovementY:            false,

    /**
     * When `true`, object rotation is locked
     * @type Boolean
     * @default
     */
    lockRotation:             false,

    /**
     * When `true`, object horizontal scaling is locked
     * @type Boolean
     * @default
     */
    lockScalingX:             false,

    /**
     * When `true`, object vertical scaling is locked
     * @type Boolean
     * @default
     */
    lockScalingY:             false,

    /**
     * When `true`, object non-uniform scaling is locked
     * @type Boolean
     * @default
     */
    lockUniScaling:           false,

    /**
     * List of properties to consider when checking if state
     * of an object is changed (fabric.Object#hasStateChanged)
     * as well as for history (undo/redo) purposes
     * @type Array
     */
    stateProperties:  (
      'top left width height scaleX scaleY flipX flipY ' +
      'angle opacity cornerSize fill overlayFill originX originY ' +
      'stroke strokeWidth strokeDashArray fillRule ' +
      'borderScaleFactor transformMatrix selectable shadow visible'
    ).split(' '),

    /**
     * Constructor
     * @param {Object} [options] Options object
     */
    initialize: function(options) {
      if (options) {
        this.setOptions(options);
      }
    },

    /**
     * @private
     */
    _initGradient: function(options) {
      if (options.fill && options.fill.colorStops && !(options.fill instanceof fabric.Gradient)) {
        this.set('fill', new fabric.Gradient(options.fill));
      }
    },

    /**
     * @private
     */
    _initPattern: function(options) {
      if (options.fill && options.fill.source && !(options.fill instanceof fabric.Pattern)) {
        this.set('fill', new fabric.Pattern(options.fill));
      }
      if (options.stroke && options.stroke.source && !(options.stroke instanceof fabric.Pattern)) {
        this.set('stroke', new fabric.Pattern(options.stroke));
      }
    },

    /**
     * @private
     */
    _initShadow: function(options) {
      if (options.shadow && !(options.shadow instanceof fabric.Shadow)) {
        this.setShadow(options.shadow);
      }
    },

    /**
     * Sets object's properties from options
     * @param {Object} [options]
     */
    setOptions: function(options) {
      for (var prop in options) {
        this.set(prop, options[prop]);
      }
      this._initGradient(options);
      this._initPattern(options);
      this._initShadow(options);
    },

    /**
     * Transforms context when rendering an object
     * @param {CanvasRenderingContext2D} ctx Context
     * @param {Boolean} fromLeft When true, context is transformed to object's top/left corner. This is used when rendering text on Node
     */
    transform: function(ctx, fromLeft) {
      ctx.globalAlpha = this.opacity;

      var center = fromLeft ? this._getLeftTopCoords() : this.getCenterPoint();
      ctx.translate(center.x, center.y);
      ctx.rotate(degreesToRadians(this.angle));
      ctx.scale(
        this.scaleX * (this.flipX ? -1 : 1),
        this.scaleY * (this.flipY ? -1 : 1)
      );
    },

    /**
     * Returns an object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {

      var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;

      var object = {
        type:               this.type,
        originX:            this.originX,
        originY:            this.originY,
        left:               toFixed(this.left, NUM_FRACTION_DIGITS),
        top:                toFixed(this.top, NUM_FRACTION_DIGITS),
        width:              toFixed(this.width, NUM_FRACTION_DIGITS),
        height:             toFixed(this.height, NUM_FRACTION_DIGITS),
        fill:               (this.fill && this.fill.toObject) ? this.fill.toObject() : this.fill,
        overlayFill:        this.overlayFill,
        stroke:             (this.stroke && this.stroke.toObject) ? this.stroke.toObject() : this.stroke,
        strokeWidth:        toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
        strokeDashArray:    this.strokeDashArray,
        strokeLineCap:      this.strokeLineCap,
        strokeLineJoin:     this.strokeLineJoin,
        strokeMiterLimit:   toFixed(this.strokeMiterLimit, NUM_FRACTION_DIGITS),
        scaleX:             toFixed(this.scaleX, NUM_FRACTION_DIGITS),
        scaleY:             toFixed(this.scaleY, NUM_FRACTION_DIGITS),
        angle:              toFixed(this.getAngle(), NUM_FRACTION_DIGITS),
        flipX:              this.flipX,
        flipY:              this.flipY,
        opacity:            toFixed(this.opacity, NUM_FRACTION_DIGITS),
        selectable:         this.selectable,
        hasControls:        this.hasControls,
        hasBorders:         this.hasBorders,
        hasRotatingPoint:   this.hasRotatingPoint,
        transparentCorners: this.transparentCorners,
        perPixelTargetFind: this.perPixelTargetFind,
        shadow:             (this.shadow && this.shadow.toObject) ? this.shadow.toObject() : this.shadow,
        visible:            this.visible
      };

      if (!this.includeDefaultValues) {
        object = this._removeDefaultValues(object);
      }
      fabric.util.populateWithProperties(this, object, propertiesToInclude);

      return object;
    },

    /**
     * Returns (dataless) object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toDatalessObject: function(propertiesToInclude) {
      // will be overwritten by subclasses
      return this.toObject(propertiesToInclude);
    },

    /* _TO_SVG_START_ */
    /**
     * Returns styles-string for svg-export
     * @return {String}
     */
    getSvgStyles: function() {
      return [
        "stroke: ", (this.stroke ? this.stroke : 'none'), "; ",
        "stroke-width: ", (this.strokeWidth ? this.strokeWidth : '0'), "; ",
        "stroke-dasharray: ", (this.strokeDashArray ? this.strokeDashArray.join(' ') : ''), "; ",
        "stroke-linecap: ", (this.strokeLineCap ? this.strokeLineCap : 'butt'), "; ",
        "stroke-linejoin: ", (this.strokeLineJoin ? this.strokeLineJoin : 'miter'), "; ",
        "stroke-miterlimit: ", (this.strokeMiterLimit ? this.strokeMiterLimit : '4'), "; ",
        "fill: ", (this.fill ? (this.fill && this.fill.toLive ? 'url(#SVGID_' + this.fill.id + ')' : this.fill) : 'none'), "; ",
        "opacity: ", (typeof this.opacity !== 'undefined' ? this.opacity : '1'), ";",
        (this.visible ? '' : " visibility: hidden;")
      ].join("");
    },

    /**
     * Returns transform-string for svg-export
     * @return {String}
     */
    getSvgTransform: function() {
      var angle = this.getAngle();
      var center = this.getCenterPoint();

      var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;

      var translatePart = "translate(" +
                            toFixed(center.x, NUM_FRACTION_DIGITS) +
                            " " +
                            toFixed(center.y, NUM_FRACTION_DIGITS) +
                          ")";

      var anglePart = angle !== 0
        ? (" rotate(" + toFixed(angle, NUM_FRACTION_DIGITS) + ")")
        : '';

      var scalePart = (this.scaleX === 1 && this.scaleY === 1)
        ? '' :
        (" scale(" +
          toFixed(this.scaleX, NUM_FRACTION_DIGITS) +
          " " +
          toFixed(this.scaleY, NUM_FRACTION_DIGITS) +
        ")");

      var flipXPart = this.flipX ? "matrix(-1 0 0 1 0 0) " : "";
      var flipYPart = this.flipY ? "matrix(1 0 0 -1 0 0)" : "";

      return [ translatePart, anglePart, scalePart, flipXPart, flipYPart ].join('');
    },
    /* _TO_SVG_END_ */

    /**
     * @private
     * @param {Object} object
     */
    _removeDefaultValues: function(object) {
      var defaultOptions = fabric.Object.prototype.options;
      if (defaultOptions) {
        this.stateProperties.forEach(function(prop) {
          if (object[prop] === defaultOptions[prop]) {
            delete object[prop];
          }
        });
      }
      return object;
    },

    /**
     * Returns a string representation of an instance
     * @return {String}
     */
    toString: function() {
      return "#<fabric." + capitalize(this.type) + ">";
    },

    /**
     * Basic getter
     * @param {String} property
     * @return {Any} value of a property
     */
    get: function(property) {
      return this[property];
    },

    /**
     * Sets property to a given value. When changing position/dimension -related properties (left, top, scale, angle, etc.) `set` does not update position of object's borders/controls. If you need to update those, call `setCoords()`.
     * @param {String|Object} key (if object, iterate over the object properties)
     * @param {Object|Function} value (if function, the value is passed into it and its return value is used as a new one)
     * @return {fabric.Object} thisArg
     * @chainable
     */
    set: function(key, value) {
      if (typeof key === 'object') {
        for (var prop in key) {
          this._set(prop, key[prop]);
        }
      }
      else {
        if (typeof value === 'function') {
          this._set(key, value(this.get(key)));
        }
        else {
          this._set(key, value);
        }
      }
      return this;
    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     * @return {fabric.Object} thisArg
     */
    _set: function(key, value) {
      var shouldConstrainValue = (key === 'scaleX' || key === 'scaleY');

      if (shouldConstrainValue) {
        value = this._constrainScale(value);
      }
      if (key === 'scaleX' && value < 0) {
        this.flipX = !this.flipX;
        value *= -1;
      }
      else if (key === 'scaleY' && value < 0) {
        this.flipY = !this.flipY;
        value *= -1;
      }
      else if (key === 'width' || key === 'height') {
        this.minScaleLimit = toFixed(Math.min(0.1, 1/Math.max(this.width, this.height)), 2);
      }

      this[key] = value;

      return this;
    },

    /**
     * Toggles specified property from `true` to `false` or from `false` to `true`
     * @param {String} property property to toggle
     * @return {fabric.Object} thisArg
     * @chainable
     */
    toggle: function(property) {
      var value = this.get(property);
      if (typeof value === 'boolean') {
        this.set(property, !value);
      }
      return this;
    },

    /**
     * Sets sourcePath of an object
     * @param {String} value
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setSourcePath: function(value) {
      this.sourcePath = value;
      return this;
    },

    /**
     * Renders an object on a specified context
     * @param {CanvasRenderingContext2D} ctx context to render on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, noTransform) {
      // do not render if width/height are zeros or object is not visible
      if (this.width === 0 || this.height === 0 || !this.visible) return;

      ctx.save();

      var m = this.transformMatrix;
      if (m && !this.group) {
        ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }

      if (!noTransform) {
        this.transform(ctx);
      }

      if (this.stroke) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeLineCap;
        ctx.lineJoin = this.strokeLineJoin;
        ctx.miterLimit = this.strokeMiterLimit;
        ctx.strokeStyle = this.stroke.toLive
          ? this.stroke.toLive(ctx)
          : this.stroke;
      }

      if (this.overlayFill) {
        ctx.fillStyle = this.overlayFill;
      }
      else if (this.fill) {
        ctx.fillStyle = this.fill.toLive
          ? this.fill.toLive(ctx)
          : this.fill;
      }

      if (m && this.group) {
        ctx.translate(-this.group.width/2, -this.group.height/2);
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }

      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      this._render(ctx, noTransform);
      this.clipTo && ctx.restore();
      this._removeShadow(ctx);

      if (this.active && !noTransform) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _setShadow: function(ctx) {
      if (!this.shadow) return;

      ctx.shadowColor = this.shadow.color;
      ctx.shadowBlur = this.shadow.blur;
      ctx.shadowOffsetX = this.shadow.offsetX;
      ctx.shadowOffsetY = this.shadow.offsetY;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _removeShadow: function(ctx) {
      ctx.shadowColor = '';
      ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderFill: function(ctx) {
      if (!this.fill) return;

      if (this.fill.toLive) {
        ctx.save();
        ctx.translate(
          -this.width / 2 + this.fill.offsetX || 0,
          -this.height / 2 + this.fill.offsetY || 0);
      }
      ctx.fill();
      if (this.fill.toLive) {
        ctx.restore();
      }
      if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderStroke: function(ctx) {
      if (!this.stroke) return;

      ctx.save();
      if (this.strokeDashArray) {
        // Spec requires the concatenation of two copies the dash list when the number of elements is odd
        if (1 & this.strokeDashArray.length) {
          this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
        }

        if (supportsLineDash) {
          ctx.setLineDash(this.strokeDashArray);
          this._stroke && this._stroke(ctx);
        }
        else {
          this._renderDashedStroke && this._renderDashedStroke(ctx);
        }
        ctx.stroke();
      }
      else {
        this._stroke ? this._stroke(ctx) : ctx.stroke();
      }
      this._removeShadow(ctx);
      ctx.restore();
    },

    /**
     * Clones an instance
     * @param {Function} callback Callback is invoked with a clone as a first argument
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the outpu
     * @return {fabric.Object} clone of an instance
     */
    clone: function(callback, propertiesToInclude) {
      if (this.constructor.fromObject) {
        return this.constructor.fromObject(this.toObject(propertiesToInclude), callback);
      }
      return new fabric.Object(this.toObject(propertiesToInclude));
    },

    /**
     * Creates an instance of fabric.Image out of an object
     * @param callback {Function} callback, invoked with an instance as a first argument
     * @return {fabric.Object} thisArg
     */
    cloneAsImage: function(callback) {
      var dataUrl = this.toDataURL();
      fabric.util.loadImage(dataUrl, function(img) {
        if (callback) {
          callback(new fabric.Image(img));
        }
      });
      return this;
    },

    /**
     * Converts an object into a data-url-like string
     * @param {Object} options Options object
     *
     *  `format` the format of the output image. Either "jpeg" or "png".
     *  `quality` quality level (0..1)
     *  `multiplier` multiplier to scale by {Number}
     *
     * @return {String} data url representing an image of this object
     */
    toDataURL: function(options) {
      options || (options = { });

      var el = fabric.util.createCanvasElement();
      el.width = this.getBoundingRectWidth();
      el.height = this.getBoundingRectHeight();

      fabric.util.wrapElement(el, 'div');

      var canvas = new fabric.Canvas(el);
      if (options.format === 'jpeg') {
        canvas.backgroundColor = '#fff';
      }

      var origParams = {
        active: this.get('active'),
        left: this.getLeft(),
        top: this.getTop()
      };

      this.set({
        'active': false,
        left: el.width / 2,
        top: el.height / 2
      });

      canvas.add(this);
      var data = canvas.toDataURL(options);

      this.set(origParams).setCoords();

      canvas.dispose();
      canvas = null;

      return data;
    },

    /**
     * Returns true if specified type is identical to the type of an instance
     * @param type {String} type to check against
     * @return {Boolean}
     */
    isType: function(type) {
      return this.type === type;
    },

    /**
     * Makes object's color grayscale
     * @return {fabric.Object} thisArg
     */
    toGrayscale: function() {
      var fillValue = this.get('fill');
      if (fillValue) {
        this.set('overlayFill', new fabric.Color(fillValue).toGrayscale().toRgb());
      }
      return this;
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 0;
    },

    /**
     * Returns a JSON representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} JSON
     */
    toJSON: function(propertiesToInclude) {
      // delegate, not alias
      return this.toObject(propertiesToInclude);
    },

    /**
     * Sets gradient (fill or stroke) of an object
     * @param {String} property Property name 'stroke' or 'fill'
     * @param {Object} [options] Options object
     */
    setGradient: function(property, options) {
      options || (options = { });

      var gradient = {colorStops: []};

      gradient.type = options.type || (options.r1 || options.r2 ? 'radial' : 'linear');
      gradient.coords = {
        x1: options.x1,
        y1: options.y1,
        x2: options.x2,
        y2: options.y2
      };

      if (options.r1 || options.r2) {
        gradient.coords.r1 = options.r1;
        gradient.coords.r2 = options.r2;
      }

      for (var position in options.colorStops) {
        var color = new fabric.Color(options.colorStops[position]);
        gradient.colorStops.push({offset: position, color: color.toRgb(), opacity: color.getAlpha()});
      }

      this.set(property, fabric.Gradient.forObject(this, gradient));
    },

    /**
     * Sets pattern fill of an object
     * @param {Object} [options] Options object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setPatternFill: function(options) {
      return this.set('fill', new fabric.Pattern(options));
    },

    /**
     * Sets shadow of an object
     * @param {Object} [options] Options object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setShadow: function(options) {
      return this.set('shadow', new fabric.Shadow(options));
    },

    /**
     * Animates object's properties
     * @param {String|Object} property to animate (if string) or properties to animate (if object)
     * @param {Number|Object} value to animate property to (if string was given first) or options object
     * @return {fabric.Object} thisArg
     * @chainable
     *
     * As object — multiple properties
     *
     * object.animate({ left: ..., top: ... });
     * object.animate({ left: ..., top: ... }, { duration: ... });
     *
     * As string — one property
     *
     * object.animate('left', ...);
     * object.animate('left', { duration: ... });
     *
     */
    animate: function() {
      if (arguments[0] && typeof arguments[0] === 'object') {
        var propsToAnimate = [ ], prop, skipCallbacks;
        for (prop in arguments[0]) {
          propsToAnimate.push(prop);
        }
        for (var i = 0, len = propsToAnimate.length; i<len; i++) {
          prop = propsToAnimate[i];
          skipCallbacks = i !== len - 1;
          this._animate(prop, arguments[0][prop], arguments[1], skipCallbacks);
        }
      }
      else {
        this._animate.apply(this, arguments);
      }
      return this;
    },

    /**
     * @private
     * @param {String} property
     * @param {String} to
     * @param {Object} [options]
     * @param {Boolean} [skipCallbacks]
     */
    _animate: function(property, to, options, skipCallbacks) {
      var obj = this, propPair;

      to = to.toString();

      if (!options) {
        options = { };
      }
      else {
        options = fabric.util.object.clone(options);
      }

      if (~property.indexOf('.')) {
        propPair = property.split('.');
      }

      var currentValue = propPair
        ? this.get(propPair[0])[propPair[1]]
        : this.get(property);

      if (!('from' in options)) {
        options.from = currentValue;
      }

      if (~to.indexOf('=')) {
        to = currentValue + parseFloat(to.replace('=', ''));
      }
      else {
        to = parseFloat(to);
      }

      fabric.util.animate({
        startValue: options.from,
        endValue: to,
        byValue: options.by,
        easing: options.easing,
        duration: options.duration,
        onChange: function(value) {
          if (propPair) {
            obj[propPair[0]][propPair[1]] = value;
          }
          else {
            obj.set(property, value);
          }
          if (skipCallbacks) return;
          options.onChange && options.onChange();
        },
        onComplete: function() {
          if (skipCallbacks) return;

          obj.setCoords();
          options.onComplete && options.onComplete();
        }
      });
    },

    /**
     * Centers object horizontally on canvas to which it was added last
     * @return {fabric.Object} thisArg
     */
    centerH: function () {
      this.canvas.centerObjectH(this);
      return this;
    },

    /**
     * Centers object vertically on canvas to which it was added last
     * @return {fabric.Object} thisArg
     * @chainable
     */
    centerV: function () {
      this.canvas.centerObjectV(this);
      return this;
    },

    /**
     * Centers object vertically and horizontally on canvas to which is was added last
     * @return {fabric.Object} thisArg
     * @chainable
     */
    center: function () {
      return this.centerH().centerV();
    },

    /**
     * Removes object from canvas to which it was added last
     * @return {fabric.Object} thisArg
     * @chainable
     */
    remove: function() {
      return this.canvas.remove(this);
    },

    /**
     * Moves an object to the bottom of the stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    sendToBack: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.sendToBack.call(this.group, this);
      }
      else {
        this.canvas.sendToBack(this);
      }
      return this;
    },

    /**
     * Moves an object to the top of the stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    bringToFront: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.bringToFront.call(this.group, this);
      }
      else {
        this.canvas.bringToFront(this);
      }
      return this;
    },

    /**
     * Moves an object one level down in stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    sendBackwards: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.sendBackwards.call(this.group, this);
      }
      else {
        this.canvas.sendBackwards(this);
      }
      return this;
    },

    /**
     * Moves an object one level up in stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    bringForward: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.bringForward.call(this.group, this);
      }
      else {
        this.canvas.bringForward(this);
      }
      return this;
    },

    /**
     * Moves an object to specified level in stack of drawn objects
     * @param {Number} index New position of object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    moveTo: function(index) {
      if (this.group) {
        fabric.StaticCanvas.prototype.moveTo.call(this.group, this, index);
      }
      else {
        this.canvas.moveTo(this, index);
      }
      return this;
    }
  });

  fabric.util.createAccessors(fabric.Object);

  /**
   * Alias for {@link fabric.Object.prototype.setAngle}
   * @alias rotate -> setAngle
   */
  fabric.Object.prototype.rotate = fabric.Object.prototype.setAngle;

  extend(fabric.Object.prototype, fabric.Observable);

  /**
   * Defines the number of fraction digits when serializing object values. You can use it to increase/decrease precision of such values like left, top, scaleX, scaleY, etc.
   * @static
   * @constant
   * @type Number
   */
  fabric.Object.NUM_FRACTION_DIGITS = 2;

  /**
   * @static
   * @type Number
   */
  fabric.Object.__uid = 0;

})(typeof exports !== 'undefined' ? exports : this);
(function() {

  var degreesToRadians = fabric.util.degreesToRadians;

  fabric.util.object.extend(fabric.Object.prototype, /** @lends fabric.Object.prototype */ {

    /**
     * Translates the coordinates from origin to center coordinates (based on the object's dimensions)
     * @param {fabric.Point} point The point which corresponds to the originX and originY params
     * @param {string} enum('left', 'center', 'right') Horizontal origin
     * @param {string} enum('top', 'center', 'bottom') Vertical origin
     * @return {fabric.Point}
     */
    translateToCenterPoint: function(point, originX, originY) {
      var cx = point.x, cy = point.y;

      if ( originX === "left" ) {
        cx = point.x + this.getWidth() / 2;
      }
      else if ( originX === "right" ) {
        cx = point.x - this.getWidth() / 2;
      }

      if ( originY === "top" ) {
        cy = point.y + this.getHeight() / 2;
      }
      else if ( originY === "bottom" ) {
        cy = point.y - this.getHeight() / 2;
      }

      // Apply the reverse rotation to the point (it's already scaled properly)
      return fabric.util.rotatePoint(new fabric.Point(cx, cy), point, degreesToRadians(this.angle));
    },

    /**
     * Translates the coordinates from center to origin coordinates (based on the object's dimensions)
     * @param {fabric.Point} point The point which corresponds to center of the object
     * @param {string} enum('left', 'center', 'right') Horizontal origin
     * @param {string} enum('top', 'center', 'bottom') Vertical origin
     * @return {fabric.Point}
     */
    translateToOriginPoint: function(center, originX, originY) {
      var x = center.x, y = center.y;

      // Get the point coordinates
      if ( originX === "left" ) {
        x = center.x - this.getWidth() / 2;
      }
      else if ( originX === "right" ) {
        x = center.x + this.getWidth() / 2;
      }
      if ( originY === "top" ) {
        y = center.y - this.getHeight() / 2;
      }
      else if ( originY === "bottom" ) {
        y = center.y + this.getHeight() / 2;
      }

      // Apply the rotation to the point (it's already scaled properly)
      return fabric.util.rotatePoint(new fabric.Point(x, y), center, degreesToRadians(this.angle));
    },

    /**
     * Returns the real center coordinates of the object
     * @return {fabric.Point}
     */
    getCenterPoint: function() {
      return this.translateToCenterPoint(
        new fabric.Point(this.left, this.top), this.originX, this.originY);
    },

    /**
     * Returns the coordinates of the object based on center coordinates
     * @param {fabric.Point} point The point which corresponds to the originX and originY params
     * @return {fabric.Point}
     */
    // getOriginPoint: function(center) {
    //   return this.translateToOriginPoint(center, this.originX, this.originY);
    // },

    /**
     * Returns the coordinates of the object as if it has a different origin
     * @param {string} enum('left', 'center', 'right') Horizontal origin
     * @param {string} enum('top', 'center', 'bottom') Vertical origin
     * @return {fabric.Point}
     */
    // getPointByOrigin: function(originX, originY) {
    //   var center = this.getCenterPoint();

    //   return this.translateToOriginPoint(center, originX, originY);
    // },

    /**
     * Returns the point in local coordinates
     * @param {fabric.Point} The point relative to the global coordinate system
     * @return {fabric.Point}
     */
    toLocalPoint: function(point, originX, originY) {
      var center = this.getCenterPoint();

      var x, y;
      if (originX !== undefined && originY !== undefined) {
        if ( originX === "left" ) {
          x = center.x - this.getWidth() / 2;
        }
        else if ( originX === "right" ) {
          x = center.x + this.getWidth() / 2;
        }
        else {
          x = center.x;
        }

        if ( originY === "top" ) {
          y = center.y - this.getHeight() / 2;
        }
        else if ( originY === "bottom" ) {
          y = center.y + this.getHeight() / 2;
        }
        else {
          y = center.y;
        }
      }
      else {
        x = this.left;
        y = this.top;
      }

      return fabric.util.rotatePoint(new fabric.Point(point.x, point.y), center, -degreesToRadians(this.angle)).subtractEquals(new fabric.Point(x, y));
    },

    /**
     * Returns the point in global coordinates
     * @param {fabric.Point} The point relative to the local coordinate system
     * @return {fabric.Point}
     */
    // toGlobalPoint: function(point) {
    //   return fabric.util.rotatePoint(point, this.getCenterPoint(), degreesToRadians(this.angle)).addEquals(new fabric.Point(this.left, this.top));
    // },

    /**
     * Sets the position of the object taking into consideration the object's origin
     * @param {fabric.Point} point The new position of the object
     * @param {string} enum('left', 'center', 'right') Horizontal origin
     * @param {string} enum('top', 'center', 'bottom') Vertical origin
     * @return {void}
     */
    setPositionByOrigin: function(pos, originX, originY) {
      var center = this.translateToCenterPoint(pos, originX, originY);
      var position = this.translateToOriginPoint(center, this.originX, this.originY);

      this.set('left', position.x);
      this.set('top', position.y);
    },

    /**
     * @param {String} to One of left, center, right
     */
    adjustPosition: function(to) {
      var angle = degreesToRadians(this.angle);
      var hypotHalf = this.getWidth() / 2;
      var xHalf = Math.cos(angle) * hypotHalf;
      var yHalf = Math.sin(angle) * hypotHalf;
      var hypotFull = this.getWidth();
      var xFull = Math.cos(angle) * hypotFull;
      var yFull = Math.sin(angle) * hypotFull;

      if (this.originX === 'center' && to === 'left' ||
          this.originX === 'right' && to === 'center') {
        // move half left
        this.left -= xHalf;
        this.top -= yHalf;
      }
      else if (this.originX === 'left' && to === 'center' ||
               this.originX === 'center' && to === 'right') {
        // move half right
        this.left += xHalf;
        this.top += yHalf;
      }
      else if (this.originX === 'left' && to === 'right') {
        // move full right
        this.left += xFull;
        this.top += yFull;
      }
      else if (this.originX === 'right' && to === 'left') {
        // move full left
        this.left -= xFull;
        this.top -= yFull;
      }

      this.setCoords();
      this.originX = to;
    },

    /**
     * @private
     */
    _getLeftTopCoords: function() {
      var angle = degreesToRadians(this.angle);

      var hypotHalf = this.getWidth() / 2;
      var xHalf = Math.cos(angle) * hypotHalf;
      var yHalf = Math.sin(angle) * hypotHalf;
      var x = this.left;
      var y = this.top;

      if (this.originX === 'center' || this.originX === 'right') {
        x -= xHalf;
      }
      if (this.originY === 'center' || this.originY === 'bottom') {
        y -= yHalf;
      }

      return { x: x, y: y };
    }
  });

})();
(function() {

  var degreesToRadians = fabric.util.degreesToRadians;

  fabric.util.object.extend(fabric.Object.prototype, /** @lends fabric.Object.prototype */ {

    /**
     * Checks if object intersects with an area formed by 2 points
     * @param {Object} pointTL top-left point of area
     * @param {Object} pointBR bottom-right point of area
     * @return {Boolean} true if object intersects with an area formed by 2 points
     */
    intersectsWithRect: function(pointTL, pointBR) {
      var oCoords = this.oCoords,
          tl = new fabric.Point(oCoords.tl.x, oCoords.tl.y),
          tr = new fabric.Point(oCoords.tr.x, oCoords.tr.y),
          bl = new fabric.Point(oCoords.bl.x, oCoords.bl.y),
          br = new fabric.Point(oCoords.br.x, oCoords.br.y);

      var intersection = fabric.Intersection.intersectPolygonRectangle(
        [tl, tr, br, bl],
        pointTL,
        pointBR
      );
      return intersection.status === 'Intersection';
    },

    /**
     * Checks if object intersects with another object
     * @param {Object} other Object to test
     * @return {Boolean} true if object intersects with another object
     */
    intersectsWithObject: function(other) {
      // extracts coords
      function getCoords(oCoords) {
        return {
          tl: new fabric.Point(oCoords.tl.x, oCoords.tl.y),
          tr: new fabric.Point(oCoords.tr.x, oCoords.tr.y),
          bl: new fabric.Point(oCoords.bl.x, oCoords.bl.y),
          br: new fabric.Point(oCoords.br.x, oCoords.br.y)
        };
      }
      var thisCoords = getCoords(this.oCoords),
          otherCoords = getCoords(other.oCoords);

      var intersection = fabric.Intersection.intersectPolygonPolygon(
        [thisCoords.tl, thisCoords.tr, thisCoords.br, thisCoords.bl],
        [otherCoords.tl, otherCoords.tr, otherCoords.br, otherCoords.bl]
      );

      return intersection.status === 'Intersection';
    },

    /**
     * Checks if object is fully contained within area of another object
     * @param {Object} other Object to test
     * @return {Boolean} true if object is fully contained within area of another object
     */
    isContainedWithinObject: function(other) {
      var boundingRect = other.getBoundingRect(),
          point1 = new fabric.Point(boundingRect.left, boundingRect.top),
          point2 = new fabric.Point(boundingRect.left + boundingRect.width, boundingRect.top + boundingRect.height);

      return this.isContainedWithinRect(point1, point2);
    },

    /**
     * Checks if object is fully contained within area formed by 2 points
     * @param {Object} pointTL top-left point of area
     * @param {Object} pointBR bottom-right point of area
     * @return {Boolean} true if object is fully contained within area formed by 2 points
     */
    isContainedWithinRect: function(pointTL, pointBR) {
      var boundingRect = this.getBoundingRect();

      return (
        boundingRect.left > pointTL.x &&
        boundingRect.left + boundingRect.width < pointBR.x &&
        boundingRect.top > pointTL.y &&
        boundingRect.top + boundingRect.height < pointBR.y
      );
    },

    /**
     * Checks if point is inside the object
     * @param {Object} point
     * @return {Boolean} true if point is inside the object
     */
    containsPoint: function(point) {
      var lines = this._getImageLines(this.oCoords),
          xPoints = this._findCrossPoints(point, lines);

      // if xPoints is odd then point is inside the object
      return (xPoints !== 0 && xPoints % 2 === 1);
    },

    /**
     * Method that returns an object with the object edges in it, given the coordinates of the corners
     * @private
     * @param {Object} oCoords Coordinates of the object corners
     */
    _getImageLines: function(oCoords) {
      return {
        topline: {
          o: oCoords.tl,
          d: oCoords.tr
        },
        rightline: {
          o: oCoords.tr,
          d: oCoords.br
        },
        bottomline: {
          o: oCoords.br,
          d: oCoords.bl
        },
        leftline: {
          o: oCoords.bl,
          d: oCoords.tl
        }
      };
    },

    /**
     * Helper method to determine how many cross points are between the 4 object edges
     * and the horizontal line determined by a point on canvas
     * @private
     * @param {Object} point
     * @param {Object} oCoords Coordinates of the image being evaluated
     */
    _findCrossPoints: function(point, oCoords) {
      var b1, b2, a1, a2, xi, yi,
          xcount = 0,
          iLine;

      for (var lineKey in oCoords) {
        iLine = oCoords[lineKey];
        // optimisation 1: line below point. no cross
        if ((iLine.o.y < point.y) && (iLine.d.y < point.y)) {
          continue;
        }
        // optimisation 2: line above point. no cross
        if ((iLine.o.y >= point.y) && (iLine.d.y >= point.y)) {
          continue;
        }
        // optimisation 3: vertical line case
        if ((iLine.o.x === iLine.d.x) && (iLine.o.x >= point.x)) {
          xi = iLine.o.x;
          yi = point.y;
        }
        // calculate the intersection point
        else {
          b1 = 0;
          b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
          a1 = point.y- b1 * point.x;
          a2 = iLine.o.y - b2 * iLine.o.x;

          xi = - (a1 - a2) / (b1 - b2);
          yi = a1 + b1 * xi;
        }
        // dont count xi < point.x cases
        if (xi >= point.x) {
          xcount += 1;
        }
        // optimisation 4: specific for square images
        if (xcount === 2) {
          break;
        }
      }
      return xcount;
    },

    /**
     * Returns width of an object's bounding rectangle
     * @deprecated since 1.0.4
     * @return {Number} width value
     */
    getBoundingRectWidth: function() {
      return this.getBoundingRect().width;
    },

    /**
     * Returns height of an object's bounding rectangle
     * @deprecated since 1.0.4
     * @return {Number} height value
     */
    getBoundingRectHeight: function() {
      return this.getBoundingRect().height;
    },

    /**
     * Returns coordinates of object's bounding rectangle (left, top, width, height)
     * @return {Object} Object with left, top, width, height properties
     */
    getBoundingRect: function() {
      this.oCoords || this.setCoords();

      var xCoords = [this.oCoords.tl.x, this.oCoords.tr.x, this.oCoords.br.x, this.oCoords.bl.x];
      var minX = fabric.util.array.min(xCoords);
      var maxX = fabric.util.array.max(xCoords);
      var width = Math.abs(minX - maxX);

      var yCoords = [this.oCoords.tl.y, this.oCoords.tr.y, this.oCoords.br.y, this.oCoords.bl.y];
      var minY = fabric.util.array.min(yCoords);
      var maxY = fabric.util.array.max(yCoords);
      var height = Math.abs(minY - maxY);

      return {
        left: minX,
        top: minY,
        width: width,
        height: height
      };
    },

    /**
     * Returns width of an object
     * @return {Number} width value
     */
    getWidth: function() {
      return this.width * this.scaleX;
    },

    /**
     * Returns height of an object
     * @return {Number} height value
     */
    getHeight: function() {
      return this.height * this.scaleY;
    },

    /**
     * Makes sure the scale is valid and modifies it if necessary
     * @private
     * @param {Number} value
     * @return {Number}
     */
    _constrainScale: function(value) {
      if (Math.abs(value) < this.minScaleLimit) {
        if (value < 0)
          return -this.minScaleLimit;
        else
          return this.minScaleLimit;
      }

      return value;
    },

    /**
     * Scales an object (equally by x and y)
     * @param value {Number} scale factor
     * @return {fabric.Object} thisArg
     * @chainable
     */
    scale: function(value) {
      value = this._constrainScale(value);

      if (value < 0) {
        this.flipX = !this.flipX;
        this.flipY = !this.flipY;
        value *= -1;
      }

      this.scaleX = value;
      this.scaleY = value;
      this.setCoords();
      return this;
    },

    /**
     * Scales an object to a given width, with respect to bounding box (scaling by x/y equally)
     * @param value {Number} new width value
     * @return {fabric.Object} thisArg
     * @chainable
     */
    scaleToWidth: function(value) {
      // adjust to bounding rect factor so that rotated shapes would fit as well
      var boundingRectFactor = this.getBoundingRectWidth() / this.getWidth();
      return this.scale(value / this.width / boundingRectFactor);
    },

    /**
     * Scales an object to a given height, with respect to bounding box (scaling by x/y equally)
     * @param value {Number} new height value
     * @return {fabric.Object} thisArg
     * @chainable
     */
    scaleToHeight: function(value) {
      // adjust to bounding rect factor so that rotated shapes would fit as well
      var boundingRectFactor = this.getBoundingRectHeight() / this.getHeight();
      return this.scale(value / this.height / boundingRectFactor);
    },

    /**
     * Sets corner position coordinates based on current angle, width and height
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setCoords: function() {

      var strokeWidth = this.strokeWidth > 1 ? this.strokeWidth : 0,
          padding = this.padding,
          theta = degreesToRadians(this.angle);

      this.currentWidth = (this.width + strokeWidth) * this.scaleX + padding * 2;
      this.currentHeight = (this.height + strokeWidth) * this.scaleY + padding * 2;

      // If width is negative, make postive. Fixes path selection issue
      if (this.currentWidth < 0) {
        this.currentWidth = Math.abs(this.currentWidth);
      }

      var _hypotenuse = Math.sqrt(
        Math.pow(this.currentWidth / 2, 2) +
        Math.pow(this.currentHeight / 2, 2));

      var _angle = Math.atan(isFinite(this.currentHeight / this.currentWidth) ? this.currentHeight / this.currentWidth : 0);

      // offset added for rotate and scale actions
      var offsetX = Math.cos(_angle + theta) * _hypotenuse,
          offsetY = Math.sin(_angle + theta) * _hypotenuse,
          sinTh = Math.sin(theta),
          cosTh = Math.cos(theta);

      var coords = this.getCenterPoint();
      var tl = {
        x: coords.x - offsetX,
        y: coords.y - offsetY
      };
      var tr = {
        x: tl.x + (this.currentWidth * cosTh),
        y: tl.y + (this.currentWidth * sinTh)
      };
      var br = {
        x: tr.x - (this.currentHeight * sinTh),
        y: tr.y + (this.currentHeight * cosTh)
      };
      var bl = {
        x: tl.x - (this.currentHeight * sinTh),
        y: tl.y + (this.currentHeight * cosTh)
      };
      var ml = {
        x: tl.x - (this.currentHeight/2 * sinTh),
        y: tl.y + (this.currentHeight/2 * cosTh)
      };
      var mt = {
        x: tl.x + (this.currentWidth/2 * cosTh),
        y: tl.y + (this.currentWidth/2 * sinTh)
      };
      var mr = {
        x: tr.x - (this.currentHeight/2 * sinTh),
        y: tr.y + (this.currentHeight/2 * cosTh)
      };
      var mb = {
        x: bl.x + (this.currentWidth/2 * cosTh),
        y: bl.y + (this.currentWidth/2 * sinTh)
      };
      var mtr = {
        x: mt.x,
        y: mt.y
      };

      // debugging

      // setTimeout(function() {
      //   canvas.contextTop.fillStyle = 'green';
      //   canvas.contextTop.fillRect(mb.x, mb.y, 3, 3);
      //   canvas.contextTop.fillRect(bl.x, bl.y, 3, 3);
      //   canvas.contextTop.fillRect(br.x, br.y, 3, 3);
      //   canvas.contextTop.fillRect(tl.x, tl.y, 3, 3);
      //   canvas.contextTop.fillRect(tr.x, tr.y, 3, 3);
      //   canvas.contextTop.fillRect(ml.x, ml.y, 3, 3);
      //   canvas.contextTop.fillRect(mr.x, mr.y, 3, 3);
      //   canvas.contextTop.fillRect(mt.x, mt.y, 3, 3);
      // }, 50);

      this.oCoords = {
        // corners
        tl: tl, tr: tr, br: br, bl: bl,
        // middle
        ml: ml, mt: mt, mr: mr, mb: mb,
        // rotating point
        mtr: mtr
      };

      // set coordinates of the draggable boxes in the corners used to scale/rotate the image
      this._setCornerCoords && this._setCornerCoords();

      return this;
    }
  });
})();
/*
  Depends on `stateProperties`
*/
fabric.util.object.extend(fabric.Object.prototype, /** @lends fabric.Object.prototype */ {

  /**
   * Returns true if object state (one of its state properties) was changed
   * @return {Boolean} true if instance' state has changed since `{@link fabric.Object#saveState}` was called
   */
  hasStateChanged: function() {
    return this.stateProperties.some(function(prop) {
      return this[prop] !== this.originalState[prop];
    }, this);
  },

  /**
   * Saves state of an object
   * @param {Object} [options] Object with additional `stateProperties` array to include when saving state
   * @return {fabric.Object} thisArg
   */
  saveState: function(options) {
    this.stateProperties.forEach(function(prop) {
      this.originalState[prop] = this.get(prop);
    }, this);

    if (options && options.stateProperties) {
      options.stateProperties.forEach(function(prop) {
        this.originalState[prop] = this.get(prop);
      }, this);
    }

    return this;
  },

  /**
   * Setups state of an object
   * @return {fabric.Object} thisArg
   */
  setupState: function() {
    this.originalState = { };
    this.saveState();

    return this;
  }
});
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      coordProps = { 'x1': 1, 'x2': 1, 'y1': 1, 'y2': 1 },
      supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

  if (fabric.Line) {
    fabric.warn('fabric.Line is already defined');
    return;
  }

  /**
   * Line class
   * @class fabric.Line
   * @extends fabric.Object
   */
  fabric.Line = fabric.util.createClass(fabric.Object, /** @lends fabric.Line.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'line',

    /**
     * Constructor
     * @param {Array} [points] Array of points
     * @param {Object} [options] Options object
     * @return {fabric.Line} thisArg
     */
    initialize: function(points, options) {
      options = options || { };

      if (!points) {
        points = [0, 0, 0, 0];
      }

      this.callSuper('initialize', options);

      this.set('x1', points[0]);
      this.set('y1', points[1]);
      this.set('x2', points[2]);
      this.set('y2', points[3]);

      this._setWidthHeight(options);
    },

    /**
     * @private
     * @param {Object} [options] Options
     */
    _setWidthHeight: function(options) {
      options || (options = { });

      this.set('width', Math.abs(this.x2 - this.x1) || 1);
      this.set('height', Math.abs(this.y2 - this.y1) || 1);

      this.set('left', 'left' in options ? options.left : (Math.min(this.x1, this.x2) + this.width / 2));
      this.set('top', 'top' in options ? options.top : (Math.min(this.y1, this.y2) + this.height / 2));
    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     */
    _set: function(key, value) {
      this[key] = value;
      if (key in coordProps) {
        this._setWidthHeight();
      }
      return this;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      ctx.beginPath();

      var isInPathGroup = this.group && this.group.type !== 'group';
      if (isInPathGroup && !this.transformMatrix) {
        ctx.translate(-this.group.width/2 + this.left, -this.group.height / 2 + this.top);
      }

      if (!this.strokeDashArray || this.strokeDashArray && supportsLineDash) {

        // move from center (of virtual box) to its left/top corner
        // we can't assume x1, y1 is top left and x2, y2 is bottom right
        var xMult = this.x1 <= this.x2 ? -1 : 1;
        var yMult = this.y1 <= this.y2 ? -1 : 1;

        ctx.moveTo(
          this.width === 1 ? 0 : (xMult * this.width / 2),
          this.height === 1 ? 0 : (yMult * this.height / 2));

        ctx.lineTo(
          this.width === 1 ? 0 : (xMult * -1 * this.width / 2),
          this.height === 1 ? 0 : (yMult * -1 * this.height / 2));
      }

      ctx.lineWidth = this.strokeWidth;

      // TODO: test this
      // make sure setting "fill" changes color of a line
      // (by copying fillStyle to strokeStyle, since line is stroked, not filled)
      var origStrokeStyle = ctx.strokeStyle;
      ctx.strokeStyle = this.stroke || ctx.fillStyle;
      this._renderStroke(ctx);
      ctx.strokeStyle = origStrokeStyle;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderDashedStroke: function(ctx) {
      var x = this.width === 1 ? 0 : -this.width / 2,
          y = this.height === 1 ? 0 : -this.height / 2;

      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, -x, -y, this.strokeDashArray);
      ctx.closePath();
    },

    /**
     * Returns object representation of an instance
     * @methd toObject
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        x1: this.get('x1'),
        y1: this.get('y1'),
        x2: this.get('x2'),
        y2: this.get('y2')
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var markup = [];

      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, true));
      }

      markup.push(
        '<line ',
          'x1="', this.get('x1'),
          '" y1="', this.get('y1'),
          '" x2="', this.get('x2'),
          '" y2="', this.get('y2'),
          '" style="', this.getSvgStyles(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns complexity of an instance
     * @return {Number} complexity
     */
    complexity: function() {
      return 1;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Line.fromElement})
   * @static
   * @see http://www.w3.org/TR/SVG/shapes.html#LineElement
   */
  fabric.Line.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x1 y1 x2 y2'.split(' '));

  /**
   * Returns fabric.Line instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Line} instance of fabric.Line
   */
  fabric.Line.fromElement = function(element, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Line.ATTRIBUTE_NAMES);
    var points = [
      parsedAttributes.x1 || 0,
      parsedAttributes.y1 || 0,
      parsedAttributes.x2 || 0,
      parsedAttributes.y2 || 0
    ];
    return new fabric.Line(points, extend(parsedAttributes, options));
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns fabric.Line instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Line} instance of fabric.Line
   */
  fabric.Line.fromObject = function(object) {
    var points = [object.x1, object.y1, object.x2, object.y2];
    return new fabric.Line(points, object);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric  = global.fabric || (global.fabric = { }),
      piBy2   = Math.PI * 2,
      extend = fabric.util.object.extend;

  if (fabric.Circle) {
    fabric.warn('fabric.Circle is already defined.');
    return;
  }

  /**
   * Circle class
   * @class fabric.Circle
   * @extends fabric.Object
   */
  fabric.Circle = fabric.util.createClass(fabric.Object, /** @lends fabric.Circle.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'circle',

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {fabric.Circle} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this.set('radius', options.radius || 0);
      this.callSuper('initialize', options);

      var diameter = this.get('radius') * 2;
      this.set('width', diameter).set('height', diameter);
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        radius: this.get('radius')
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var markup = [];

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, false));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, false));
      }

      markup.push(
        '<circle ',
          'cx="0" cy="0" ',
          'r="', this.radius,
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * @private
     * @param ctx {CanvasRenderingContext2D} context to render on
     */
    _render: function(ctx, noTransform) {
      ctx.beginPath();
      // multiply by currently set alpha (the one that was set by path group where this object is contained, for example)
      ctx.globalAlpha = this.group ? (ctx.globalAlpha * this.opacity) : this.opacity;
      ctx.arc(noTransform ? this.left : 0, noTransform ? this.top : 0, this.radius, 0, piBy2, false);
      ctx.closePath();

      this._renderFill(ctx);
      this._renderStroke(ctx);
    },

    /**
     * Returns horizontal radius of an object (according to how an object is scaled)
     * @return {Number}
     */
    getRadiusX: function() {
      return this.get('radius') * this.get('scaleX');
    },

    /**
     * Returns vertical radius of an object (according to how an object is scaled)
     * @return {Number}
     */
    getRadiusY: function() {
      return this.get('radius') * this.get('scaleY');
    },

    /**
     * Sets radius of an object (and updates width accordingly)
     * @return {Number}
     */
    setRadius: function(value) {
      this.radius = value;
      this.set('width', value * 2).set('height', value * 2);
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 1;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Circle.fromElement})
   * @static
   * @see: http://www.w3.org/TR/SVG/shapes.html#CircleElement
   */
  fabric.Circle.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('cx cy r'.split(' '));

  /**
   * Returns {@link fabric.Circle} instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @throws {Error} If value of `r` attribute is missing or invalid
   * @return {fabric.Circle} Instance of fabric.Circle
   */
  fabric.Circle.fromElement = function(element, options) {
    options || (options = { });
    var parsedAttributes = fabric.parseAttributes(element, fabric.Circle.ATTRIBUTE_NAMES);
    if (!isValidRadius(parsedAttributes)) {
      throw new Error('value of `r` attribute is required and can not be negative');
    }
    if ('left' in parsedAttributes) {
      parsedAttributes.left -= (options.width / 2) || 0;
    }
    if ('top' in parsedAttributes) {
      parsedAttributes.top -= (options.height / 2) || 0;
    }
    var obj = new fabric.Circle(extend(parsedAttributes, options));

    obj.cx = parseFloat(element.getAttribute('cx')) || 0;
    obj.cy = parseFloat(element.getAttribute('cy')) || 0;

    return obj;
  };

  /**
   * @private
   */
  function isValidRadius(attributes) {
    return (('radius' in attributes) && (attributes.radius > 0));
  }
  /* _FROM_SVG_END_ */

  /**
   * Returns {@link fabric.Circle} instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {Object} Instance of fabric.Circle
   */
  fabric.Circle.fromObject = function(object) {
    return new fabric.Circle(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Triangle) {
    fabric.warn('fabric.Triangle is already defined');
    return;
  }

  /**
   * Triangle class
   * @class fabric.Triangle
   * @extends fabric.Object
   * @return {fabric.Triangle} thisArg
   */
  fabric.Triangle = fabric.util.createClass(fabric.Object, /** @lends fabric.Triangle.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'triangle',

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this.callSuper('initialize', options);

      this.set('width', options.width || 100)
          .set('height', options.height || 100);
    },

    /**
     * @private
     * @param ctx {CanvasRenderingContext2D} Context to render on
     */
    _render: function(ctx) {
      var widthBy2 = this.width / 2,
          heightBy2 = this.height / 2;

      ctx.beginPath();
      ctx.moveTo(-widthBy2, heightBy2);
      ctx.lineTo(0, -heightBy2);
      ctx.lineTo(widthBy2, heightBy2);
      ctx.closePath();

      this._renderFill(ctx);
      this._renderStroke(ctx);
    },

    /**
     * @private
     * @param ctx {CanvasRenderingContext2D} Context to render on
     */
    _renderDashedStroke: function(ctx) {
      var widthBy2 = this.width / 2,
          heightBy2 = this.height / 2;

      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, -widthBy2, heightBy2, 0, -heightBy2, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, 0, -heightBy2, widthBy2, heightBy2, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, widthBy2, heightBy2, -widthBy2, heightBy2, this.strokeDashArray);
      ctx.closePath();
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var markup = [],
          widthBy2 = this.width / 2,
          heightBy2 = this.height / 2;

      var points = [
        -widthBy2 + " " + heightBy2,
        "0 " + -heightBy2,
        widthBy2 + " " + heightBy2
      ].join(",");

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, true));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, true));
      }

      markup.push(
        '<polygon ',
          'points="', points,
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 1;
    }
  });

  /**
   * Returns fabric.Triangle instance from an object representation
   * @static
   * @param object {Object} object to create an instance from
   * @return {Object} instance of Canvas.Triangle
   */
  fabric.Triangle.fromObject = function(object) {
    return new fabric.Triangle(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      piBy2   = Math.PI * 2,
      extend = fabric.util.object.extend;

  if (fabric.Ellipse) {
    fabric.warn('fabric.Ellipse is already defined.');
    return;
  }

  /**
   * Ellipse class
   * @class fabric.Ellipse
   * @extends fabric.Object
   * @return {fabric.Ellipse} thisArg
   */
  fabric.Ellipse = fabric.util.createClass(fabric.Object, /** @lends fabric.Ellipse.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'ellipse',

    /**
     * Horizontal radius
     * @type Number
     * @default
     */
    rx:   0,

    /**
     * Vertical radius
     * @type Number
     * @default
     */
    ry:   0,

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {fabric.Ellipse} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this.callSuper('initialize', options);

      this.set('rx', options.rx || 0);
      this.set('ry', options.ry || 0);

      this.set('width', this.get('rx') * 2);
      this.set('height', this.get('ry') * 2);
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        rx: this.get('rx'),
        ry: this.get('ry')
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var markup = [];

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, false));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, false));
      }

      markup.push(
        '<ellipse ',
          'rx="', this.get('rx'),
          '" ry="', this.get('ry'),
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Renders this instance on a given context
     * @param ctx {CanvasRenderingContext2D} context to render on
     * @param noTransform {Boolean} context is not transformed when set to true
     */
    render: function(ctx, noTransform) {
      // do not use `get` for perf. reasons
      if (this.rx === 0 || this.ry === 0) return;
      return this.callSuper('render', ctx, noTransform);
    },

    /**
     * @private
     * @param ctx {CanvasRenderingContext2D} context to render on
     */
    _render: function(ctx, noTransform) {
      ctx.beginPath();
      ctx.save();
      ctx.globalAlpha = this.group ? (ctx.globalAlpha * this.opacity) : this.opacity;
      if (this.transformMatrix && this.group) {
        ctx.translate(this.cx, this.cy);
      }
      ctx.transform(1, 0, 0, this.ry/this.rx, 0, 0);
      ctx.arc(noTransform ? this.left : 0, noTransform ? this.top : 0, this.rx, 0, piBy2, false);

      this._renderFill(ctx);
      this._renderStroke(ctx);
      ctx.restore();
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity
     */
    complexity: function() {
      return 1;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Ellipse.fromElement})
   * @static
   * @see http://www.w3.org/TR/SVG/shapes.html#EllipseElement
   */
  fabric.Ellipse.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('cx cy rx ry'.split(' '));

  /**
   * Returns {@link fabric.Ellipse} instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Ellipse}
   */
  fabric.Ellipse.fromElement = function(element, options) {
    options || (options = { });

    var parsedAttributes = fabric.parseAttributes(element, fabric.Ellipse.ATTRIBUTE_NAMES);
    var cx = parsedAttributes.left;
    var cy = parsedAttributes.top;

    if ('left' in parsedAttributes) {
      parsedAttributes.left -= (options.width / 2) || 0;
    }
    if ('top' in parsedAttributes) {
      parsedAttributes.top -= (options.height / 2) || 0;
    }

    var ellipse = new fabric.Ellipse(extend(parsedAttributes, options));

    ellipse.cx = cx || 0;
    ellipse.cy = cy || 0;

    return ellipse;
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns {@link fabric.Ellipse} instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Ellipse}
   */
  fabric.Ellipse.fromObject = function(object) {
    return new fabric.Ellipse(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  if (fabric.Rect) {
    console.warn('fabric.Rect is already defined');
    return;
  }

  /**
   * Rectangle class
   * @class fabric.Rect
   * @extends fabric.Object
   * @return {fabric.Rect} thisArg
   */
  fabric.Rect = fabric.util.createClass(fabric.Object, /** @lends fabric.Rect.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'rect',

    /**
     * Horizontal border radius
     * @type Number
     * @default
     */
    rx:   0,

    /**
     * Vertical border radius
     * @type Number
     * @default
     */
    ry:   0,

    /**
     * Used to specify dash pattern for stroke on this object
     * @type Array
     */
    strokeDashArray: null,

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this._initStateProperties();
      this.callSuper('initialize', options);
      this._initRxRy();

      this.x = 0;
      this.y = 0;
    },

    /**
     * Creates `stateProperties` list on an instance, and adds `fabric.Rect` -specific ones to it
     * (such as "rx", "ry", etc.)
     * @private
     */
    _initStateProperties: function() {
      this.stateProperties = this.stateProperties.concat(['rx', 'ry']);
    },

    /**
     * Initializes rx/ry attributes
     * @private
     */
    _initRxRy: function() {
      if (this.rx && !this.ry) {
        this.ry = this.rx;
      }
      else if (this.ry && !this.rx) {
        this.rx = this.ry;
      }
    },

    /**
     * @private
     * @param ctx {CanvasRenderingContext2D} context to render on
     */
    _render: function(ctx) {
      var rx = this.rx || 0,
          ry = this.ry || 0,
          x = -this.width / 2,
          y = -this.height / 2,
          w = this.width,
          h = this.height,
          isInPathGroup = this.group && this.group.type !== 'group';

      ctx.beginPath();
      ctx.globalAlpha = isInPathGroup ? (ctx.globalAlpha * this.opacity) : this.opacity;

      if (this.transformMatrix && isInPathGroup) {
        ctx.translate(
          this.width / 2 + this.x,
          this.height / 2 + this.y);
      }
      if (!this.transformMatrix && isInPathGroup) {
        ctx.translate(
          -this.group.width / 2 + this.width / 2 + this.x,
          -this.group.height / 2 + this.height / 2 + this.y);
      }

      ctx.moveTo(x+rx, y);
      ctx.lineTo(x+w-rx, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+ry, x+w, y+ry);
      ctx.lineTo(x+w, y+h-ry);
      ctx.quadraticCurveTo(x+w,y+h,x+w-rx,y+h,x+w-rx,y+h);
      ctx.lineTo(x+rx,y+h);
      ctx.quadraticCurveTo(x,y+h,x,y+h-ry,x,y+h-ry);
      ctx.lineTo(x,y+ry);
      ctx.quadraticCurveTo(x,y,x+rx,y,x+rx,y);
      ctx.closePath();

      this._renderFill(ctx);
      this._renderStroke(ctx);
    },

    /**
     * @private
     * @param ctx {CanvasRenderingContext2D} context to render on
     */
    _renderDashedStroke: function(ctx) {
     var x = -this.width/2,
         y = -this.height/2,
         w = this.width,
         h = this.height;

      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, x+w, y, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x+w, y, x+w, y+h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x+w, y+h, x, y+h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x, y+h, x, y, this.strokeDashArray);
      ctx.closePath();
    },

    /**
     * Since coordinate system differs from that of SVG
     * @private
     */
    _normalizeLeftTopProperties: function(parsedAttributes) {
      if ('left' in parsedAttributes) {
        this.set('left', parsedAttributes.left + this.getWidth() / 2);
      }
      this.set('x', parsedAttributes.left || 0);
      if ('top' in parsedAttributes) {
        this.set('top', parsedAttributes.top + this.getHeight() / 2);
      }
      this.set('y', parsedAttributes.top || 0);
      return this;
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        rx: this.get('rx') || 0,
        ry: this.get('ry') || 0
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var markup = [];

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, false));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, false));
      }

      markup.push(
        '<rect ',
          'x="', (-1 * this.width / 2), '" y="', (-1 * this.height / 2),
          '" rx="', this.get('rx'), '" ry="', this.get('ry'),
          '" width="', this.width, '" height="', this.height,
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns complexity of an instance
     * @return {Number} complexity
     */
    complexity: function() {
      return 1;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by `fabric.Rect.fromElement`)
   * @static
   */
  fabric.Rect.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y rx ry width height'.split(' '));

  /**
   * @private
   */
  function _setDefaultLeftTopValues(attributes) {
    attributes.left = attributes.left || 0;
    attributes.top  = attributes.top  || 0;
    return attributes;
  }

  /**
   * Returns {@link fabric.Rect} instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Rect} Instance of fabric.Rect
   */
  fabric.Rect.fromElement = function(element, options) {
    if (!element) {
      return null;
    }

    var parsedAttributes = fabric.parseAttributes(element, fabric.Rect.ATTRIBUTE_NAMES);
    parsedAttributes = _setDefaultLeftTopValues(parsedAttributes);

    var rect = new fabric.Rect(extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes));
    rect._normalizeLeftTopProperties(parsedAttributes);

    return rect;
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns {@link fabric.Rect} instance from an object representation
   * @static
   * @param object {Object} object to create an instance from
   * @return {Object} instance of fabric.Rect
   */
  fabric.Rect.fromObject = function(object) {
    return new fabric.Rect(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      toFixed = fabric.util.toFixed,
      min = fabric.util.array.min;

  if (fabric.Polyline) {
    fabric.warn('fabric.Polyline is already defined');
    return;
  }

  /**
   * Polyline class
   * @class fabric.Polyline
   * @extends fabric.Object
   */
  fabric.Polyline = fabric.util.createClass(fabric.Object, /** @lends fabric.Polyline.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'polyline',

    /**
     * Constructor
     * @param {Array} points Array of points
     * @param {Object} [options] Options object
     * @param {Boolean} [skipOffset] Whether points offsetting should be skipped
     * @return {fabric.Polyline} thisArg
     */
    initialize: function(points, options, skipOffset) {
      options = options || { };
      this.set('points', points);
      this.callSuper('initialize', options);
      this._calcDimensions(skipOffset);
    },

    /**
     * @private
     * @param {Boolean} [skipOffset] Whether points offsetting should be skipped
     */
    _calcDimensions: function(skipOffset) {
      return fabric.Polygon.prototype._calcDimensions.call(this, skipOffset);
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return fabric.Polygon.prototype.toObject.call(this, propertiesToInclude);
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var points = [],
          markup = [];

      for (var i = 0, len = this.points.length; i < len; i++) {
        points.push(toFixed(this.points[i].x, 2), ',', toFixed(this.points[i].y, 2), ' ');
      }

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, false));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, false));
      }

      markup.push(
        '<polyline ',
          'points="', points.join(''),
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      var point;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (var i = 0, len = this.points.length; i < len; i++) {
        point = this.points[i];
        ctx.lineTo(point.x, point.y);
      }

      this._renderFill(ctx);
      this._renderStroke(ctx);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderDashedStroke: function(ctx) {
      var p1, p2;

      ctx.beginPath();
      for (var i = 0, len = this.points.length; i < len; i++) {
        p1 = this.points[i];
        p2 = this.points[i+1] || p1;
        fabric.util.drawDashedLine(ctx, p1.x, p1.y, p2.x, p2.y, this.strokeDashArray);
      }
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return this.get('points').length;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Polyline.fromElement})
   * @static
   * @see: http://www.w3.org/TR/SVG/shapes.html#PolylineElement
   */
  fabric.Polyline.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat();

  /**
   * Returns fabric.Polyline instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Polyline} Instance of fabric.Polyline
   */
  fabric.Polyline.fromElement = function(element, options) {
    if (!element) {
      return null;
    }
    options || (options = { });

    var points = fabric.parsePointsAttribute(element.getAttribute('points')),
        parsedAttributes = fabric.parseAttributes(element, fabric.Polyline.ATTRIBUTE_NAMES),
        minX = min(points, 'x'),
        minY = min(points, 'y');

    minX = minX < 0 ? minX : 0;
    minY = minX < 0 ? minY : 0;

    for (var i = 0, len = points.length; i < len; i++) {
      // normalize coordinates, according to containing box (dimensions of which are passed via `options`)
      points[i].x -= (options.width / 2 + minX) || 0;
      points[i].y -= (options.height / 2 + minY) || 0;
    }

    return new fabric.Polyline(points, fabric.util.object.extend(parsedAttributes, options), true);
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns fabric.Polyline instance from an object representation
   * @static
   * @param object {Object} object Object to create an instance from
   * @return {fabric.Polyline} Instance of fabric.Polyline
   */
  fabric.Polyline.fromObject = function(object) {
    var points = object.points;
    return new fabric.Polyline(points, object, true);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      toFixed = fabric.util.toFixed;

  if (fabric.Polygon) {
    fabric.warn('fabric.Polygon is already defined');
    return;
  }

  /**
   * Polygon class
   * @class fabric.Polygon
   * @extends fabric.Object
   */
  fabric.Polygon = fabric.util.createClass(fabric.Object, /** @lends fabric.Polygon.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'polygon',

    /**
     * Constructor
     * @param {Array} points Array of points
     * @param {Object} [options] Options object
     * @param {Boolean} [skipOffset] Whether points offsetting should be skipped
     * @return {fabric.Polygon} thisArg
     */
    initialize: function(points, options, skipOffset) {
      options = options || { };
      this.points = points;
      this.callSuper('initialize', options);
      this._calcDimensions(skipOffset);
    },

    /**
     * @private
     * @param {Boolean} [skipOffset] Whether points offsetting should be skipped
     */
    _calcDimensions: function(skipOffset) {

      var points = this.points,
          minX = min(points, 'x'),
          minY = min(points, 'y'),
          maxX = max(points, 'x'),
          maxY = max(points, 'y');

      this.width = (maxX - minX) || 1;
      this.height = (maxY - minY) || 1;

      this.minX = minX;
      this.minY = minY;

      if (skipOffset) return;

      var halfWidth = this.width / 2 + this.minX,
          halfHeight = this.height / 2 + this.minY;

      // change points to offset polygon into a bounding box
      this.points.forEach(function(p) {
        p.x -= halfWidth;
        p.y -= halfHeight;
      }, this);
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        points: this.points.concat()
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var points = [],
          markup = [];

      for (var i = 0, len = this.points.length; i < len; i++) {
        points.push(toFixed(this.points[i].x, 2), ',', toFixed(this.points[i].y, 2), ' ');
      }

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, false));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, false));
      }

      markup.push(
        '<polygon ',
          'points="', points.join(''),
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      var point;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (var i = 0, len = this.points.length; i < len; i++) {
        point = this.points[i];
        ctx.lineTo(point.x, point.y);
      }
      this._renderFill(ctx);
      if (this.stroke || this.strokeDashArray) {
        ctx.closePath();
        this._renderStroke(ctx);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderDashedStroke: function(ctx) {
      var p1, p2;

      ctx.beginPath();
      for (var i = 0, len = this.points.length; i < len; i++) {
        p1 = this.points[i];
        p2 = this.points[i+1] || this.points[0];
        fabric.util.drawDashedLine(ctx, p1.x, p1.y, p2.x, p2.y, this.strokeDashArray);
      }
      ctx.closePath();
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return this.points.length;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by `fabric.Polygon.fromElement`)
   * @static
   * @see: http://www.w3.org/TR/SVG/shapes.html#PolygonElement
   */
  fabric.Polygon.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat();

  /**
   * Returns {@link fabric.Polygon} instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Polygon} Instance of fabric.Polygon
   */
  fabric.Polygon.fromElement = function(element, options) {
    if (!element) {
      return null;
    }
    options || (options = { });

    var points = fabric.parsePointsAttribute(element.getAttribute('points')),
        parsedAttributes = fabric.parseAttributes(element, fabric.Polygon.ATTRIBUTE_NAMES),
        minX = min(points, 'x'),
        minY = min(points, 'y');

    minX = minX < 0 ? minX : 0;
    minY = minX < 0 ? minY : 0;

    for (var i = 0, len = points.length; i < len; i++) {
      // normalize coordinates, according to containing box (dimensions of which are passed via `options`)
      points[i].x -= (options.width / 2 + minX) || 0;
      points[i].y -= (options.height / 2 + minY) || 0;
    }

    return new fabric.Polygon(points, extend(parsedAttributes, options), true);
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns fabric.Polygon instance from an object representation
   * @static
   * @param object {Object} object Object to create an instance from
   * @return {fabric.Polygon} Instance of fabric.Polygon
   */
  fabric.Polygon.fromObject = function(object) {
    return new fabric.Polygon(object.points, object, true);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  var commandLengths = {
    m: 2,
    l: 2,
    h: 1,
    v: 1,
    c: 6,
    s: 4,
    q: 4,
    t: 2,
    a: 7
  };

  function drawArc(ctx, x, y, coords) {
    var rx = coords[0];
    var ry = coords[1];
    var rot = coords[2];
    var large = coords[3];
    var sweep = coords[4];
    var ex = coords[5];
    var ey = coords[6];
    var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
    for (var i=0; i<segs.length; i++) {
     var bez = segmentToBezier.apply(this, segs[i]);
     ctx.bezierCurveTo.apply(ctx, bez);
    }
  }

  var arcToSegmentsCache = { },
      segmentToBezierCache = { },
      _join = Array.prototype.join,
      argsString;

  // Generous contribution by Raph Levien, from libsvg-0.1.0.tar.gz
  function arcToSegments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
    argsString = _join.call(arguments);
    if (arcToSegmentsCache[argsString]) {
      return arcToSegmentsCache[argsString];
    }

    var th = rotateX * (Math.PI/180);
    var sin_th = Math.sin(th);
    var cos_th = Math.cos(th);
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
    var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
    var pl = (px*px) / (rx*rx) + (py*py) / (ry*ry);
    if (pl > 1) {
      pl = Math.sqrt(pl);
      rx *= pl;
      ry *= pl;
    }

    var a00 = cos_th / rx;
    var a01 = sin_th / rx;
    var a10 = (-sin_th) / ry;
    var a11 = (cos_th) / ry;
    var x0 = a00 * ox + a01 * oy;
    var y0 = a10 * ox + a11 * oy;
    var x1 = a00 * x + a01 * y;
    var y1 = a10 * x + a11 * y;

    var d = (x1-x0) * (x1-x0) + (y1-y0) * (y1-y0);
    var sfactor_sq = 1 / d - 0.25;
    if (sfactor_sq < 0) sfactor_sq = 0;
    var sfactor = Math.sqrt(sfactor_sq);
    if (sweep === large) sfactor = -sfactor;
    var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
    var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);

    var th0 = Math.atan2(y0-yc, x0-xc);
    var th1 = Math.atan2(y1-yc, x1-xc);

    var th_arc = th1-th0;
    if (th_arc < 0 && sweep === 1){
      th_arc += 2*Math.PI;
    } else if (th_arc > 0 && sweep === 0) {
      th_arc -= 2 * Math.PI;
    }

    var segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
    var result = [];
    for (var i=0; i<segments; i++) {
      var th2 = th0 + i * th_arc / segments;
      var th3 = th0 + (i+1) * th_arc / segments;
      result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
    }

    arcToSegmentsCache[argsString] = result;
    return result;
  }

  function segmentToBezier(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
    argsString = _join.call(arguments);
    if (segmentToBezierCache[argsString]) {
      return segmentToBezierCache[argsString];
    }

    var a00 = cos_th * rx;
    var a01 = -sin_th * ry;
    var a10 = sin_th * rx;
    var a11 = cos_th * ry;

    var th_half = 0.5 * (th1 - th0);
    var t = (8/3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5) / Math.sin(th_half);
    var x1 = cx + Math.cos(th0) - t * Math.sin(th0);
    var y1 = cy + Math.sin(th0) + t * Math.cos(th0);
    var x3 = cx + Math.cos(th1);
    var y3 = cy + Math.sin(th1);
    var x2 = x3 + t * Math.sin(th1);
    var y2 = y3 - t * Math.cos(th1);

    segmentToBezierCache[argsString] = [
      a00 * x1 + a01 * y1,      a10 * x1 + a11 * y1,
      a00 * x2 + a01 * y2,      a10 * x2 + a11 * y2,
      a00 * x3 + a01 * y3,      a10 * x3 + a11 * y3
    ];

    return segmentToBezierCache[argsString];
  }

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      extend = fabric.util.object.extend,
      _toString = Object.prototype.toString;

  if (fabric.Path) {
    fabric.warn('fabric.Path is already defined');
    return;
  }

  /**
   * @private
   */
  function getX(item) {
    if (item[0] === 'H') {
      return item[1];
    }
    return item[item.length - 2];
  }

  /**
   * @private
   */
  function getY(item) {
    if (item[0] === 'V') {
      return item[1];
    }
    return item[item.length - 1];
  }

  /**
   * Path class
   * @class fabric.Path
   * @extends fabric.Object
   */
  fabric.Path = fabric.util.createClass(fabric.Object, /** @lends fabric.Path.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'path',

    /**
     * Constructor
     * @param {Array|String} path Path data (sequence of coordinates and corresponding "command" tokens)
     * @param {Object} [options] Options object
     * @return {fabric.Path} thisArg
     */
    initialize: function(path, options) {
      options = options || { };

      this.setOptions(options);

      if (!path) {
        throw new Error('`path` argument is required');
      }

      var fromArray = _toString.call(path) === '[object Array]';

      this.path = fromArray
        ? path
        // one of commands (m,M,l,L,q,Q,c,C,etc.) followed by non-command characters (i.e. command values)
        : path.match && path.match(/[mzlhvcsqta][^mzlhvcsqta]*/gi);

      if (!this.path) return;

      if (!fromArray) {
        this.path = this._parsePath();
      }
      this._initializePath(options);

      if (options.sourcePath) {
        this.setSourcePath(options.sourcePath);
      }
    },

    /**
     * @private
     * @param {Object} [options] Options object
     */
    _initializePath: function (options) {
      var isWidthSet = 'width' in options,
          isHeightSet = 'height' in options,
          isLeftSet = 'left' in options,
          isTopSet = 'top' in options;

      if (!isWidthSet || !isHeightSet) {
        extend(this, this._parseDimensions());
        if (isWidthSet) {
          this.width = options.width;
        }
        if (isHeightSet) {
          this.height = options.height;
        }
      }
      else { //Set center location relative to given height/width if not specified
        if (!isTopSet) {
          this.top = this.height / 2;
        }
        if (!isLeftSet) {
          this.left = this.width / 2;
        }
      }
      this.pathOffset = this.pathOffset || this._calculatePathOffset(isTopSet || isLeftSet); //Save top-left coords as offset
    },

    /**
     * @private
     * @param {Boolean} positionSet When false, path offset is returned otherwise 0
     */
    _calculatePathOffset: function (positionSet) {
      return {
        x: positionSet ? 0 : this.left - (this.width / 2),
        y: positionSet ? 0 : this.top - (this.height / 2)
      };
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx context to render path on
     */
    _render: function(ctx) {
      var current, // current instruction
          previous = null,
          x = 0, // current x
          y = 0, // current y
          controlX = 0, // current control point x
          controlY = 0, // current control point y
          tempX,
          tempY,
          tempControlX,
          tempControlY,
          l = -((this.width / 2) + this.pathOffset.x),
          t = -((this.height / 2) + this.pathOffset.y);

      for (var i = 0, len = this.path.length; i < len; ++i) {

        current = this.path[i];

        switch (current[0]) { // first letter

          case 'l': // lineto, relative
            x += current[1];
            y += current[2];
            ctx.lineTo(x + l, y + t);
            break;

          case 'L': // lineto, absolute
            x = current[1];
            y = current[2];
            ctx.lineTo(x + l, y + t);
            break;

          case 'h': // horizontal lineto, relative
            x += current[1];
            ctx.lineTo(x + l, y + t);
            break;

          case 'H': // horizontal lineto, absolute
            x = current[1];
            ctx.lineTo(x + l, y + t);
            break;

          case 'v': // vertical lineto, relative
            y += current[1];
            ctx.lineTo(x + l, y + t);
            break;

          case 'V': // verical lineto, absolute
            y = current[1];
            ctx.lineTo(x + l, y + t);
            break;

          case 'm': // moveTo, relative
            x += current[1];
            y += current[2];
            // draw a line if previous command was moveTo as well (otherwise, it will have no effect)
            ctx[(previous && (previous[0] === 'm' || previous[0] === 'M')) ? 'lineTo' : 'moveTo'](x + l, y + t);
            break;

          case 'M': // moveTo, absolute
            x = current[1];
            y = current[2];
            // draw a line if previous command was moveTo as well (otherwise, it will have no effect)
            ctx[(previous && (previous[0] === 'm' || previous[0] === 'M')) ? 'lineTo' : 'moveTo'](x + l, y + t);
            break;

          case 'c': // bezierCurveTo, relative
            tempX = x + current[5];
            tempY = y + current[6];
            controlX = x + current[3];
            controlY = y + current[4];
            ctx.bezierCurveTo(
              x + current[1] + l, // x1
              y + current[2] + t, // y1
              controlX + l, // x2
              controlY + t, // y2
              tempX + l,
              tempY + t
            );
            x = tempX;
            y = tempY;
            break;

          case 'C': // bezierCurveTo, absolute
            x = current[5];
            y = current[6];
            controlX = current[3];
            controlY = current[4];
            ctx.bezierCurveTo(
              current[1] + l,
              current[2] + t,
              controlX + l,
              controlY + t,
              x + l,
              y + t
            );
            break;

          case 's': // shorthand cubic bezierCurveTo, relative

            // transform to absolute x,y
            tempX = x + current[3];
            tempY = y + current[4];

            // calculate reflection of previous control points
            controlX = controlX ? (2 * x - controlX) : x;
            controlY = controlY ? (2 * y - controlY) : y;

            ctx.bezierCurveTo(
              controlX + l,
              controlY + t,
              x + current[1] + l,
              y + current[2] + t,
              tempX + l,
              tempY + t
            );
            // set control point to 2nd one of this command
            // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
            controlX = x + current[1];
            controlY = y + current[2];

            x = tempX;
            y = tempY;
            break;

          case 'S': // shorthand cubic bezierCurveTo, absolute
            tempX = current[3];
            tempY = current[4];
            // calculate reflection of previous control points
            controlX = 2*x - controlX;
            controlY = 2*y - controlY;
            ctx.bezierCurveTo(
              controlX + l,
              controlY + t,
              current[1] + l,
              current[2] + t,
              tempX + l,
              tempY + t
            );
            x = tempX;
            y = tempY;

            // set control point to 2nd one of this command
            // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
            controlX = current[1];
            controlY = current[2];

            break;

          case 'q': // quadraticCurveTo, relative
            // transform to absolute x,y
            tempX = x + current[3];
            tempY = y + current[4];

            controlX = x + current[1];
            controlY = y + current[2];

            ctx.quadraticCurveTo(
              controlX + l,
              controlY + t,
              tempX + l,
              tempY + t
            );
            x = tempX;
            y = tempY;
            break;

          case 'Q': // quadraticCurveTo, absolute
            tempX = current[3];
            tempY = current[4];

            ctx.quadraticCurveTo(
              current[1] + l,
              current[2] + t,
              tempX + l,
              tempY + t
            );
            x = tempX;
            y = tempY;
            controlX = current[1];
            controlY = current[2];
            break;

          case 't': // shorthand quadraticCurveTo, relative

            // transform to absolute x,y
            tempX = x + current[1];
            tempY = y + current[2];


            if (previous[0].match(/[QqTt]/) === null) {
              // If there is no previous command or if the previous command was not a Q, q, T or t,
              // assume the control point is coincident with the current point
              controlX = x;
              controlY = y;
            }
            else if (previous[0] === 't') {
              // calculate reflection of previous control points for t
              controlX = 2 * x - tempControlX;
              controlY = 2 * y - tempControlY;
            }
            else if (previous[0] === 'q') {
              // calculate reflection of previous control points for q
              controlX = 2 * x - controlX;
              controlY = 2 * y - controlY;
            }

            tempControlX = controlX;
            tempControlY = controlY;

            ctx.quadraticCurveTo(
              controlX + l,
              controlY + t,
              tempX + l,
              tempY + t
            );
            x = tempX;
            y = tempY;
            controlX = x + current[1];
            controlY = y + current[2];
            break;

          case 'T':
            tempX = current[1];
            tempY = current[2];

            // calculate reflection of previous control points
            controlX = 2 * x - controlX;
            controlY = 2 * y - controlY;
            ctx.quadraticCurveTo(
              controlX + l,
              controlY + t,
              tempX + l,
              tempY + t
            );
            x = tempX;
            y = tempY;
            break;

          case 'a':
            // TODO: optimize this
            drawArc(ctx, x + l, y + t, [
              current[1],
              current[2],
              current[3],
              current[4],
              current[5],
              current[6] + x + l,
              current[7] + y + t
            ]);
            x += current[6];
            y += current[7];
            break;

          case 'A':
            // TODO: optimize this
            drawArc(ctx, x + l, y + t, [
              current[1],
              current[2],
              current[3],
              current[4],
              current[5],
              current[6] + l,
              current[7] + t
            ]);
            x = current[6];
            y = current[7];
            break;

          case 'z':
          case 'Z':
            ctx.closePath();
            break;
        }
        previous = current;
      }
    },

    /**
     * Renders path on a specified context
     * @param {CanvasRenderingContext2D} ctx context to render path on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, noTransform) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();
      var m = this.transformMatrix;
      if (m) {
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      if (!noTransform) {
        this.transform(ctx);
      }
      // ctx.globalCompositeOperation = this.fillRule;

      if (this.overlayFill) {
        ctx.fillStyle = this.overlayFill;
      }
      else if (this.fill) {
        ctx.fillStyle = this.fill.toLive
          ? this.fill.toLive(ctx)
          : this.fill;
      }

      if (this.stroke) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeLineCap;
        ctx.lineJoin = this.strokeLineJoin;
        ctx.miterLimit = this.strokeMiterLimit;
        ctx.strokeStyle = this.stroke.toLive
          ? this.stroke.toLive(ctx)
          : this.stroke;
      }

      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      ctx.beginPath();

      this._render(ctx);
      this._renderFill(ctx);
      this._renderStroke(ctx);
      this.clipTo && ctx.restore();
      this._removeShadow(ctx);

      if (!noTransform && this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },

    /**
     * Returns string representation of an instance
     * @return {String} string representation of an instance
     */
    toString: function() {
      return '#<fabric.Path (' + this.complexity() +
        '): { "top": ' + this.top + ', "left": ' + this.left + ' }>';
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      var o = extend(this.callSuper('toObject', propertiesToInclude), {
        path: this.path
      });
      if (this.sourcePath) {
        o.sourcePath = this.sourcePath;
      }
      if (this.transformMatrix) {
        o.transformMatrix = this.transformMatrix;
      }
      return o;
    },

    /**
     * Returns dataless object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toDatalessObject: function(propertiesToInclude) {
      var o = this.toObject(propertiesToInclude);
      if (this.sourcePath) {
        o.path = this.sourcePath;
      }
      delete o.sourcePath;
      return o;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var chunks = [],
          markup = [];

      for (var i = 0, len = this.path.length; i < len; i++) {
        chunks.push(this.path[i].join(' '));
      }
      var path = chunks.join(' ');

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, true));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, true));
      }

      markup.push(
        '<g transform="', (this.group ? '' : this.getSvgTransform()), '">',
          '<path ',
            'd="', path,
            '" style="', this.getSvgStyles(),
            '" transform="translate(', (-this.width / 2), ' ', (-this.height/2), ')',
            '" stroke-linecap="round" ',
          '/>',
        '</g>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns number representation of an instance complexity
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return this.path.length;
    },

    /**
     * @private
     */
    _parsePath: function() {
      var result = [ ],
          coords = [ ],
          currentPath,
          parsed,
          re = /(-?\.\d+)|(-?\d+(\.\d+)?)/g,
          match,
          coordsStr;

      for (var i = 0, coordsParsed, len = this.path.length; i < len; i++) {
        currentPath = this.path[i];

        coordsStr = currentPath.slice(1).trim();
        coords.length = 0;

        while ((match = re.exec(coordsStr))) {
          coords.push(match[0]);
        }

        coordsParsed = [ currentPath.charAt(0) ];

        for (var j = 0, jlen = coords.length; j < jlen; j++) {
          parsed = parseFloat(coords[j]);
          if (!isNaN(parsed)) {
            coordsParsed.push(parsed);
          }
        }

        var command = coordsParsed[0].toLowerCase(),
            commandLength = commandLengths[command];

        if (coordsParsed.length - 1 > commandLength) {
          for (var k = 1, klen = coordsParsed.length; k < klen; k += commandLength) {
            result.push([ coordsParsed[0] ].concat(coordsParsed.slice(k, k + commandLength)));
          }
        }
        else {
          result.push(coordsParsed);
        }
      }

      return result;
    },

    /**
     * @private
     */
    _parseDimensions: function() {
      var aX = [],
          aY = [],
          previousX,
          previousY,
          isLowerCase = false,
          x,
          y;

      this.path.forEach(function(item, i) {
        if (item[0] !== 'H') {
          previousX = (i === 0) ? getX(item) : getX(this.path[i-1]);
        }
        if (item[0] !== 'V') {
          previousY = (i === 0) ? getY(item) : getY(this.path[i-1]);
        }

        // lowercased letter denotes relative position;
        // transform to absolute
        if (item[0] === item[0].toLowerCase()) {
          isLowerCase = true;
        }

        // last 2 items in an array of coordinates are the actualy x/y (except H/V);
        // collect them

        // TODO (kangax): support relative h/v commands

        x = isLowerCase
          ? previousX + getX(item)
          : item[0] === 'V'
            ? previousX
            : getX(item);

        y = isLowerCase
          ? previousY + getY(item)
          : item[0] === 'H'
            ? previousY
            : getY(item);

        var val = parseInt(x, 10);
        if (!isNaN(val)) aX.push(val);

        val = parseInt(y, 10);
        if (!isNaN(val)) aY.push(val);

      }, this);

      var minX = min(aX),
          minY = min(aY),
          maxX = max(aX),
          maxY = max(aY),
          deltaX = maxX - minX,
          deltaY = maxY - minY;

      var o = {
        top: minY + deltaY / 2,
        left: minX + deltaX / 2,
        bottom: max(aY) - deltaY,
        right: max(aX) - deltaX
      };

      o.width = deltaX;
      o.height = deltaY;

      return o;
    }
  });

  /**
   * Creates an instance of fabric.Path from an object
   * @static
   * @return {fabric.Path} Instance of fabric.Path
   */
  fabric.Path.fromObject = function(object) {
    return new fabric.Path(object.path, object);
  };

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by `fabric.Path.fromElement`)
   * @static
   * @see http://www.w3.org/TR/SVG/paths.html#PathElement
   */
  fabric.Path.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat(['d']);

  /**
   * Creates an instance of fabric.Path from an SVG <path> element
   * @static
   * @param {SVGElement} element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Path} Instance of fabric.Path
   */
  fabric.Path.fromElement = function(element, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Path.ATTRIBUTE_NAMES);
    return new fabric.Path(parsedAttributes.d, extend(parsedAttributes, options));
  };
  /* _FROM_SVG_END_ */

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      invoke = fabric.util.array.invoke,
      parentToObject = fabric.Object.prototype.toObject,
      camelize = fabric.util.string.camelize,
      capitalize = fabric.util.string.capitalize;

  if (fabric.PathGroup) {
    fabric.warn('fabric.PathGroup is already defined');
    return;
  }

  /**
   * Path group class
   * @class fabric.PathGroup
   * @extends fabric.Path
   */
  fabric.PathGroup = fabric.util.createClass(fabric.Path, /** @lends fabric.PathGroup.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'path-group',

    /**
     * Fill value
     * @type String
     * @default
     */
    fill: '',

    /**
     * Constructor
     * @param {Array} paths
     * @param {Object} [options] Options object
     * @return {fabric.PathGroup} thisArg
     */
    initialize: function(paths, options) {

      options = options || { };
      this.paths = paths || [ ];

      for (var i = this.paths.length; i--; ) {
        this.paths[i].group = this;
      }

      this.setOptions(options);
      this.setCoords();

      if (options.sourcePath) {
        this.setSourcePath(options.sourcePath);
      }
    },

    /**
     * Renders this group on a specified context
     * @param {CanvasRenderingContext2D} ctx Context to render this instance on
     */
    render: function(ctx) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();

      var m = this.transformMatrix;
      if (m) {
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }

      this.transform(ctx);

      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      for (var i = 0, l = this.paths.length; i < l; ++i) {
        this.paths[i].render(ctx, true);
      }
      this.clipTo && ctx.restore();
      this._removeShadow(ctx);

      if (this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },

    /**
     * Sets certain property to a certain value
     * @param {String} prop
     * @param {Any} value
     * @return {fabric.PathGroup} thisArg
     */
    _set: function(prop, value) {

      if ((prop === 'fill' || prop === 'overlayFill') && value && this.isSameColor()) {
        var i = this.paths.length;
        while (i--) {
          this.paths[i]._set(prop, value);
        }
      }

      return this.callSuper('_set', prop, value);
    },

    /**
     * Returns object representation of this path group
     * @param {Array} [propertiesToInclude]
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(parentToObject.call(this, propertiesToInclude), {
        paths: invoke(this.getObjects(), 'toObject', propertiesToInclude),
        sourcePath: this.sourcePath
      });
    },

    /**
     * Returns dataless object representation of this path group
     * @param {Array} [propertiesToInclude]
     * @return {Object} dataless object representation of an instance
     */
    toDatalessObject: function(propertiesToInclude) {
      var o = this.toObject(propertiesToInclude);
      if (this.sourcePath) {
        o.paths = this.sourcePath;
      }
      return o;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var objects = this.getObjects();
      var markup = [
        '<g ',
          'style="', this.getSvgStyles(), '" ',
          'transform="', this.getSvgTransform(), '" ',
        '>'
      ];

      for (var i = 0, len = objects.length; i < len; i++) {
        markup.push(objects[i].toSVG());
      }
      markup.push('</g>');

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns a string representation of this path group
     * @return {String} string representation of an object
     */
    toString: function() {
      return '#<fabric.PathGroup (' + this.complexity() +
        '): { top: ' + this.top + ', left: ' + this.left + ' }>';
    },

    /**
     * Returns true if all paths in this group are of same color
     * @return {Boolean} true if all paths are of the same color (`fill`)
     */
    isSameColor: function() {
      var firstPathFill = this.getObjects()[0].get('fill');
      return this.getObjects().every(function(path) {
        return path.get('fill') === firstPathFill;
      });
    },

    /**
     * Returns number representation of object's complexity
     * @return {Number} complexity
     */
    complexity: function() {
      return this.paths.reduce(function(total, path) {
        return total + ((path && path.complexity) ? path.complexity() : 0);
      }, 0);
    },

    /**
      * Makes path group grayscale
      * @return {fabric.PathGroup} thisArg
      */
    toGrayscale: function() {
      var i = this.paths.length;
      while (i--) {
        this.paths[i].toGrayscale();
      }
      return this;
    },

    /**
     * Returns all paths in this path group
     * @return {Array} array of path objects included in this path group
     */
    getObjects: function() {
      return this.paths;
    }
  });

  /**
   * @private
   */
  function instantiatePaths(paths) {
    for (var i = 0, len = paths.length; i < len; i++) {
      if (!(paths[i] instanceof fabric.Object)) {
        var klassName = camelize(capitalize(paths[i].type));
        paths[i] = fabric[klassName].fromObject(paths[i]);
      }
    }
    return paths;
  }

  /**
   * Creates fabric.PathGroup instance from an object representation
   * @static
   * @param {Object} object
   * @return {fabric.PathGroup}
   */
  fabric.PathGroup.fromObject = function(object) {
    var paths = instantiatePaths(object.paths);
    return new fabric.PathGroup(paths, object);
  };

})(typeof exports !== 'undefined' ? exports : this);
(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      invoke = fabric.util.array.invoke;

  if (fabric.Group) {
    return;
  }

  // lock-related properties, for use in fabric.Group#get
  // to enable locking behavior on group
  // when one of its objects has lock-related properties set
  var _lockProperties = {
    lockMovementX:  true,
    lockMovementY:  true,
    lockRotation:   true,
    lockScalingX:   true,
    lockScalingY:   true,
    lockUniScaling: true
  };

  /**
   * Group class
   * @class fabric.Group
   * @extends fabric.Object
   * @extends fabric.Collection
   */
  fabric.Group = fabric.util.createClass(fabric.Object, fabric.Collection, /** @lends fabric.Group.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'group',

    /**
     * Constructor
     * @param {Object} objects Group objects
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(objects, options) {
      options = options || { };

      this._objects = objects || [];
      for (var i = this._objects.length; i--; ) {
        this._objects[i].group = this;
      }

      this.originalState = { };
      this.callSuper('initialize');

      this._calcBounds();
      this._updateObjectsCoords();

      if (options) {
        extend(this, options);
      }
      this._setOpacityIfSame();

      this.setCoords(true);
      this.saveCoords();
    },

    /**
     * @private
     */
    _updateObjectsCoords: function() {
      var groupDeltaX = this.left,
          groupDeltaY = this.top;

      this.forEachObject(function(object) {

        var objectLeft = object.get('left'),
            objectTop = object.get('top');

        object.set('originalLeft', objectLeft);
        object.set('originalTop', objectTop);

        object.set('left', objectLeft - groupDeltaX);
        object.set('top', objectTop - groupDeltaY);

        object.setCoords();

        // do not display corners of objects enclosed in a group
        object.__origHasControls = object.hasControls;
        object.hasControls = false;
      }, this);
    },

    /**
     * Returns string represenation of a group
     * @return {String}
     */
    toString: function() {
      return '#<fabric.Group: (' + this.complexity() + ')>';
    },

    /**
     * Returns an array of all objects in this group
     * @return {Array} group objects
     */
    getObjects: function() {
      return this._objects;
    },

    /**
     * Adds an object to a group; Then recalculates group's dimension, position.
     * @param {Object} object
     * @return {fabric.Group} thisArg
     * @chainable
     */
    addWithUpdate: function(object) {
      this._restoreObjectsState();
      this._objects.push(object);
      object.group = this;
      // since _restoreObjectsState set objects inactive
      this.forEachObject(function(o){ o.set('active', true); o.group = this; }, this);
      this._calcBounds();
      this._updateObjectsCoords();
      return this;
    },

    /**
     * Removes an object from a group; Then recalculates group's dimension, position.
     * @param {Object} object
     * @return {fabric.Group} thisArg
     * @chainable
     */
    removeWithUpdate: function(object) {
      this._restoreObjectsState();
      // since _restoreObjectsState set objects inactive
      this.forEachObject(function(o){ o.set('active', true); o.group = this; }, this);

      this.remove(object);
      this._calcBounds();
      this._updateObjectsCoords();
      return this;
    },

    /**
     * @private
     */
    _onObjectAdded: function(object) {
      object.group = this;
    },

    /**
     * @private
     */
    _onObjectRemoved: function(object) {
      delete object.group;
      object.set('active', false);
    },

    /**
     * @param delegatedProperties
     * @type Object
     * Properties that are delegated to group objects when reading/writing
     */
    delegatedProperties: {
      fill:             true,
      opacity:          true,
      fontFamily:       true,
      fontWeight:       true,
      fontSize:         true,
      fontStyle:        true,
      lineHeight:       true,
      textDecoration:   true,
      textShadow:       true,
      textAlign:        true,
      backgroundColor:  true
    },

    /**
     * @private
     */
    _set: function(key, value) {
      if (key in this.delegatedProperties) {
        var i = this._objects.length;
        this[key] = value;
        while (i--) {
          this._objects[i].set(key, value);
        }
      }
      else {
        this[key] = value;
      }
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        objects: invoke(this._objects, 'toObject', propertiesToInclude)
      });
    },

    /**
     * Renders instance on a given context
     * @param {CanvasRenderingContext2D} ctx context to render instance on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, noTransform) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();
      this.transform(ctx);

      var groupScaleFactor = Math.max(this.scaleX, this.scaleY);

      this.clipTo && fabric.util.clipContext(this, ctx);

      //The array is now sorted in order of highest first, so start from end.
      for (var i = 0, len = this._objects.length; i < len; i++) {

        var object = this._objects[i],
            originalScaleFactor = object.borderScaleFactor,
            originalHasRotatingPoint = object.hasRotatingPoint;

        // do not render if object is not visible
        if (!object.visible) continue;

        object.borderScaleFactor = groupScaleFactor;
        object.hasRotatingPoint = false;

        object.render(ctx);

        object.borderScaleFactor = originalScaleFactor;
        object.hasRotatingPoint = originalHasRotatingPoint;
      }
      this.clipTo && ctx.restore();

      if (!noTransform && this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
      this.setCoords();
    },

    /**
     * Retores original state of each of group objects (original state is that which was before group was created).
     * @private
     * @return {fabric.Group} thisArg
     * @chainable
     */
    _restoreObjectsState: function() {
      this._objects.forEach(this._restoreObjectState, this);
      return this;
    },

    /**
     * Restores original state of a specified object in group
     * @private
     * @param {fabric.Object} object
     * @return {fabric.Group} thisArg
     */
    _restoreObjectState: function(object) {

      var groupLeft = this.get('left'),
          groupTop = this.get('top'),
          groupAngle = this.getAngle() * (Math.PI / 180),
          rotatedTop = Math.cos(groupAngle) * object.get('top') + Math.sin(groupAngle) * object.get('left'),
          rotatedLeft = -Math.sin(groupAngle) * object.get('top') + Math.cos(groupAngle) * object.get('left');

      object.setAngle(object.getAngle() + this.getAngle());

      object.set('left', groupLeft + rotatedLeft * this.get('scaleX'));
      object.set('top', groupTop + rotatedTop * this.get('scaleY'));

      object.set('scaleX', object.get('scaleX') * this.get('scaleX'));
      object.set('scaleY', object.get('scaleY') * this.get('scaleY'));

      object.setCoords();
      object.hasControls = object.__origHasControls;
      delete object.__origHasControls;
      object.set('active', false);
      object.setCoords();
      delete object.group;

      return this;
    },

    /**
     * Destroys a group (restoring state of its objects)
     * @return {fabric.Group} thisArg
     * @chainable
     */
    destroy: function() {
      return this._restoreObjectsState();
    },

    /**
     * Saves coordinates of this instance (to be used together with `hasMoved`)
     * @saveCoords
     * @return {fabric.Group} thisArg
     * @chainable
     */
    saveCoords: function() {
      this._originalLeft = this.get('left');
      this._originalTop = this.get('top');
      return this;
    },

    /**
     * Checks whether this group was moved (since `saveCoords` was called last)
     * @return {Boolean} true if an object was moved (since fabric.Group#saveCoords was called)
     */
    hasMoved: function() {
      return this._originalLeft !== this.get('left') ||
             this._originalTop !== this.get('top');
    },

    /**
     * Sets coordinates of all group objects
     * @return {fabric.Group} thisArg
     * @chainable
     */
    setObjectsCoords: function() {
      this.forEachObject(function(object) {
        object.setCoords();
      });
      return this;
    },

    /**
     * @private
     */
    _setOpacityIfSame: function() {
      var objects = this.getObjects(),
          firstValue = objects[0] ? objects[0].get('opacity') : 1;

      var isSameOpacity = objects.every(function(o) {
        return o.get('opacity') === firstValue;
      });

      if (isSameOpacity) {
        this.opacity = firstValue;
      }
    },

    /**
     * @private
     */
    _calcBounds: function() {
      var aX = [],
          aY = [],
          minX, minY, maxX, maxY, o, width, height,
          i = 0,
          len = this._objects.length;

      for (; i < len; ++i) {
        o = this._objects[i];
        o.setCoords();
        for (var prop in o.oCoords) {
          aX.push(o.oCoords[prop].x);
          aY.push(o.oCoords[prop].y);
        }
      }

      minX = min(aX);
      maxX = max(aX);
      minY = min(aY);
      maxY = max(aY);

      width = (maxX - minX) || 0;
      height = (maxY - minY) || 0;

      this.width = width;
      this.height = height;

      this.left = (minX + width / 2) || 0;
      this.top = (minY + height / 2) || 0;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var objectsMarkup = [ ];
      for (var i = this._objects.length; i--; ) {
        objectsMarkup.push(this._objects[i].toSVG());
      }

      return (
        '<g transform="' + this.getSvgTransform() + '">' +
          objectsMarkup.join('') +
        '</g>');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns requested property
     * @param {String} prop Property to get
     * @return {Any}
     */
    get: function(prop) {
      if (prop in _lockProperties) {
        if (this[prop]) {
          return this[prop];
        }
        else {
          for (var i = 0, len = this._objects.length; i < len; i++) {
            if (this._objects[i][prop]) {
              return true;
            }
          }
          return false;
        }
      }
      else {
        if (prop in this.delegatedProperties) {
          return this._objects[0] && this._objects[0].get(prop);
        }
        return this[prop];
      }
    }
  });

  /**
   * Returns {@link fabric.Group} instance from an object representation
   * @static
   * @param {Object} object Object to create a group from
   * @param {Object} [options] Options object
   * @return {fabric.Group} An instance of fabric.Group
   */
  fabric.Group.fromObject = function(object, callback) {
    fabric.util.enlivenObjects(object.objects, function(enlivenedObjects) {
      delete object.objects;
      callback && callback(new fabric.Group(enlivenedObjects, object));
    });
  };

  /**
   * Indicates that instances of this type are async
   * @static
   * @type Boolean
   */
  fabric.Group.async = true;

})(typeof exports !== 'undefined' ? exports : this);
(function(global) {

  "use strict";

  var extend = fabric.util.object.extend;

  if (!global.fabric) {
    global.fabric = { };
  }

  if (global.fabric.Image) {
    fabric.warn('fabric.Image is already defined.');
    return;
  }

  /**
   * Image class
   * @class fabric.Image
   * @extends fabric.Object
   */
  fabric.Image = fabric.util.createClass(fabric.Object, /** @lends fabric.Image.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'image',

    /**
     * Constructor
     * @param {HTMLImageElement | String} element Image element
     * @param {Object} [options] Options object
     * @return {fabric.Image} thisArg
     */
    initialize: function(element, options) {
      options || (options = { });

      this.callSuper('initialize', options);
      this._initElement(element);
      this._originalImage = this.getElement();
      this._initConfig(options);

      this.filters = [ ];

      if (options.filters) {
        this.filters = options.filters;
        this.applyFilters();
      }
    },

    /**
     * Returns image element which this instance if based on
     * @return {HTMLImageElement} Image element
     */
    getElement: function() {
      return this._element;
    },

    /**
     * Sets image element for this instance to a specified one
     * @param {HTMLImageElement} element
     * @return {fabric.Image} thisArg
     * @chainable
     */
    setElement: function(element) {
      this._element = element;
      this._initConfig();
      return this;
    },

    /**
     * Returns original size of an image
     * @return {Object} object with "width" and "height" properties
     */
    getOriginalSize: function() {
      var element = this.getElement();
      return {
        width: element.width,
        height: element.height
      };
    },

    /**
     * Renders image on a specified context
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, noTransform) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();
      var m = this.transformMatrix;
      var isInPathGroup = this.group && this.group.type !== 'group';

      // this._resetWidthHeight();
      if (isInPathGroup) {
        ctx.translate(-this.group.width/2 + this.width/2, -this.group.height/2 + this.height/2);
      }
      if (m) {
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      if (!noTransform) {
        this.transform(ctx);
      }

      ctx.save();
      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      this._render(ctx);
      if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
      }
      this._renderStroke(ctx);
      this.clipTo && ctx.restore();
      ctx.restore();

      if (this.active && !noTransform) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _stroke: function(ctx) {
      ctx.save();
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeLineCap;
      ctx.lineJoin = this.strokeLineJoin;
      ctx.miterLimit = this.strokeMiterLimit;
      ctx.strokeStyle = this.stroke.toLive
        ? this.stroke.toLive(ctx)
        : this.stroke;

      ctx.beginPath();
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.closePath();
      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderDashedStroke: function(ctx) {
     var x = -this.width/2,
         y = -this.height/2,
         w = this.width,
         h = this.height;

      ctx.save();
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = this.strokeLineCap;
      ctx.lineJoin = this.strokeLineJoin;
      ctx.miterLimit = this.strokeMiterLimit;
      ctx.strokeStyle = this.stroke.toLive
        ? this.stroke.toLive(ctx)
        : this.stroke;

      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, x+w, y, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x+w, y, x+w, y+h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x+w, y+h, x, y+h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x, y+h, x, y, this.strokeDashArray);
      ctx.closePath();
      ctx.restore();
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude
     * @return {Object} propertiesToInclude Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        src: this._originalImage.src || this._originalImage._src,
        filters: this.filters.concat()
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var markup = [];

      markup.push(
        '<g transform="', this.getSvgTransform(), '">',
          '<image xlink:href="', this.getSvgSrc(),
            '" style="', this.getSvgStyles(),
            // we're essentially moving origin of transformation from top/left corner to the center of the shape
            // by wrapping it in container <g> element with actual transformation, then offsetting object to the top/left
            // so that object's center aligns with container's left/top
            '" transform="translate(' + (-this.width/2) + ' ' + (-this.height/2) + ')',
            '" width="', this.width,
            '" height="', this.height,
          '"></image>'
      );

      if (this.stroke || this.strokeDashArray) {
        var origFill = this.fill;
        this.fill = null;
        markup.push(
          '<rect ',
            'x="', (-1 * this.width / 2), '" y="', (-1 * this.height / 2),
            '" width="', this.width, '" height="', this.height,
            '" style="', this.getSvgStyles(),
          '"/>'
        );
        this.fill = origFill;
      }

      markup.push('</g>');

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns source of an image
     * @return {String} Source of an image
     */
    getSrc: function() {
      return this.getElement().src || this.getElement()._src;
    },

    /**
     * Returns string representation of an instance
     * @return {String} String representation of an instance
     */
    toString: function() {
      return '#<fabric.Image: { src: "' + this.getSrc() + '" }>';
    },

    /**
     * Returns a clone of an instance
     * @param {Function} callback Callback is invoked with a clone as a first argument
     * @param {Array} propertiesToInclude
     */
    clone: function(callback, propertiesToInclude) {
      this.constructor.fromObject(this.toObject(propertiesToInclude), callback);
    },

    /**
     * Applies filters assigned to this image (from "filters" array)
     * @mthod applyFilters
     * @param {Function} callback Callback is invoked when all filters have been applied and new image is generated
     * @return {fabric.Image} thisArg
     * @chainable
     */
    applyFilters: function(callback) {

      if (this.filters.length === 0) {
        this.setElement(this._originalImage);
        callback && callback();
        return;
      }

      var imgEl = this._originalImage,
          canvasEl = fabric.util.createCanvasElement(),
          replacement = fabric.util.createImage(),
          _this = this;

      canvasEl.width = imgEl.width;
      canvasEl.height = imgEl.height;

      canvasEl.getContext('2d').drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);

      this.filters.forEach(function(filter) {
        filter && filter.applyTo(canvasEl);
      });

       /** @ignore */

      replacement.width = imgEl.width;
      replacement.height = imgEl.height;

      if (fabric.isLikelyNode) {
        // cut off data:image/png;base64, part in the beginning
        var base64str = canvasEl.toDataURL('image/png').substring(22);
        replacement.src = new Buffer(base64str, 'base64');

        // onload doesn't fire in some node versions, so we invoke callback manually
        _this._element = replacement;
        callback && callback();
      }
      else {
        replacement.onload = function() {
          _this._element = replacement;
          callback && callback();
          replacement.onload = canvasEl = imgEl = null;
        };
        replacement.src = canvasEl.toDataURL('image/png');
      }

      return this;
    },

    /**
     * @private
     * @param ctx
     */
    _render: function(ctx) {
      ctx.drawImage(
        this._element,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    },

    /**
     * @private
     */
    _resetWidthHeight: function() {
      var element = this.getElement();

      this.set('width', element.width);
      this.set('height', element.height);
    },

    /**
     * The Image class's initialization method. This method is automatically
     * called by the constructor.
     * @private
     * @param {HTMLImageElement|String} el The element representing the image
     */
    _initElement: function(element) {
      this.setElement(fabric.util.getById(element));
      fabric.util.addClass(this.getElement(), fabric.Image.CSS_CANVAS);
    },

    /**
     * @private
     * @param {Object} [options] Options object
     */
    _initConfig: function(options) {
      options || (options = { });
      this.setOptions(options);
      this._setWidthHeight(options);
    },

    /**
     * @private
     * @param {Object} object Object with filters property
     */
    _initFilters: function(object) {
      if (object.filters && object.filters.length) {
        this.filters = object.filters.map(function(filterObj) {
          return filterObj && fabric.Image.filters[filterObj.type].fromObject(filterObj);
        });
      }
    },

    /**
     * @private
     * @param {Object} [options] Object with width/height properties
     */
    _setWidthHeight: function(options) {
      this.width = 'width' in options
        ? options.width
        : (this.getElement().width || 0);

      this.height = 'height' in options
        ? options.height
        : (this.getElement().height || 0);
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 1;
    }
  });

  /**
   * Default CSS class name for canvas
   * @static
   * @type String
   */
  fabric.Image.CSS_CANVAS = "canvas-img";

  /**
   * Alias for getSrc
   * @static
   */
  fabric.Image.prototype.getSvgSrc = fabric.Image.prototype.getSrc;

  /**
   * Creates an instance of fabric.Image from its object representation
   * @static
   * @param {Object} object
   * @param {Function} [callback] Callback to invoke when an image instance is created
   */
  fabric.Image.fromObject = function(object, callback) {
    var img = fabric.document.createElement('img'),
        src = object.src;

    if (object.width) {
      img.width = object.width;
    }

    if (object.height) {
      img.height = object.height;
    }

    /** @ignore */
    img.onload = function() {
      fabric.Image.prototype._initFilters.call(object, object);

      var instance = new fabric.Image(img, object);
      callback && callback(instance);
      img = img.onload = img.onerror = null;
    };

    /** @ignore */
    img.onerror = function() {
      fabric.log('Error loading ' + img.src);
      callback && callback(null, true);
      img = img.onload = img.onerror = null;
    };

    img.src = src;
  };

  /**
   * Creates an instance of fabric.Image from an URL string
   * @static
   * @param {String} url URL to create an image from
   * @param {Function} [callback] Callback to invoke when image is created (newly created image is passed as a first argument)
   * @param {Object} [imgOptions] Options object
   */
  fabric.Image.fromURL = function(url, callback, imgOptions) {
    fabric.util.loadImage(url, function(img) {
      callback(new fabric.Image(img, imgOptions));
    });
  };

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Image.fromElement})
   * @static
   * @see http://www.w3.org/TR/SVG/struct.html#ImageElement
   */
  fabric.Image.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y width height xlink:href'.split(' '));

  /**
   * Returns {@link fabric.Image} instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Function} callback Callback to execute when fabric.Image object is created
   * @param {Object} [options] Options object
   * @return {fabric.Image} Instance of fabric.Image
   */
  fabric.Image.fromElement = function(element, callback, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES);

    fabric.Image.fromURL(parsedAttributes['xlink:href'], callback,
      extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes));
  };
  /* _FROM_SVG_END_ */

  /**
   * Indicates that instances of this type are async
   * @static
   * @type Boolean
   */
  fabric.Image.async = true;

})(typeof exports !== 'undefined' ? exports : this);
