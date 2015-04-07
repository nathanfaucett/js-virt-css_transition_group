(function(dependencies, global) {
    var cache = [];

    function require(index) {
        var module = cache[index],
            callback, exports;

        if (module !== undefined) {
            return module.exports;
        } else {
            callback = dependencies[index];
            exports = {};

            cache[index] = module = {
                exports: exports,
                require: require
            };

            callback.call(exports, require, exports, module, global);
            return module.exports;
        }
    }

    require.resolve = function(path) {
        return path;
    };

    if (typeof(define) === "function" && define.amd) {
        define([], function() {
            return require(0);
        });
    } else if (typeof(module) !== "undefined" && module.exports) {
        module.exports = require(0);
    } else {
        
        require(0);
        
    }
}([
function(require, exports, module, global) {

var environment = require(1),
    eventListener = require(2),
    virt = require(8),
    virtDOM = require(60),
    App = require(124);


eventListener.on(environment.window, "load", function() {
    virtDOM.render(virt.createView(App), document.getElementById("app"));
});


},
function(require, exports, module, global) {

var environment = exports,

    hasWindow = typeof(window) !== "undefined",
    userAgent = hasWindow ? window.navigator.userAgent : "";


environment.worker = typeof(importScripts) !== "undefined";

environment.browser = environment.worker || !!(
    hasWindow &&
    typeof(navigator) !== "undefined" &&
    window.document
);

environment.node = !environment.worker && !environment.browser;

environment.mobile = environment.browser && /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

environment.window = (
    hasWindow ? window :
    typeof(global) !== "undefined" ? global :
    typeof(self) !== "undefined" ? self : {}
);

environment.pixelRatio = environment.window.devicePixelRatio || 1;

environment.document = typeof(document) !== "undefined" ? document : {};


},
function(require, exports, module, global) {

var process = require(3);
var isObject = require(4),
    isFunction = require(5),
    environment = require(1),
    eventTable = require(6);


var eventListener = module.exports,

    reSpliter = /[\s]+/,

    window = environment.window,
    document = environment.document,

    listenToEvent, captureEvent, removeEvent, dispatchEvent;


window.Event = window.Event || function EmptyEvent() {};


eventListener.on = function(target, eventType, callback) {
    var eventTypes = eventType.split(reSpliter),
        i = eventTypes.length;

    while (i--) {
        listenToEvent(target, eventTypes[i], callback);
    }
};

eventListener.capture = function(target, eventType, callback) {
    var eventTypes = eventType.split(reSpliter),
        i = eventTypes.length;

    while (i--) {
        captureEvent(target, eventTypes[i], callback);
    }
};

eventListener.off = function(target, eventType, callback) {
    var eventTypes = eventType.split(reSpliter),
        i = eventTypes.length;

    while (i--) {
        removeEvent(target, eventTypes[i], callback);
    }
};

eventListener.emit = function(target, eventType, event) {

    return dispatchEvent(target, eventType, isObject(event) ? event : {});
};

eventListener.getEventConstructor = function(target, eventType) {
    var getter = eventTable[eventType];
    return isFunction(getter) ? getter(target) : window.Event;
};


if (isFunction(document.addEventListener)) {

    listenToEvent = function(target, eventType, callback) {

        target.addEventListener(eventType, callback, false);
    };

    captureEvent = function(target, eventType, callback) {

        target.addEventListener(eventType, callback, true);
    };

    removeEvent = function(target, eventType, callback) {

        target.removeEventListener(eventType, callback, false);
    };

    dispatchEvent = function(target, eventType, event) {
        var getter = eventTable[eventType],
            EventType = isFunction(getter) ? getter(target) : window.Event;

        return !!target.dispatchEvent(new EventType(eventType, event));
    };
} else if (isFunction(document.attachEvent)) {

    listenToEvent = function(target, eventType, callback) {

        target.attachEvent("on" + eventType, callback);
    };

    captureEvent = function() {
        if (process.env.NODE_ENV === "development") {
            throw new Error(
                "Attempted to listen to events during the capture phase on a " +
                "browser that does not support the capture phase. Your application " +
                "will not receive some events."
            );
        }
    };

    removeEvent = function(target, eventType, callback) {

        target.detachEvent("on" + eventType, callback);
    };

    dispatchEvent = function(target, eventType, event) {
        var doc = target.ownerDocument || document;

        return !!target.fireEvent("on" + eventType, doc.createEventObject(event));
    };
} else {

    listenToEvent = function(target, eventType, callback) {

        target["on" + eventType] = callback;
        return target;
    };

    captureEvent = function() {
        if (process.env.NODE_ENV === "development") {
            throw new Error(
                "Attempted to listen to events during the capture phase on a " +
                "browser that does not support the capture phase. Your application " +
                "will not receive some events."
            );
        }
    };

    removeEvent = function(target, eventType) {

        target["on" + eventType] = null;
        return true;
    };

    dispatchEvent = function(target, eventType, event) {
        var onType = "on" + eventType;

        if (isFunction(target[onType])) {
            event.type = eventType;
            return !!target[onType](event);
        }

        return false;
    };
}


},
function(require, exports, module, global) {

// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};


},
function(require, exports, module, global) {

module.exports = function isObject(obj) {
    var type = typeof(obj);
    return type === "function" || (obj && type === "object") || false;
};


},
function(require, exports, module, global) {

var objectFunction = "[object Function]",
    toString = Object.prototype.toString,
    isFunction;


if (typeof(/./) === "function" || (typeof(Uint8Array) !== "undefined" && typeof(Uint8Array) !== "function")) {
    isFunction = function isFunction(obj) {
        return toString.call(obj) === objectFunction;
    };
} else {
    isFunction = function isFunction(obj) {
        return typeof(obj) === "function" || false;
    };
}


module.exports = isFunction;


},
function(require, exports, module, global) {

var isNode = require(7),
    environment = require(1);


var window = environment.window,

    XMLHttpRequest = window.XMLHttpRequest,
    OfflineAudioContext = window.OfflineAudioContext;


function returnEvent() {
    return window.Event;
}


module.exports = {
    abort: function(target) {
        if (XMLHttpRequest && target instanceof XMLHttpRequest) {
            return window.ProgressEvent || window.Event;
        } else {
            return window.UIEvent || window.Event;
        }
    },

    afterprint: returnEvent,

    animationend: function() {
        return window.AnimationEvent || window.Event;
    },
    animationiteration: function() {
        return window.AnimationEvent || window.Event;
    },
    animationstart: function() {
        return window.AnimationEvent || window.Event;
    },

    audioprocess: function() {
        return window.AudioProcessingEvent || window.Event;
    },

    beforeprint: returnEvent,
    beforeunload: function() {
        return window.BeforeUnloadEvent || window.Event;
    },
    beginevent: function() {
        return window.TimeEvent || window.Event;
    },

    blocked: returnEvent,
    blur: function() {
        return window.FocusEvent || window.Event;
    },

    cached: returnEvent,
    canplay: returnEvent,
    canplaythrough: returnEvent,
    chargingchange: returnEvent,
    chargingtimechange: returnEvent,
    checking: returnEvent,

    click: function() {
        return window.MouseEvent || window.Event;
    },

    close: returnEvent,
    compassneedscalibration: function() {
        return window.SensorEvent || window.Event;
    },
    complete: function(target) {
        if (OfflineAudioContext && target instanceof OfflineAudioContext) {
            return window.OfflineAudioCompletionEvent || window.Event;
        } else {
            return window.Event;
        }
    },

    compositionend: function() {
        return window.CompositionEvent || window.Event;
    },
    compositionstart: function() {
        return window.CompositionEvent || window.Event;
    },
    compositionupdate: function() {
        return window.CompositionEvent || window.Event;
    },

    contextmenu: function() {
        return window.MouseEvent || window.Event;
    },
    copy: function() {
        return window.ClipboardEvent || window.Event;
    },
    cut: function() {
        return window.ClipboardEvent || window.Event;
    },

    dblclick: function() {
        return window.MouseEvent || window.Event;
    },
    devicelight: function() {
        return window.DeviceLightEvent || window.Event;
    },
    devicemotion: function() {
        return window.DeviceMotionEvent || window.Event;
    },
    deviceorientation: function() {
        return window.DeviceOrientationEvent || window.Event;
    },
    deviceproximity: function() {
        return window.DeviceProximityEvent || window.Event;
    },

    dischargingtimechange: returnEvent,

    DOMActivate: function() {
        return window.UIEvent || window.Event;
    },
    DOMAttributeNameChanged: function() {
        return window.MutationNameEvent || window.Event;
    },
    DOMAttrModified: function() {
        return window.MutationEvent || window.Event;
    },
    DOMCharacterDataModified: function() {
        return window.MutationEvent || window.Event;
    },
    DOMContentLoaded: returnEvent,
    DOMElementNameChanged: function() {
        return window.MutationNameEvent || window.Event;
    },
    DOMFocusIn: function() {
        return window.FocusEvent || window.Event;
    },
    DOMFocusOut: function() {
        return window.FocusEvent || window.Event;
    },
    DOMNodeInserted: function() {
        return window.MutationEvent || window.Event;
    },
    DOMNodeInsertedIntoDocument: function() {
        return window.MutationEvent || window.Event;
    },
    DOMNodeRemoved: function() {
        return window.MutationEvent || window.Event;
    },
    DOMNodeRemovedFromDocument: function() {
        return window.MutationEvent || window.Event;
    },
    DOMSubtreeModified: function() {
        return window.FocusEvent || window.Event;
    },
    downloading: returnEvent,

    drag: function() {
        return window.DragEvent || window.Event;
    },
    dragend: function() {
        return window.DragEvent || window.Event;
    },
    dragenter: function() {
        return window.DragEvent || window.Event;
    },
    dragleave: function() {
        return window.DragEvent || window.Event;
    },
    dragover: function() {
        return window.DragEvent || window.Event;
    },
    dragstart: function() {
        return window.DragEvent || window.Event;
    },
    drop: function() {
        return window.DragEvent || window.Event;
    },

    durationchange: returnEvent,
    ended: returnEvent,

    endEvent: function() {
        return window.TimeEvent || window.Event;
    },
    error: function(target) {
        if (XMLHttpRequest && target instanceof XMLHttpRequest) {
            return window.ProgressEvent || window.Event;
        } else if (isNode(target)) {
            return window.UIEvent || window.Event;
        } else {
            return window.Event;
        }
    },
    focus: function() {
        return window.FocusEvent || window.Event;
    },
    focusin: function() {
        return window.FocusEvent || window.Event;
    },
    focusout: function() {
        return window.FocusEvent || window.Event;
    },

    fullscreenchange: returnEvent,
    fullscreenerror: returnEvent,

    gamepadconnected: function() {
        return window.GamepadEvent || window.Event;
    },
    gamepaddisconnected: function() {
        return window.GamepadEvent || window.Event;
    },

    hashchange: function() {
        return window.HashChangeEvent || window.Event;
    },

    input: returnEvent,
    invalid: returnEvent,

    keydown: function() {
        return window.KeyboardEvent || window.Event;
    },
    keyup: function() {
        return window.KeyboardEvent || window.Event;
    },
    keypress: function() {
        return window.KeyboardEvent || window.Event;
    },

    languagechange: returnEvent,
    levelchange: returnEvent,

    load: function(target) {
        if (XMLHttpRequest && target instanceof XMLHttpRequest) {
            return window.ProgressEvent || window.Event;
        } else {
            return window.UIEvent || window.Event;
        }
    },

    loadeddata: returnEvent,
    loadedmetadata: returnEvent,

    loadend: function() {
        return window.ProgressEvent || window.Event;
    },
    loadstart: function() {
        return window.ProgressEvent || window.Event;
    },

    message: function() {
        return window.MessageEvent || window.Event;
    },

    mousedown: function() {
        return window.MouseEvent || window.Event;
    },
    mouseenter: function() {
        return window.MouseEvent || window.Event;
    },
    mouseleave: function() {
        return window.MouseEvent || window.Event;
    },
    mousemove: function() {
        return window.MouseEvent || window.Event;
    },
    mouseout: function() {
        return window.MouseEvent || window.Event;
    },
    mouseover: function() {
        return window.MouseEvent || window.Event;
    },
    mouseup: function() {
        return window.MouseEvent || window.Event;
    },

    noupdate: returnEvent,
    obsolete: returnEvent,
    offline: returnEvent,
    online: returnEvent,
    open: returnEvent,
    orientationchange: returnEvent,

    pagehide: function() {
        return window.PageTransitionEvent || window.Event;
    },
    pageshow: function() {
        return window.PageTransitionEvent || window.Event;
    },

    paste: function() {
        return window.ClipboardEvent || window.Event;
    },
    pause: returnEvent,
    pointerlockchange: returnEvent,
    pointerlockerror: returnEvent,
    play: returnEvent,
    playing: returnEvent,

    popstate: function() {
        return window.PopStateEvent || window.Event;
    },
    progress: function() {
        return window.ProgressEvent || window.Event;
    },

    ratechange: returnEvent,
    readystatechange: returnEvent,

    repeatevent: function() {
        return window.TimeEvent || window.Event;
    },

    reset: returnEvent,

    resize: function() {
        return window.UIEvent || window.Event;
    },
    scroll: function() {
        return window.UIEvent || window.Event;
    },

    seeked: returnEvent,
    seeking: returnEvent,

    select: function() {
        return window.UIEvent || window.Event;
    },
    show: function() {
        return window.MouseEvent || window.Event;
    },
    stalled: returnEvent,
    storage: function() {
        return window.StorageEvent || window.Event;
    },
    submit: returnEvent,
    success: returnEvent,
    suspend: returnEvent,

    SVGAbort: function() {
        return window.SVGEvent || window.Event;
    },
    SVGError: function() {
        return window.SVGEvent || window.Event;
    },
    SVGLoad: function() {
        return window.SVGEvent || window.Event;
    },
    SVGResize: function() {
        return window.SVGEvent || window.Event;
    },
    SVGScroll: function() {
        return window.SVGEvent || window.Event;
    },
    SVGUnload: function() {
        return window.SVGEvent || window.Event;
    },
    SVGZoom: function() {
        return window.SVGEvent || window.Event;
    },
    timeout: function() {
        return window.ProgressEvent || window.Event;
    },

    timeupdate: returnEvent,

    touchcancel: function() {
        return window.TouchEvent || window.Event;
    },
    touchend: function() {
        return window.TouchEvent || window.Event;
    },
    touchenter: function() {
        return window.TouchEvent || window.Event;
    },
    touchleave: function() {
        return window.TouchEvent || window.Event;
    },
    touchmove: function() {
        return window.TouchEvent || window.Event;
    },
    touchstart: function() {
        return window.TouchEvent || window.Event;
    },

    transitionend: function() {
        return window.TransitionEvent || window.Event;
    },
    unload: function() {
        return window.UIEvent || window.Event;
    },

    updateready: returnEvent,
    upgradeneeded: returnEvent,

    userproximity: function() {
        return window.SensorEvent || window.Event;
    },

    visibilitychange: returnEvent,
    volumechange: returnEvent,
    waiting: returnEvent,

    wheel: function() {
        return window.WheelEvent || window.Event;
    }
};


},
function(require, exports, module, global) {

var isFunction = require(5);


var isNode;


if (typeof(Node) !== "undefined" && isFunction(Node)) {
    isNode = function isNode(obj) {
        return obj instanceof Node;
    };
} else {
    isNode = function isNode(obj) {
        return (
            typeof(obj) === "object" &&
            typeof(obj.nodeType) === "number" &&
            typeof(obj.nodeName) === "string"
        );
    };
}


module.exports = isNode;


},
function(require, exports, module, global) {

var View = require(9);


var virt = exports;


virt.Root = require(26);

virt.Component = require(49);

virt.View = View;
virt.createView = View.create;
virt.createFactory = View.createFactory;

virt.registerNativeComponent = require(59);
virt.context = require(25);
virt.owner = require(24);


},
function(require, exports, module, global) {

var isPrimitive = require(10),
    isFunction = require(5),
    isArray = require(12),
    isString = require(15),
    isObjectLike = require(14),
    isNullOrUndefined = require(11),
    isNumber = require(16),
    fastSlice = require(17),
    has = require(18),
    map = require(19),
    owner = require(24),
    context = require(25);


var ViewPrototype;


module.exports = View;


function View(type, key, ref, props, children, owner, context) {
    this.__owner = owner;
    this.__context = context;
    this.type = type;
    this.key = key;
    this.ref = ref;
    this.props = props;
    this.children = children;
}

ViewPrototype = View.prototype;

ViewPrototype.__View__ = true;

ViewPrototype.copy = function(view) {
    this.__owner = view.__owner;
    this.__context = view.__context;
    this.type = view.type;
    this.key = view.key;
    this.ref = view.ref;
    this.props = view.props;
    this.children = view.children;
    return this;
};

ViewPrototype.clone = function() {
    return new View(this.type, this.key, this.ref, this.props, this.children, this.__owner, this.__context);
};

ViewPrototype.toJSON = function() {
    return toJSON(this);
};

View.isView = isView;
View.isPrimativeView = isPrimativeView;
View.isViewComponent = isViewComponent;
View.isViewJSON = isViewJSON;

View.create = function(type, config, children) {
    var isConfigArray = isArray(config),
        argumentsLength = arguments.length;

    if (isChild(config) || isConfigArray) {
        if (isConfigArray) {
            children = config;
        } else if (argumentsLength > 1) {
            children = fastSlice(arguments, 1);
        }
        config = null;
    } else {
        if (!isArray(children) && argumentsLength > 2) {
            children = fastSlice(arguments, 2);
        }
    }

    return construct(type, config, children);
};

View.createFactory = function(type) {
    return function factory(config, children) {
        var isConfigArray = isArray(config),
            argumentsLength = arguments.length;

        if (isChild(config) || isConfigArray) {
            if (isConfigArray) {
                children = config;
            } else if (argumentsLength > 0) {
                children = fastSlice(arguments);
            }
            config = null;
        } else {
            if (!isArray(children) && argumentsLength > 1) {
                children = fastSlice(arguments, 1);
            }
        }

        return construct(type, config, children);
    };
};

function construct(type, config, children) {
    var props = {},
        key = null,
        ref = null,
        propName, defaultProps;

    if (config) {
        key = config.key != null ? config.key : null;
        ref = config.ref != null ? config.ref : null;

        for (propName in config) {
            if (has(config, propName)) {
                if (!(propName === "key" || propName === "ref")) {
                    props[propName] = config[propName];
                }
            }
        }
    }

    if (type && type.defaultProps) {
        defaultProps = type.defaultProps;

        for (propName in defaultProps) {
            if (isNullOrUndefined(props[propName])) {
                props[propName] = defaultProps[propName];
            }
        }
    }

    return new View(type, key, ref, props, insureValidChildren(children), owner.current, context.current);
}

function propsToJSON(props) {
    var out = {},
        key, value;

    for (key in props) {
        if (!isFunction((value = props[key]))) {
            out[key] = value;
        }
    }

    return out;
}

function toJSON(view) {
    if (isPrimitive(view)) {
        return view;
    } else {
        return {
            type: view.type,
            key: view.key,
            ref: view.ref,
            props: propsToJSON(view.props),
            children: map(view.children, toJSON)
        };
    }
}

function isView(obj) {
    return isObjectLike(obj) && obj.__View__ === true;
}

function isViewComponent(obj) {
    return isView(obj) && isFunction(obj.type);
}

function isViewJSON(obj) {
    return (
        isObjectLike(obj) &&
        isString(obj.type) &&
        isObjectLike(obj.props) &&
        isArray(obj.children)
    );
}

function isPrimativeView(object) {
    return isString(object) || isNumber(object);
}

function isChild(object) {
    return isView(object) || isPrimativeView(object);
}

function insureValidChildren(children) {
    var i, il, child;

    if (isArray(children)) {
        i = -1;
        il = children.length - 1;

        while (i++ < il) {
            child = children[i];

            if (isView(child)) {
                continue;
            } else if (isPrimativeView(child)) {
                children[i] = child;
            } else {
                throw new TypeError("child of a View must be a String, Number or a View");
            }
        }
    } else {
        children = [];
    }

    return children;
}


},
function(require, exports, module, global) {

var isNullOrUndefined = require(11);


module.exports = function isPrimitive(obj) {
    var typeStr;
    return isNullOrUndefined(obj) || ((typeStr = typeof(obj)) !== "object" && typeStr !== "function") || false;
};


},
function(require, exports, module, global) {

module.exports = function isNullOrUndefined(obj) {
    return obj === null || obj === void 0;
};


},
function(require, exports, module, global) {

var isLength = require(13),
    isObjectLike = require(14);


var objectArray = "[object Array]",
    toString = Object.prototype.toString;


module.exports = Array.isArray || function isArray(obj) {
    return isObjectLike(obj) && isLength(obj.length) && toString.call(obj) === objectArray;
};


},
function(require, exports, module, global) {

var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;


module.exports = function isLength(obj) {
    return typeof(obj) === "number" && obj > -1 && obj % 1 === 0 && obj <= MAX_SAFE_INTEGER;
};


},
function(require, exports, module, global) {

module.exports = function isObjectLike(obj) {
    return (obj && typeof(obj) === "object") || false;
};


},
function(require, exports, module, global) {

module.exports = function isString(obj) {
    return typeof(obj) === "string" || false;
};


},
function(require, exports, module, global) {

module.exports = function isNumber(obj) {
    return typeof(obj) === "number" || false;
};


},
function(require, exports, module, global) {

module.exports = function fastSlice(array, offset) {
    var length, i, il, result, j;

    offset = offset || 0;

    length = array.length;
    i = offset - 1;
    il = length - 1;
    result = new Array(length - offset);
    j = 0;

    while (i++ < il) {
        result[j++] = array[i];
    }

    return result;
};


},
function(require, exports, module, global) {

var hasOwnProp = Object.prototype.hasOwnProperty;


module.exports = function has(obj, key) {
    return hasOwnProp.call(obj, key);
};


},
function(require, exports, module, global) {

var keys = require(20),
    isNullOrUndefined = require(11),
    fastBindThis = require(22),
    isArrayLike = require(23);


function mapArray(array, callback) {
    var length = array.length,
        i = -1,
        il = length - 1,
        result = new Array(length);

    while (i++ < il) {
        result[i] = callback(array[i], i);
    }

    return result;
}

function mapObject(object, callback) {
    var objectKeys = keys(object),
        i = -1,
        il = objectKeys.length - 1,
        result = {},
        key;

    while (i++ < il) {
        key = objectKeys[i];
        result[key] = callback(object[key], key);
    }

    return result;
}

module.exports = function map(object, callback, thisArg) {
    callback = isNullOrUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 2);
    return isArrayLike(object) ? mapArray(object, callback) : mapObject(object, callback);
};


},
function(require, exports, module, global) {

var has = require(18),
    isNative = require(21),
    isObject = require(4);


var nativeKeys = Object.keys;


if (!isNative(nativeKeys)) {
    nativeKeys = function keys(obj) {
        var localHas = has,
            out = [],
            i = 0,
            key;

        for (key in obj) {
            if (localHas(obj, key)) {
                out[i++] = key;
            }
        }

        return out;
    };
}

module.exports = function keys(obj) {
    return nativeKeys(isObject(obj) ? obj : Object(obj));
};


},
function(require, exports, module, global) {

var isFunction = require(5);


var reHostCtor = /^\[object .+?Constructor\]$/,

    functionToString = Function.prototype.toString,

    reNative = RegExp("^" +
        functionToString.call(toString)
        .replace(/[.*+?^${}()|[\]\/\\]/g, "\\$&")
        .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ),

    isHostObject = (function() {
        try {
            String({
                "toString": 0
            } + "");
        } catch (e) {
            return function isHostObject() {
                return false;
            };
        }

        return function isHostObject(value) {
            return !isFunction(value.toString) && typeof(value + "") === "string";
        };
    }());


module.exports = function isNative(obj) {
    return obj && (
        isFunction(obj) ?
        reNative.test(functionToString.call(obj)) : (
            typeof(obj) === "object" && (
                (isHostObject(obj) ? reNative : reHostCtor).test(obj) || false
            )
        )
    ) || false;
};


},
function(require, exports, module, global) {

module.exports = function fastBindThis(callback, thisArg, length) {
    switch (length || callback.length) {
        case 0:
            return function bound() {
                return callback.call(thisArg);
            };
        case 1:
            return function bound(a1) {
                return callback.call(thisArg, a1);
            };
        case 2:
            return function bound(a1, a2) {
                return callback.call(thisArg, a1, a2);
            };
        case 3:
            return function bound(a1, a2, a3) {
                return callback.call(thisArg, a1, a2, a3);
            };
        case 4:
            return function bound(a1, a2, a3, a4) {
                return callback.call(thisArg, a1, a2, a3, a4);
            };
        default:
            return function bound() {
                return callback.apply(thisArg, arguments);
            };
    }
};


},
function(require, exports, module, global) {

var isLength = require(13),
    isObjectLike = require(14);


module.exports = function isArrayLike(obj) {
    return isObjectLike(obj) && isLength(obj.length);
};


},
function(require, exports, module, global) {

var owner = exports;


owner.current = null;


},
function(require, exports, module, global) {

var context = exports;


context.current = null;


},
function(require, exports, module, global) {

var Transaction = require(27),
    shouldUpdate = require(40),
    EventManager = require(41),
    Node = require(42);


var RootPrototype,
    ROOT_ID = 0;


module.exports = Root;


function Root() {

    this.id = "." + (ROOT_ID++).toString(36);
    this.childHash = {};

    this.eventManager = new EventManager();

    this.adaptor = null;

    this.__transactions = [];
    this.__currentTransaction = null;
}

RootPrototype = Root.prototype;

RootPrototype.appendNode = function(node) {
    var id = node.id,
        childHash = this.childHash;

    if (childHash[id] === undefined) {
        node.root = this;
        childHash[id] = node;
    } else {
        throw new Error("Root appendNode(node) trying to override node at " + id);
    }
};

RootPrototype.removeNode = function(node) {
    var id = node.id,
        childHash = this.childHash;

    if (childHash[id] !== undefined) {
        node.root = null;
        delete childHash[id];
    } else {
        throw new Error("Root removeNode(node) trying to remove node that does not exists with id " + id);
    }
};

RootPrototype.__processTransaction = function() {
    var _this = this,
        transactions = this.__transactions,
        transaction;

    if (this.__currentTransaction === null && transactions.length !== 0) {
        this.__currentTransaction = transaction = transactions[0];

        this.adaptor.handle(transaction, function onHandle() {
            transactions.splice(0, 1);

            transaction.queue.notifyAll();
            transaction.destroy();

            _this.__currentTransaction = null;

            if (transactions.length !== 0) {
                _this.__processTransaction();
            }
        });
    }
};

RootPrototype.__enqueueTransaction = function(transaction) {
    var transactions = this.__transactions;
    transactions[transactions.length] = transaction;
};

RootPrototype.unmount = function() {
    var node = this.childHash[this.id],
        transaction;

    if (node) {
        transaction = Transaction.create();

        node.unmount(transaction);

        this.__enqueueTransaction(transaction);
        this.__processTransaction();
    }
};

RootPrototype.update = function(node) {
    var transaction = Transaction.create();

    node.update(node.currentView, transaction);

    this.__enqueueTransaction(transaction);
    this.__processTransaction();
};

RootPrototype.render = function(nextView, id) {
    var transaction = Transaction.create(),
        node;

    id = id || this.id;
    node = this.childHash[id];

    if (node) {
        if (shouldUpdate(node.currentView, nextView)) {

            node.update(nextView, transaction);
            this.__enqueueTransaction(transaction);
            this.__processTransaction();

            return;
        } else {
            node.unmount(transaction);
        }
    }

    node = new Node(id, id, nextView);
    this.appendNode(node);
    node.mount(transaction);

    this.__enqueueTransaction(transaction);
    this.__processTransaction();
};


},
function(require, exports, module, global) {

var createPool = require(28),
    Queue = require(30),
    consts = require(31),
    InsertPatch = require(33),
    MountPatch = require(34),
    OrderPatch = require(35),
    PropsPatch = require(36),
    RemovePatch = require(37),
    ReplacePatch = require(38),
    TextPatch = require(39);


module.exports = Transaction;


function Transaction() {

    this.queue = Queue.getPooled();

    this.removes = {};
    this.patches = {};

    this.events = {};
    this.eventsRemove = {};
}
createPool(Transaction);
Transaction.consts = consts;

Transaction.create = function() {
    return Transaction.getPooled();
};

Transaction.prototype.destroy = function() {
    Transaction.release(this);
};

function clearPatches(hash) {
    var id, array, j, jl;

    for (id in hash) {
        if ((array = hash[id]) !== undefined) {
            j = -1;
            jl = array.length - 1;

            while (j++ < jl) {
                array[j].destroy();
            }

            delete hash[id];
        }
    }
}

function clearHash(hash) {
    for (var id in hash) {
        if (hash[id] !== undefined) {
            delete hash[id];
        }
    }
}

Transaction.prototype.destructor = function() {
    clearPatches(this.patches);
    clearPatches(this.removes);
    clearHash(this.events);
    clearHash(this.eventsRemove);
    return this;
};

Transaction.prototype.mount = function(id, next) {
    this.append(MountPatch.create(id, next));
};

Transaction.prototype.insert = function(id, childId, index, next) {
    this.append(InsertPatch.create(id, childId, index, next));
};

Transaction.prototype.order = function(id, order) {
    this.append(OrderPatch.create(id, order));
};

Transaction.prototype.props = function(id, previous, props) {
    this.append(PropsPatch.create(id, previous, props));
};

Transaction.prototype.replace = function(id, childId, index, next) {
    this.append(ReplacePatch.create(id, childId, index, next));
};

Transaction.prototype.text = function(id, index, next) {
    this.append(TextPatch.create(id, index, next));
};

Transaction.prototype.remove = function(id, childId, index) {
    this.appendRemove(RemovePatch.create(id, childId, index));
};

Transaction.prototype.event = function(id, type) {
    this.events[id] = type;
};

Transaction.prototype.removeEvent = function(id, type) {
    this.eventsRemove[id] = type;
};

function append(hash, value) {
    var id = value.id,
        patchArray = hash[id] || (hash[id] = []);

    patchArray[patchArray.length] = value;
}

Transaction.prototype.append = function(value) {
    append(this.patches, value);
};

Transaction.prototype.appendRemove = function(value) {
    append(this.removes, value);
};

Transaction.prototype.toJSON = function() {
    return {
        removes: this.removes,
        patches: this.patches,

        events: this.events,
        eventsRemove: this.eventsRemove
    };
};


},
function(require, exports, module, global) {

var isFunction = require(5),
    isNumber = require(16),
    defineProperty = require(29);


var descriptor = {
    configurable: false,
    enumerable: false,
    writable: false,
    value: null
};

function addProperty(object, name, value) {
    descriptor.value = value;
    defineProperty(object, name, descriptor);
    descriptor.value = null;
}

function createPooler(Constructor) {
    switch (Constructor.length) {
        case 0:
            return createNoArgumentPooler(Constructor);
        case 1:
            return createOneArgumentPooler(Constructor);
        case 2:
            return createTwoArgumentsPooler(Constructor);
        case 3:
            return createThreeArgumentsPooler(Constructor);
        case 4:
            return createFourArgumentsPooler(Constructor);
        case 5:
            return createFiveArgumentsPooler(Constructor);
        default:
            return createApplyPooler(Constructor);
    }
}

function createNoArgumentPooler(Constructor) {
    return function pooler() {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            return instance;
        } else {
            return new Constructor();
        }
    };
}

function createOneArgumentPooler(Constructor) {
    return function pooler(a0) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0);
            return instance;
        } else {
            return new Constructor(a0);
        }
    };
}

function createTwoArgumentsPooler(Constructor) {
    return function pooler(a0, a1) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1);
            return instance;
        } else {
            return new Constructor(a0, a1);
        }
    };
}

function createThreeArgumentsPooler(Constructor) {
    return function pooler(a0, a1, a2) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1, a2);
            return instance;
        } else {
            return new Constructor(a0, a1, a2);
        }
    };
}

function createFourArgumentsPooler(Constructor) {
    return function pooler(a0, a1, a2, a3) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1, a2, a3);
            return instance;
        } else {
            return new Constructor(a0, a1, a2, a3);
        }
    };
}

function createFiveArgumentsPooler(Constructor) {
    return function pooler(a0, a1, a2, a3, a4) {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.call(instance, a0, a1, a2, a3, a4);
            return instance;
        } else {
            return new Constructor(a0, a1, a2, a3, a4);
        }
    };
}

function createApplyConstructor(Constructor) {
    function F(args) {
        return Constructor.apply(this, args);
    }
    F.prototype = Constructor.prototype;

    return function applyConstructor(args) {
        return new F(args);
    };
}

function createApplyPooler(Constructor) {
    var applyConstructor = createApplyConstructor(Constructor);

    return function pooler() {
        var instancePool = Constructor.instancePool,
            instance;

        if (instancePool.length) {
            instance = instancePool.pop();
            Constructor.apply(instance, arguments);
            return instance;
        } else {
            return applyConstructor(arguments);
        }
    };
}

function createReleaser(Constructor) {
    return function releaser(instance) {
        var instancePool = Constructor.instancePool;

        if (isFunction(instance.destructor)) {
            instance.destructor();
        }
        if (Constructor.poolSize === -1 || instancePool.length < Constructor.poolSize) {
            instancePool[instancePool.length] = instance;
        }
    };
}

module.exports = function createPool(Constructor, poolSize) {
    addProperty(Constructor, "instancePool", []);
    addProperty(Constructor, "getPooled", createPooler(Constructor));
    addProperty(Constructor, "release", createReleaser(Constructor));

    if (!Constructor.poolSize) {
        Constructor.poolSize = isNumber(poolSize) ? (poolSize < -1 ? -1 : poolSize) : -1;
    }

    return Constructor;
};


},
function(require, exports, module, global) {

var isFunction = require(5),
    isObjectLike = require(14),
    isNative = require(21);


var defineProperty;


if (!isNative(Object.defineProperty)) {
    defineProperty = function defineProperty(object, name, value) {
        if (!isObjectLike(object)) {
            throw new TypeError("defineProperty called on non-object");
        }
        object[name] = isObjectLike(value) ? (isFunction(value.get) ? value.get : value.value) : value;
    };
} else {
    defineProperty = Object.defineProperty;
}

module.exports = defineProperty;


},
function(require, exports, module, global) {

var createPool = require(28);


module.exports = Queue;


function Queue() {
    this.__callbacks = [];
}

createPool(Queue);

Queue.prototype.enqueue = function(callback) {
    var callbacks = this.__callbacks;
    callbacks[callbacks.length] = callback;
    return this;
};

Queue.prototype.notifyAll = function() {
    var callbacks = this.__callbacks,
        i = -1,
        il = callbacks.length - 1;

    while (i++ < il) {
        callbacks[i]();
    }
    callbacks.length = 0;

    return this;
};

Queue.prototype.destructor = function() {
    this.__callbacks.length = 0;
    return this;
};

Queue.prototype.reset = Queue.prototype.destructor;


},
function(require, exports, module, global) {

var keyMirror = require(32);


module.exports = keyMirror([
    "TEXT",
    "REPLACE",
    "PROPS",
    "ORDER",
    "INSERT",
    "MOUNT",
    "REMOVE"
]);


},
function(require, exports, module, global) {

var keys = require(20),
    isArrayLike = require(23);


function keyMirrorArray(array) {
    var i = array.length,
        results = {},
        key;

    while (i--) {
        key = array[i];
        results[key] = array[i];
    }

    return results;
}

function keyMirrorObject(object) {
    var objectKeys = keys(object),
        i = -1,
        il = objectKeys.length - 1,
        results = {},
        key;

    while (i++ < il) {
        key = objectKeys[i];
        results[key] = key;
    }

    return results;
}

module.exports = function keyMirror(object) {
    return isArrayLike(object) ? keyMirrorArray(object) : keyMirrorObject(Object(object));
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = InsertPatch;


function InsertPatch() {
    this.type = consts.INSERT;
    this.id = null;
    this.childId = null;
    this.index = null;
    this.next = null;
}
createPool(InsertPatch);

InsertPatch.create = function(id, childId, index, next) {
    var patch = InsertPatch.getPooled();
    patch.id = id;
    patch.childId = childId;
    patch.index = index;
    patch.next = next;
    return patch;
};

InsertPatch.prototype.destructor = function() {
    this.id = null;
    this.childId = null;
    this.index = null;
    this.next = null;
    return this;
};

InsertPatch.prototype.destroy = function() {
    return InsertPatch.release(this);
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = MountPatch;


function MountPatch() {
    this.type = consts.MOUNT;
    this.id = null;
    this.next = null;
}
createPool(MountPatch);

MountPatch.create = function(id, next) {
    var patch = MountPatch.getPooled();
    patch.id = id;
    patch.next = next;
    return patch;
};

MountPatch.prototype.destructor = function() {
    this.id = null;
    this.next = null;
    return this;
};

MountPatch.prototype.destroy = function() {
    return MountPatch.release(this);
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = OrderPatch;


function OrderPatch() {
    this.type = consts.ORDER;
    this.id = null;
    this.order = null;
}
createPool(OrderPatch);

OrderPatch.create = function(id, order) {
    var patch = OrderPatch.getPooled();
    patch.id = id;
    patch.order = order;
    return patch;
};

OrderPatch.prototype.destructor = function() {
    this.id = null;
    this.order = null;
    return this;
};

OrderPatch.prototype.destroy = function() {
    return OrderPatch.release(this);
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = PropsPatch;


function PropsPatch() {
    this.type = consts.PROPS;
    this.id = null;
    this.previous = null;
    this.next = null;
}
createPool(PropsPatch);

PropsPatch.create = function(id, previous, next) {
    var patch = PropsPatch.getPooled();
    patch.id = id;
    patch.previous = previous;
    patch.next = next;
    return patch;
};

PropsPatch.prototype.destructor = function() {
    this.id = null;
    this.previous = null;
    this.next = null;
    return this;
};

PropsPatch.prototype.destroy = function() {
    return PropsPatch.release(this);
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = RemovePatch;


function RemovePatch() {
    this.type = consts.REMOVE;
    this.id = null;
    this.childId = null;
    this.index = null;
}
createPool(RemovePatch);

RemovePatch.create = function(id, childId, index) {
    var patch = RemovePatch.getPooled();
    patch.id = id;
    patch.childId = childId;
    patch.index = index;
    return patch;
};

RemovePatch.prototype.destructor = function() {
    this.id = null;
    this.childId = null;
    this.index = null;
    return this;
};

RemovePatch.prototype.destroy = function() {
    return RemovePatch.release(this);
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = ReplacePatch;


function ReplacePatch() {
    this.type = consts.REPLACE;
    this.id = null;
    this.childId = null;
    this.index = null;
    this.next = null;
}
createPool(ReplacePatch);

ReplacePatch.create = function(id, childId, index, next) {
    var patch = ReplacePatch.getPooled();
    patch.id = id;
    patch.childId = childId;
    patch.index = index;
    patch.next = next;
    return patch;
};

ReplacePatch.prototype.destructor = function() {
    this.id = null;
    this.childId = null;
    this.index = null;
    this.next = null;
    return this;
};

ReplacePatch.prototype.destroy = function() {
    return ReplacePatch.release(this);
};


},
function(require, exports, module, global) {

var createPool = require(28),
    consts = require(31);


module.exports = TextPatch;


function TextPatch() {
    this.type = consts.TEXT;
    this.id = null;
    this.index = null;
    this.next = null;
}
createPool(TextPatch);

TextPatch.create = function(id, index, next) {
    var patch = TextPatch.getPooled();
    patch.id = id;
    patch.index = index;
    patch.next = next;
    return patch;
};

TextPatch.prototype.destructor = function() {
    this.id = null;
    this.index = null;
    this.next = null;
    return this;
};

TextPatch.prototype.destroy = function() {
    return TextPatch.release(this);
};


},
function(require, exports, module, global) {

var isString = require(15),
    isNumber = require(16),
    isNullOrUndefined = require(11);


module.exports = shouldUpdate;


function shouldUpdate(previous, next) {
    if (isNullOrUndefined(previous) || isNullOrUndefined(next)) {
        return false;
    } else {
        if (isString(previous) || isNumber(previous)) {
            return isString(next) || isNumber(next);
        } else {
            return (
                previous.type === next.type &&
                previous.key === next.key
            );
        }
    }
}


},
function(require, exports, module, global) {

var EventManagerPrototype;


module.exports = EventManager;


function EventManager() {
    this.propNameToTopLevel = {};
    this.events = {};
}

EventManagerPrototype = EventManager.prototype;

EventManagerPrototype.on = function(id, topLevelType, listener, transaction) {
    var events = this.events,
        event = events[topLevelType] || (events[topLevelType] = {});

    event[id] = listener;
    transaction.event(id, topLevelType);
};

EventManagerPrototype.off = function(id, topLevelType, transaction) {
    var events = this.events,
        event = events[topLevelType];

    if (event[id] !== undefined) {
        delete event[id];
        transaction.removeEvent(id, topLevelType);
    }
};

EventManagerPrototype.allOff = function(id, transaction) {
    var events = this.events,
        event, topLevelType;

    for (topLevelType in events) {
        if ((event = events[topLevelType])[id] !== undefined) {
            delete event[id];
            transaction.removeEvent(id, topLevelType);
        }
    }
};


},
function(require, exports, module, global) {

var process = require(3);
var has = require(18),
    map = require(19),
    indexOf = require(43),
    isString = require(15),
    isFunction = require(5),
    extend = require(44),
    owner = require(24),
    context = require(25),
    shouldUpdate = require(40),
    componentState = require(45),
    getComponentClassForType = require(46),
    View = require(9),
    getChildKey = require(54),
    emptyObject = require(53),
    diffProps = require(56),
    diffChildren;


var NodePrototype,
    isPrimativeView = View.isPrimativeView;


module.exports = Node;


function Node(parentId, id, currentView) {

    this.parent = null;
    this.parentId = parentId;
    this.id = id;

    this.context = null;

    this.root = null;

    this.component = null;

    this.isBottomLevel = true;
    this.isTopLevel = false;

    this.renderedNode = null;
    this.renderedChildren = null;

    this.currentView = currentView;
}

NodePrototype = Node.prototype;

NodePrototype.appendNode = function(node) {
    var renderedChildren = this.renderedChildren;

    this.root.appendNode(node);
    node.parent = this;

    renderedChildren[renderedChildren.length] = node;
};

NodePrototype.removeNode = function(node) {
    var renderedChildren = this.renderedChildren,
        index;

    node.parent = null;

    index = indexOf(renderedChildren, node);
    if (index !== -1) {
        renderedChildren.splice(index, 1);
    }
};

NodePrototype.mountComponent = function() {
    var currentView = this.currentView,
        ComponentClass, component, props, children, context;

    if (isFunction(currentView.type)) {
        ComponentClass = currentView.type;
    } else {
        ComponentClass = getComponentClassForType(currentView.type);
        this.isTopLevel = true;
    }

    props = this.__processProps(currentView.props);
    children = currentView.children;
    context = this.__processContext(currentView.__context);

    component = new ComponentClass(props, children, context);

    component.__node = this;
    component.props = props;
    component.children = children;
    component.context = context;

    this.component = component;
};

NodePrototype.mount = function(transaction) {
    transaction.mount(this.id, this.__mount(transaction));
};

NodePrototype.__mount = function(transaction) {
    var component, renderedView, renderedNode;

    this.context = context.current;
    this.mountComponent();

    renderedView = this.renderView();

    if (this.isTopLevel !== true) {
        renderedNode = this.renderedNode = new Node(this.parentId, this.id, renderedView);
        renderedNode.root = this.root;
        renderedNode.isBottomLevel = false;
        renderedView = renderedNode.__mount(transaction);
    } else {
        mountEvents(this.id, renderedView.props, this.root.eventManager, transaction);
        this.__mountChildren(renderedView, transaction);
    }

    component = this.component;
    component.__mountState = componentState.MOUNTING;
    component.componentWillMount();

    transaction.queue.enqueue(function onMount() {
        component.__mountState = componentState.MOUNTED;
        component.componentDidMount();
    });

    this.__attachRefs();

    return renderedView;
};

NodePrototype.__mountChildren = function(renderedView, transaction) {
    var _this = this,
        parentId = this.id,
        renderedChildren = [];

    this.renderedChildren = renderedChildren;

    renderedView.children = map(renderedView.children, function(child, index) {
        var node, id;

        if (isPrimativeView(child)) {
            return child;
        } else {
            id = getChildKey(parentId, child, index);
            node = new Node(parentId, id, child);
            _this.appendNode(node);
            return node.__mount(transaction);
        }
    });
};

NodePrototype.unmount = function(transaction) {
    this.__unmount(transaction);
    transaction.remove(this.parentId, this.id, 0);
};

NodePrototype.__unmount = function(transaction) {
    var component = this.component;

    if (this.isTopLevel !== true) {
        this.renderedNode.__unmount(transaction);
        this.renderedNode = null;
    } else {
        this.__unmountChildren(transaction);
        this.root.eventManager.allOff(this.id, transaction);
        this.renderedChildren = null;
    }

    component.__mountState = componentState.UNMOUNTING;
    component.componentWillUnmount();

    if (this.isBottomLevel !== false) {
        this.root.removeNode(this);
    }

    this.__detachRefs();

    this.context = null;
    this.component = null;
    this.currentView = null;

    transaction.queue.enqueue(function onUnmount() {
        component.__mountState = componentState.UNMOUNTED;
    });
};

NodePrototype.__unmountChildren = function(transaction) {
    var renderedChildren = this.renderedChildren,
        i = -1,
        il = renderedChildren.length - 1;

    while (i++ < il) {
        renderedChildren[i].__unmount(transaction);
    }
};

NodePrototype.update = function(nextView, transaction) {
    this.receiveView(nextView, nextView.__context, transaction);
};

NodePrototype.receiveView = function(nextView, nextContext, transaction) {
    var prevView = this.currentView,
        prevContext = this.context;

    this.updateComponent(
        prevView,
        nextView,
        prevContext,
        nextContext,
        transaction
    );
};

NodePrototype.updateComponent = function(
    prevParentView, nextParentView, prevUnmaskedContext, nextUnmaskedContext, transaction
) {
    var component = this.component,

        nextProps = component.props,
        nextChildren = component.children,
        nextContext = component.context,

        nextState;

    component.__mountState = componentState.UPDATING;

    if (prevParentView !== nextParentView) {
        nextProps = this.__processProps(nextParentView.props);
        nextChildren = nextParentView.children;
        nextContext = this.__processContext(nextParentView.__context);

        component.componentWillReceiveProps(nextProps, nextChildren, nextContext);
    }

    nextState = component.__nextState;

    if (component.shouldComponentUpdate(nextProps, nextChildren, nextState, nextContext)) {
        this.__updateComponent(
            nextParentView, nextProps, nextChildren, nextState, nextContext, nextUnmaskedContext, transaction
        );
    } else {
        this.currentView = nextParentView;
        this.context = nextUnmaskedContext;

        component.props = nextProps;
        component.children = nextChildren;
        component.state = nextState;
        component.context = nextContext;

        component.__mountState = componentState.MOUNTED;
    }
};

NodePrototype.__updateComponent = function(
    nextParentView, nextProps, nextChildren, nextState, nextContext, unmaskedContext, transaction
) {
    var component = this.component,

        prevProps = component.props,
        prevChildren = component.children,
        prevState = component.__previousState,
        prevContext = component.context,

        prevParentView;

    component.componentWillUpdate(nextProps, nextChildren, nextState, nextContext);

    component.props = nextProps;
    component.children = nextChildren;
    component.state = nextState;
    component.context = nextContext;

    this.context = unmaskedContext;

    if (this.isTopLevel !== true) {
        this.currentView = nextParentView;
        this.__updateRenderedNode(unmaskedContext, transaction);
    } else {
        prevParentView = this.currentView;
        this.currentView = nextParentView;
        this.__updateRenderedView(prevParentView, unmaskedContext, transaction);
    }

    transaction.queue.enqueue(function onUpdate() {
        component.__mountState = componentState.UPDATED;
        component.componentDidUpdate(prevProps, prevChildren, prevState, prevContext);
        component.__mountState = componentState.MOUNTED;
    });
};

NodePrototype.__updateRenderedNode = function(context, transaction) {
    var prevNode = this.renderedNode,
        prevRenderedView = prevNode.currentView,
        nextRenderedView = this.renderView(),
        renderedNode;

    if (shouldUpdate(prevRenderedView, nextRenderedView)) {
        prevNode.receiveView(nextRenderedView, this.__processChildContext(context), transaction);
    } else {
        prevNode.__unmount(transaction);

        renderedNode = this.renderedNode = new Node(this.parentId, this.id, nextRenderedView);
        renderedNode.root = this.root;
        renderedNode.isBottomLevel = false;

        transaction.replace(this.parentId, this.id, 0, renderedNode.__mount(transaction));
    }

    this.__attachRefs();
};

diffChildren = require(58);

NodePrototype.__updateRenderedView = function(prevRenderedView, context, transaction) {
    var id = this.id,
        nextRenderedView = this.renderView(),
        propsDiff = diffProps(id, this.root.eventManager, transaction, prevRenderedView.props, nextRenderedView.props);

    if (propsDiff !== null) {
        transaction.props(id, prevRenderedView.props, propsDiff);
    }

    diffChildren(this, prevRenderedView, nextRenderedView, transaction);
};

NodePrototype.renderView = function() {
    var currentView = this.currentView,
        previousContext = context.current,
        renderedView;

    context.current = this.__processChildContext(currentView.__context);
    owner.current = this.component;

    renderedView = this.component.render();

    context.current = previousContext;
    owner.current = null;

    return renderedView;
};

NodePrototype.__checkTypes = function(propTypes, props) {
    var localHas = has,
        displayName = this.component.displayName,
        propName, error;

    if (propTypes) {
        for (propName in propTypes) {
            if (localHas(propTypes, propName)) {
                error = propTypes[propName](props, propName, displayName);
                if (error !== null) {
                    console.warn(error);
                }
            }
        }
    }
};

NodePrototype.__processProps = function(props) {
    var propTypes;

    if (process.env.NODE_ENV === "development") {
        propTypes = this.currentView.type.propTypes;

        if (propTypes) {
            this.__checkTypes(propTypes, props);
        }
    }

    return props;
};

NodePrototype.__maskContext = function(context) {
    var maskedContext = null,
        contextTypes, contextName, localHas;

    if (isString(this.currentView.type)) {
        return emptyObject;
    } else {
        contextTypes = this.currentView.type.contextTypes;

        if (contextTypes) {
            maskedContext = {};
            localHas = has;

            for (contextName in contextTypes) {
                if (localHas(contextTypes, contextName)) {
                    maskedContext[contextName] = context[contextName];
                }
            }
        }

        return maskedContext;
    }
};

NodePrototype.__processContext = function(context) {
    var maskedContext = this.__maskContext(context),
        contextTypes;

    if (process.env.NODE_ENV === "development") {
        contextTypes = this.currentView.type.contextTypes;

        if (contextTypes) {
            this.__checkTypes(contextTypes, maskedContext);
        }
    }

    return maskedContext;
};

NodePrototype.__processChildContext = function(currentContext) {
    var component = this.component,
        childContext = component.getChildContext(),
        childContextTypes, localHas, contextName, displayName;

    if (childContext) {
        childContextTypes = this.currentView.type.childContextTypes;

        if (process.env.NODE_ENV === "development") {
            if (childContextTypes) {
                this.__checkTypes(childContextTypes, childContext);
            }
        }

        if (childContextTypes) {
            localHas = has;
            displayName = component.displayName;

            for (contextName in childContext) {
                if (!localHas(childContextTypes, contextName)) {
                    console.warn(new Error(
                        displayName + " getChildContext(): key " + contextName + " is not defined in childContextTypes"
                    ));
                }
            }
        }

        return extend({}, currentContext, childContext);
    } else {
        return currentContext;
    }
};

NodePrototype.__attachRefs = function() {
    var view = this.currentView,
        ref = view.ref;

    if (isString(ref)) {
        attachRef(this.component, ref, view.__owner);
    }
};

NodePrototype.__detachRefs = function() {
    var view = this.currentView,
        ref = view.ref;

    if (isString(ref)) {
        detachRef(ref, view.__owner);
    }
};

function attachRef(component, ref, owner) {
    var refs;

    if (isString(ref)) {
        refs = owner.refs === emptyObject ? (owner.refs = {}) : owner.refs;
        refs[ref] = component;
    }
}

function detachRef(ref, owner) {
    var refs = owner.refs;
    delete refs[ref];
}

function mountEvents(id, props, eventManager, transaction) {
    var propNameToTopLevel = eventManager.propNameToTopLevel,
        localHas = has,
        key;

    for (key in props) {
        if (localHas(propNameToTopLevel, key)) {
            eventManager.on(id, propNameToTopLevel[key], props[key], transaction);
        }
    }
}


},
function(require, exports, module, global) {

var isLength = require(13),
    isObjectLike = require(14);


function arrayIndexOf(array, value, fromIndex) {
    var i = fromIndex - 1,
        il = array.length - 1;

    while (i++ < il) {
        if (array[i] === value) {
            return i;
        }
    }

    return -1;
}

module.exports = function indexOf(array, value, fromIndex) {
    return (isObjectLike(array) && isLength(array.length)) ? arrayIndexOf(array, value, fromIndex || 0) : -1;
};


},
function(require, exports, module, global) {

var keys = require(20);


function baseExtend(a, b) {
    var objectKeys = keys(b),
        i = -1,
        il = objectKeys.length - 1,
        key;

    while (i++ < il) {
        key = objectKeys[i];
        a[key] = b[key];
    }
}

module.exports = function extend(out) {
    var i = 0,
        il = arguments.length - 1;

    while (i++ < il) {
        baseExtend(out, arguments[i]);
    }

    return out;
};


},
function(require, exports, module, global) {

var keyMirror = require(32);


module.exports = keyMirror([
    "MOUNTING",
    "MOUNTED",
    "UPDATING",
    "UPDATED",
    "UNMOUNTING",
    "UNMOUNTED"
]);


},
function(require, exports, module, global) {

var nativeComponents = require(47),
    createNativeComponentForType = require(48);


module.exports = getComponentClassForType;


function getComponentClassForType(type) {
    var Class = nativeComponents[type];

    if (Class) {
        return Class;
    } else {
        Class = createNativeComponentForType(type);
        nativeComponents[type] = Class;
        return Class;
    }
}


},
function(require, exports, module, global) {




},
function(require, exports, module, global) {

var View = require(9),
    Component = require(49);


module.exports = createNativeComponentForType;


function createNativeComponentForType(type) {
    function NativeComponent(props, children) {
        Component.call(this, props, children);
    }
    Component.extend(NativeComponent);

    NativeComponent.prototype.render = function() {
        return new View(type, null, null, this.props, this.children, null, null);
    };

    return NativeComponent;
}


},
function(require, exports, module, global) {

var inherits = require(50),
    extend = require(44),
    componentState = require(45),
    emptyObject = require(53);


var ComponentPrototype;


module.exports = Component;


function Component(props, children, context) {
    this.__node = null;
    this.__mountState = componentState.UNMOUNTED;
    this.__nextState = null;
    this.props = props;
    this.children = children;
    this.context = context;
    this.state = null;
    this.refs = emptyObject;
}

ComponentPrototype = Component.prototype;

Component.extend = function(child, displayName) {
    inherits(child, this);
    child.displayName = child.prototype.displayName = displayName || ComponentPrototype.displayName;
    return child;
};

ComponentPrototype.displayName = "Component";

ComponentPrototype.render = function() {
    throw new Error("render() render must be defined on Components");
};

ComponentPrototype.setState = function(state) {
    var node = this.__node;

    this.__nextState = extend({}, this.state, state);

    if (this.__mountState === componentState.MOUNTED) {
        node.root.update(node);
    }
};

ComponentPrototype.forceUpdate = function() {
    var node = this.__node;

    if (this.__mountState === componentState.MOUNTED) {
        node.root.update(node);
    }
};

ComponentPrototype.isMounted = function() {
    return this.__mountState === componentState.MOUNTED;
};

ComponentPrototype.getId = function() {
    return this.__node.id;
};

ComponentPrototype.getChildContext = function() {};

ComponentPrototype.componentDidMount = function() {};

ComponentPrototype.componentDidUpdate = function( /* previousProps, previousChildren, previousState, previousContext */ ) {};

ComponentPrototype.componentWillMount = function() {};

ComponentPrototype.componentWillUnmount = function() {};

ComponentPrototype.componentWillReceiveProps = function( /* nextProps, nextChildren, nextContext */ ) {};

ComponentPrototype.componentWillUpdate = function( /* nextProps, nextChildren, nextState, nextContext */ ) {};

ComponentPrototype.shouldComponentUpdate = function( /* nextProps, nextChildren, nextState, nextContext */ ) {
    return true;
};


},
function(require, exports, module, global) {

var create = require(51),
    extend = require(44),
    mixin = require(52),
    defineProperty = require(29);


var descriptor = {
    configurable: true,
    enumerable: false,
    writable: true,
    value: null
};


function defineNonEnumerableProperty(object, name, value) {
    descriptor.value = value;
    defineProperty(object, name, descriptor);
    descriptor.value = null;
}

function defineStatic(name, value) {
    defineNonEnumerableProperty(this, name, value);
}

function inherits(child, parent) {

    mixin(child, parent);

    child.prototype = extend(create(parent.prototype), child.prototype);

    defineNonEnumerableProperty(child, "__super", parent.prototype);
    defineNonEnumerableProperty(child.prototype, "constructor", child);

    child.defineStatic = defineStatic;
    child.super_ = parent; // support node

    return child;
}

inherits.defineProperty = defineNonEnumerableProperty;


module.exports = inherits;


},
function(require, exports, module, global) {

module.exports = Object.create || (function() {
    function F() {}
    return function create(object) {
        F.prototype = object;
        return new F();
    };
}());


},
function(require, exports, module, global) {

var keys = require(20),
    isNullOrUndefined = require(11);


function baseMixin(a, b) {
    var objectKeys = keys(b),
        i = -1,
        il = objectKeys.length - 1,
        key, value;

    while (i++ < il) {
        key = objectKeys[i];

        if (isNullOrUndefined(a[key]) && !isNullOrUndefined((value = b[key]))) {
            a[key] = value;
        }
    }
}

module.exports = function mixin(out) {
    var i = 0,
        il = arguments.length - 1;

    while (i++ < il) {
        baseMixin(out, arguments[i]);
    }

    return out;
};


},
function(require, exports, module, global) {




},
function(require, exports, module, global) {

var getViewKey = require(55);


module.exports = getChildKey;


function getChildKey(parentId, child, index) {
    return parentId + "." + getViewKey(child, index);
}


},
function(require, exports, module, global) {

var isNullOrUndefined = require(11);


var reEscape = /[=.:]/g;


module.exports = getViewKey;


function getViewKey(view, index) {
    var key = view.key;

    if (isNullOrUndefined(key)) {
        return index.toString(36);
    } else {
        return "$" + escapeKey(key);
    }
}

function escapeKey(key) {
    return (key + "").replace(reEscape, "$");
}


},
function(require, exports, module, global) {

var has = require(18),
    isObject = require(4),
    getPrototypeOf = require(57),
    isNullOrUndefined = require(11);


module.exports = diffProps;


function diffProps(id, eventManager, transaction, previous, next) {
    var result = null,
        localHas = has,
        propNameToTopLevel = eventManager.propNameToTopLevel,
        key, previousValue, nextValue, propsDiff;

    for (key in previous) {
        nextValue = next[key];

        if (isNullOrUndefined(nextValue)) {
            result = result || {};
            result[key] = undefined;

            if (localHas(propNameToTopLevel, key)) {
                eventManager.off(id, propNameToTopLevel[key], transaction);
            }
        } else {
            previousValue = previous[key];

            if (previousValue === nextValue) {
                continue;
            } else if (isObject(previousValue) && isObject(nextValue)) {
                if (getPrototypeOf(previousValue) !== getPrototypeOf(nextValue)) {
                    result = result || {};
                    result[key] = nextValue;
                } else {
                    propsDiff = diffProps(id, eventManager, transaction, previousValue, nextValue);
                    if (propsDiff !== null) {
                        result = result || {};
                        result[key] = propsDiff;
                    }
                }
            } else {
                result = result || {};
                result[key] = nextValue;
            }
        }
    }

    for (key in next) {
        if (isNullOrUndefined(previous[key])) {
            nextValue = next[key];

            result = result || {};
            result[key] = nextValue;

            if (localHas(propNameToTopLevel, key)) {
                eventManager.on(id, propNameToTopLevel[key], transaction);
            }
        }
    }

    return result;
}


},
function(require, exports, module, global) {

var isObject = require(4),
    isNative = require(21);


var nativeGetPrototypeOf = Object.getPrototypeOf;


if (!isNative(nativeGetPrototypeOf)) {
    nativeGetPrototypeOf = function getPrototypeOf(obj) {
        return obj.__proto__ || (
            obj.constructor ? obj.constructor.prototype : null
        );
    };
}

module.exports = function getPrototypeOf(obj) {
    return obj == null ? null : nativeGetPrototypeOf(
        (isObject(obj) ? obj : Object(obj))
    );
};


},
function(require, exports, module, global) {

var isNullOrUndefined = require(11),
    getChildKey = require(54),
    shouldUpdate = require(40),
    View = require(9),
    Node;


var isPrimativeView = View.isPrimativeView;


module.exports = diffChildren;


Node = require(42);


function diffChildren(node, previous, next, transaction) {
    var root = node.root,
        previousChildren = previous.children,
        nextChildren = reorder(previousChildren, next.children),
        previousLength = previousChildren.length,
        nextLength = nextChildren.length,
        parentId = node.id,
        i = -1,
        il = (previousLength > nextLength ? previousLength : nextLength) - 1;

    while (i++ < il) {
        diffChild(root, node, previousChildren[i], nextChildren[i], parentId, i, transaction);
    }

    if (nextChildren.moves) {
        transaction.order(parentId, nextChildren.moves);
    }
}

function diffChild(root, parentNode, previousChild, nextChild, parentId, index, transaction) {
    var node, id;

    if (previousChild !== nextChild) {
        if (isNullOrUndefined(previousChild)) {
            if (isPrimativeView(nextChild)) {
                transaction.insert(parentId, null, index, nextChild);
            } else {
                id = getChildKey(parentId, nextChild, index);
                node = new Node(parentId, id, nextChild);
                parentNode.appendNode(node);
                transaction.insert(parentId, id, index, node.__mount(transaction));
            }
        } else if (isPrimativeView(previousChild)) {
            if (isNullOrUndefined(nextChild)) {
                transaction.remove(parentId, null, index);
            } else if (isPrimativeView(nextChild)) {
                transaction.text(parentId, index, nextChild);
            } else {
                id = getChildKey(parentId, nextChild, index);
                node = new Node(parentId, id, nextChild);
                parentNode.appendNode(node);
                transaction.replace(parentId, id, index, node.__mount(transaction));
            }
        } else {
            if (isNullOrUndefined(nextChild)) {
                id = getChildKey(parentId, previousChild, index);
                node = root.childHash[id];
                node.unmount(transaction);
                parentNode.removeNode(node);
            } else if (isPrimativeView(nextChild)) {
                transaction.replace(parentId, null, index, nextChild);
            } else {
                id = getChildKey(parentId, previousChild, index);
                node = root.childHash[id];

                if (node) {
                    if (shouldUpdate(previousChild, nextChild)) {
                        node.update(nextChild, transaction);
                    } else {
                        node.__unmount(transaction);
                        parentNode.removeNode(node);

                        id = getChildKey(parentId, nextChild, index);
                        node = new Node(parentId, id, nextChild);
                        parentNode.appendNode(node);
                        transaction.replace(parentId, id, index, node.__mount(transaction));
                    }
                } else {
                    id = getChildKey(parentId, nextChild, index);
                    node = new Node(parentId, id, nextChild);
                    parentNode.appendNode(node);
                    transaction.insert(parentId, id, index, node.__mount(transaction));
                }
            }
        }
    }
}

function reorder(previousChildren, nextChildren) {
    var previousKeys, nextKeys, previousMatch, nextMatch, key, previousLength, nextLength,
        length, shuffle, freeIndex, i, moveIndex, moves, removes, reverse, hasMoves, move, freeChild;

    nextKeys = keyIndex(nextChildren);
    if (nextKeys === null) {
        return nextChildren;
    }

    previousKeys = keyIndex(previousChildren);
    if (previousKeys === null) {
        return nextChildren;
    }

    nextMatch = {};
    previousMatch = {};

    for (key in nextKeys) {
        nextMatch[nextKeys[key]] = previousKeys[key];
    }

    for (key in previousKeys) {
        previousMatch[previousKeys[key]] = nextKeys[key];
    }

    previousLength = previousChildren.length;
    nextLength = nextChildren.length;
    length = previousLength > nextLength ? previousLength : nextLength;
    shuffle = [];
    freeIndex = 0;
    i = 0;
    moveIndex = 0;
    moves = {};
    removes = moves.removes = {};
    reverse = moves.reverse = {};
    hasMoves = false;

    while (freeIndex < length) {
        move = previousMatch[i];

        if (move !== undefined) {
            shuffle[i] = nextChildren[move];

            if (move !== moveIndex) {
                moves[move] = moveIndex;
                reverse[moveIndex] = move;
                hasMoves = true;
            }

            moveIndex++;
        } else if (i in previousMatch) {
            shuffle[i] = undefined;
            removes[i] = moveIndex++;
            hasMoves = true;
        } else {
            while (nextMatch[freeIndex] !== undefined) {
                freeIndex++;
            }

            if (freeIndex < length) {
                freeChild = nextChildren[freeIndex];

                if (freeChild) {
                    shuffle[i] = freeChild;
                    if (freeIndex !== moveIndex) {
                        hasMoves = true;
                        moves[freeIndex] = moveIndex;
                        reverse[moveIndex] = freeIndex;
                    }
                    moveIndex++;
                }
                freeIndex++;
            }
        }
        i++;
    }

    if (hasMoves) {
        shuffle.moves = moves;
    }

    return shuffle;
}

function keyIndex(children) {
    var i = -1,
        il = children.length - 1,
        keys = null,
        child;

    while (i++ < il) {
        child = children[i];

        if (!isNullOrUndefined(child.key)) {
            keys = keys || {};
            keys[child.key] = i;
        }
    }

    return keys;
}


},
function(require, exports, module, global) {

var nativeComponents = require(47);


module.exports = registerNativeComponent;


function registerNativeComponent(type, constructor) {
    nativeComponents[type] = constructor;
}


},
function(require, exports, module, global) {

var render = require(61),
    renderString = require(110);


var virtDOM = exports;


module.exports = virtDOM;

virtDOM.render = render;
virtDOM.unmount = render.unmount;

virtDOM.renderString = function(view, id) {
    return renderString(view, id || ".0");
};

virtDOM.findDOMNode = require(119);

virtDOM.createWorkerRender = require(120);
virtDOM.renderWorker = require(122);


},
function(require, exports, module, global) {

var virt = require(8),
    Adaptor = require(62),
    getRootNodeInContainer = require(118),
    getNodeId = require(116);


var rootsById = {};


module.exports = render;


function render(nextView, containerDOMNode) {
    var rootDOMNode = getRootNodeInContainer(containerDOMNode),
        id = getNodeId(rootDOMNode),
        root;

    if (id === null) {
        root = new virt.Root();
        root.adaptor = new Adaptor(root, containerDOMNode);
        id = root.id;
        rootsById[id] = root;
    } else {
        root = rootsById[id];
    }

    root.render(nextView, id);
}

render.unmount = function(containerDOMNode) {
    var rootDOMNode = getRootNodeInContainer(containerDOMNode),
        id = getNodeId(rootDOMNode),
        root = rootsById[id];

    if (root !== undefined) {
        root.unmount();
        delete rootsById[id];
    }
};


},
function(require, exports, module, global) {

var traverseAncestors = require(63),
    getWindow = require(67),
    getNodeById = require(68),
    consts = require(70),
    EventHandler = require(72),
    eventClassMap = require(77),
    applyEvents = require(103),
    applyPatches = require(104);


var AdaptorPrototype;


module.exports = Adaptor;


function Adaptor(root, containerDOMNode) {
    var document = containerDOMNode.ownerDocument,
        window = getWindow(document),
        eventManager = root.eventManager,
        events = eventManager.events,
        eventHandler = new EventHandler(document, window);

    this.root = root;
    this.containerDOMNode = containerDOMNode;

    this.document = document;
    this.window = getWindow(document);

    this.eventHandler = eventHandler;

    eventManager.propNameToTopLevel = consts.propNameToTopLevel;

    eventHandler.handleDispatch = function(topLevelType, nativeEvent, targetId) {
        var eventType = events[topLevelType],
            event;

        traverseAncestors(targetId, function(currentTargetId) {
            if (eventType[currentTargetId]) {
                event = event || eventClassMap[topLevelType].getPooled(nativeEvent, eventHandler);
                event.currentTarget = getNodeById(currentTargetId);
                eventType[currentTargetId](event);
                return event.returnValue;
            } else {
                return true;
            }
        });

        if (event && event.isPersistent !== true) {
            event.destroy();
        }
    };
}

AdaptorPrototype = Adaptor.prototype;

AdaptorPrototype.handle = function(transaction, callback) {
    var containerDOMNode = this.containerDOMNode,
        eventHandler = this.eventHandler,
        document = this.document;

    applyPatches(transaction.patches, containerDOMNode, document);
    applyEvents(transaction.events, eventHandler);
    applyPatches(transaction.removes, containerDOMNode, document);

    callback();
};


},
function(require, exports, module, global) {

var traversePath = require(64);


module.exports = traverseAncestors;


function traverseAncestors(id, callback) {
    traversePath("", id, callback, true, false);
}


},
function(require, exports, module, global) {

var isBoundary = require(65),
    isAncestorIdOf = require(66);


module.exports = traversePath;


function traversePath(start, stop, callback, skipFirst, skipLast) {
    var traverseUp = isAncestorIdOf(stop, start),
        traverse = traverseUp ? getParentID : getNextDescendantID,
        id = start,
        ret;

    while (true) {
        if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
            ret = callback(id, traverseUp);
        }
        if (ret === false || id === stop) {
            break;
        }

        id = traverse(id, stop);
    }
}

function getNextDescendantID(ancestorID, destinationID) {
    var start, i, il;

    if (ancestorID === destinationID) {
        return ancestorID;
    } else {
        start = ancestorID.length + 1;
        i = start - 1;
        il = destinationID.length - 1;

        while (i++ < il) {
            if (isBoundary(destinationID, i)) {
                break;
            }
        }

        return destinationID.substr(0, i);
    }
}

function getParentID(id) {
    return id ? id.substr(0, id.lastIndexOf(".")) : "";
}


},
function(require, exports, module, global) {

module.exports = isBoundary;


function isBoundary(id, index) {
    return id.charAt(index) === "." || index === id.length;
}


},
function(require, exports, module, global) {

var isBoundary = require(65);


module.exports = isAncestorIdOf;


function isAncestorIdOf(ancestorID, descendantID) {
    return (
        descendantID.indexOf(ancestorID) === 0 &&
        isBoundary(descendantID, ancestorID.length)
    );
}


},
function(require, exports, module, global) {

module.exports = getWindow;


function getWindow(document) {
    var scriptElement, parentElement;

    if (document.parentWindow) {
        return document.parentWindow;
    } else {
        if (!document.defaultView) {
            scriptElement = document.createElement("script");
            scriptElement.innerHTML = "document.parentWindow=window;";

            parentElement = document.documentElement;
            parentElement.appendChild(scriptElement);
            parentElement.removeChild(scriptElement);

            return document.parentWindow;
        } else {
            return document.defaultView;
        }
    }
}


},
function(require, exports, module, global) {

var nodeCache = require(69);


module.exports = getNodeById;


function getNodeById(id) {
    return nodeCache[id];
}


},
function(require, exports, module, global) {




},
function(require, exports, module, global) {

var map = require(19),
    forEach = require(71),
    keyMirror = require(32);


var consts = exports,

    topLevelToEvent = consts.topLevelToEvent = {},
    propNameToTopLevel = consts.propNameToTopLevel = {},

    eventTypes = [
        "topBlur",
        "topChange",
        "topClick",
        "topCompositionEnd",
        "topCompositionStart",
        "topCompositionUpdate",
        "topContextMenu",
        "topCopy",
        "topCut",
        "topDoubleClick",
        "topDrag",
        "topDragEnd",
        "topDragEnter",
        "topDragExit",
        "topDragLeave",
        "topDragOver",
        "topDragStart",
        "topDrop",
        "topError",
        "topFocus",
        "topInput",
        "topKeyDown",
        "topKeyPress",
        "topKeyUp",
        "topLoad",
        "topMouseDown",
        "topMouseMove",
        "topMouseOut",
        "topMouseOver",
        "topMouseUp",
        "topPaste",
        "topReset",
        "topScroll",
        "topSelectionChange",
        "topSubmit",
        "topTextInput",
        "topTouchCancel",
        "topTouchEnd",
        "topTouchMove",
        "topTouchStart",
        "topWheel"
    ];

consts.phases = keyMirror([
    "bubbled",
    "captured"
]);

consts.topLevelTypes = keyMirror(eventTypes);

consts.propNames = map(eventTypes, replaceTopWithOn);

forEach(eventTypes, function(str) {
    propNameToTopLevel[replaceTopWithOn(str)] = str;
});

forEach(eventTypes, function(str) {
    topLevelToEvent[str] = removeTop(str).toLowerCase();
});

function replaceTopWithOn(str) {
    return str.replace(/^top/, "on");
}

function removeTop(str) {
    return str.replace(/^top/, "");
}


},
function(require, exports, module, global) {

var keys = require(20),
    isNullOrUndefined = require(11),
    fastBindThis = require(22),
    isArrayLike = require(23);


function forEachArray(array, callback) {
    var i = -1,
        il = array.length - 1;

    while (i++ < il) {
        if (callback(array[i], i) === false) {
            return false;
        }
    }

    return array;
}

function forEachObject(object, callback) {
    var objectKeys = keys(object),
        i = -1,
        il = objectKeys.length - 1,
        key;

    while (i++ < il) {
        key = objectKeys[i];

        if (callback(object[key], key) === false) {
            return false;
        }
    }

    return object;
}

module.exports = function forEach(object, callback, thisArg) {
    callback = isNullOrUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 2);
    return isArrayLike(object) ? forEachArray(object, callback) : forEachObject(object, callback);
};


},
function(require, exports, module, global) {

var has = require(18),
    eventListener = require(2),
    consts = require(70),
    getEventTarget = require(73),
    getNodeAttributeId = require(74),
    isEventSupported = require(76);


var topLevelTypes = consts.topLevelTypes,
    topLevelToEvent = consts.topLevelToEvent,
    EventHandlerPrototype;


module.exports = EventHandler;


function EventHandler(document, window) {
    var viewport = {
        currentScrollLeft: 0,
        currentScrollTop: 0
    };

    this.document = document;
    this.window = window;
    this.viewport = viewport;
    this.handleDispatch = null;

    this.__isListening = {};
    this.__listening = {};

    function callback() {
        viewport.currentScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        viewport.currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    }

    this.__callback = callback;
    eventListener.on(window, "scroll resize", callback);
}

EventHandlerPrototype = EventHandler.prototype;

EventHandlerPrototype.clear = function() {
    var listening = this.__listening,
        isListening = this.__isListening,
        localHas = has,
        topLevelType;

    for (topLevelType in listening) {
        if (localHas(listening, topLevelType)) {
            listening[topLevelType]();
            delete listening[topLevelType];
            delete isListening[topLevelType];
        }
    }

    eventListener.off(this.window, "scroll resize", this.__callback);
};

EventHandlerPrototype.listenTo = function(id, topLevelType) {
    var document = this.document,
        window = this.window,
        isListening = this.__isListening;

    if (!isListening[topLevelType]) {
        if (topLevelType === topLevelTypes.topWheel) {
            if (isEventSupported("wheel")) {
                this.trapBubbledEvent(topLevelTypes.topWheel, "wheel", document);
            } else if (isEventSupported("mousewheel")) {
                this.trapBubbledEvent(topLevelTypes.topWheel, "mousewheel", document);
            } else {
                this.trapBubbledEvent(topLevelTypes.topWheel, "DOMMouseScroll", document);
            }
        } else if (topLevelType === topLevelTypes.topScroll) {
            if (isEventSupported("scroll", true)) {
                this.trapCapturedEvent(topLevelTypes.topScroll, "scroll", document);
            } else {
                this.trapBubbledEvent(topLevelTypes.topScroll, "scroll", window);
            }
        } else if (
            topLevelType === topLevelTypes.topFocus ||
            topLevelType === topLevelTypes.topBlur
        ) {
            if (isEventSupported("focus", true)) {
                this.trapBubbledEvent(topLevelTypes.topFocus, "focus", document);
                this.trapBubbledEvent(topLevelTypes.topBlur, "blur", document);
            } else if (isEventSupported("focusin")) {
                this.trapBubbledEvent(topLevelTypes.topFocus, "focusin", document);
                this.trapBubbledEvent(topLevelTypes.topBlur, "focusout", document);
            }

            isListening[topLevelTypes.topFocus] = true;
            isListening[topLevelTypes.topBlur] = true;
        } else {
            this.trapBubbledEvent(topLevelType, topLevelToEvent[topLevelType], document);
        }

        isListening[topLevelType] = true;
    }
};

EventHandlerPrototype.trapBubbledEvent = function(topLevelType, type, element) {
    var _this = this,
        listening = this.__listening;

    function handler(nativeEvent) {
        _this.dispatchEvent(topLevelType, nativeEvent);
    }

    eventListener.on(element, type, handler);

    function removeBubbledEvent() {
        eventListener.off(element, type, handler);
    }
    listening[topLevelType] = removeBubbledEvent;

    return removeBubbledEvent;
};

EventHandlerPrototype.trapCapturedEvent = function(topLevelType, type, element) {
    var _this = this,
        listening = this.__listening;

    function handler(nativeEvent) {
        _this.dispatchEvent(topLevelType, nativeEvent);
    }

    eventListener.capture(element, type, handler);

    function removeCapturedEvent() {
        eventListener.off(element, type, handler);
    }
    listening[topLevelType] = removeCapturedEvent;

    return removeCapturedEvent;
};

EventHandlerPrototype.dispatchEvent = function(topLevelType, nativeEvent) {
    this.handleDispatch(topLevelType, nativeEvent, getNodeAttributeId(getEventTarget(nativeEvent, this.window)));
};


},
function(require, exports, module, global) {

module.exports = getEventTarget;


function getEventTarget(nativeEvent, window) {
    var target = nativeEvent.target || nativeEvent.srcElement || window;
    return target.nodeType === 3 ? target.parentNode : target;
}


},
function(require, exports, module, global) {

var DOM_ID_NAME = require(75);


module.exports = getNodeAttributeId;


function getNodeAttributeId(node) {
    return node && node.getAttribute && node.getAttribute(DOM_ID_NAME) || "";
}


},
function(require, exports, module, global) {

module.exports = "data-virtid";


},
function(require, exports, module, global) {

var isFunction = require(5),
    has = require(18),
    environment = require(1);


var document = environment.document,

    useHasFeature = (
        document.implementation &&
        document.implementation.hasFeature &&
        document.implementation.hasFeature("", "") !== true
    );


module.exports = isEventSupported;


function isEventSupported(eventNameSuffix, capture) {
    var isSupported, eventName, element;

    if (!environment.canUseDOM || capture && document.addEventListener == null) {
        return false;
    } else {
        eventName = "on" + eventNameSuffix;
        isSupported = has(document, eventName);

        if (!isSupported) {
            element = document.createElement("div");
            element.setAttribute(eventName, "return;");
            isSupported = isFunction(element[eventName]);
        }

        if (!isSupported && useHasFeature && eventNameSuffix === "wheel") {
            isSupported = document.implementation.hasFeature("Events.wheel", "3.0");
        }

        return isSupported;
    }
}


},
function(require, exports, module, global) {

var SyntheticClipboardEvent = require(78),
    SyntheticDragEvent = require(82),
    SyntheticFocusEvent = require(89),
    SyntheticInputEvent = require(91),
    SyntheticKeyboardEvent = require(93),
    SyntheticMouseEvent = require(84),
    SyntheticTouchEvent = require(97),
    SyntheticUIEvent = require(86),
    SyntheticWheelEvent = require(101);


module.exports = {
    // Clipboard Events
    topCopy: SyntheticClipboardEvent,
    topCut: SyntheticClipboardEvent,
    topPaste: SyntheticClipboardEvent,

    // Keyboard Events
    topKeyDown: SyntheticKeyboardEvent,
    topKeyUp: SyntheticKeyboardEvent,
    topKeyPress: SyntheticKeyboardEvent,

    // Focus Events
    topFocus: SyntheticFocusEvent,
    topBlur: SyntheticFocusEvent,

    // Form Events
    topChange: SyntheticInputEvent,
    topInput: SyntheticInputEvent,
    topSubmit: SyntheticInputEvent,

    // Mouse Events
    topClick: SyntheticMouseEvent,
    topDoubleClick: SyntheticMouseEvent,
    topMouseDown: SyntheticMouseEvent,
    topMouseEnter: SyntheticMouseEvent,
    topMouseLeave: SyntheticMouseEvent,
    topMouseMove: SyntheticMouseEvent,
    topMouseOut: SyntheticMouseEvent,
    topMouseOver: SyntheticMouseEvent,
    topMouseIp: SyntheticMouseEvent,

    // Drag Events
    topDrag: SyntheticDragEvent,
    topDragEnd: SyntheticDragEvent,
    topDragEnter: SyntheticDragEvent,
    topDragExit: SyntheticDragEvent,
    topDragLeave: SyntheticDragEvent,
    topDragOver: SyntheticDragEvent,
    topDragStart: SyntheticDragEvent,
    topDragDrop: SyntheticDragEvent,

    // Touch Events
    topTouchCancel: SyntheticTouchEvent,
    topTouchEnd: SyntheticTouchEvent,
    topTouchMove: SyntheticTouchEvent,
    topTouchStart: SyntheticTouchEvent,

    // Scroll Event
    topScroll: SyntheticUIEvent,

    // Wheel Event
    topWheel: SyntheticWheelEvent
};


},
function(require, exports, module, global) {

var getClipboardEvent = require(79),
    SyntheticEvent = require(80);


var SyntheticEventPrototype = SyntheticEvent.prototype,
    SyntheticClipboardEventPrototype;


module.exports = SyntheticClipboardEvent;


function SyntheticClipboardEvent(nativeEvent, eventHandler) {

    SyntheticEvent.call(this, nativeEvent, eventHandler);

    getClipboardEvent(this, nativeEvent, eventHandler);
}
SyntheticEvent.extend(SyntheticClipboardEvent);
SyntheticClipboardEventPrototype = SyntheticClipboardEvent.prototype;

SyntheticClipboardEventPrototype.destructor = function() {

    SyntheticEventPrototype.destructor.call(this);

    this.clipboardData = null;
};


},
function(require, exports, module, global) {

module.exports = getClipboardEvent;


function getClipboardEvent(obj, nativeEvent, eventHandler) {
    obj.clipboardData = getClipboardData(nativeEvent, eventHandler.window);
}

function getClipboardData(nativeEvent, window) {
    return nativeEvent.clipboardData != null ? nativeEvent.clipboardData : window.clipboardData;
}


},
function(require, exports, module, global) {

var inherits = require(50),
    createPool = require(28),
    getEvent = require(81);


var SyntheticEventPrototype;


module.exports = SyntheticEvent;


function SyntheticEvent(nativeEvent, eventHandler) {
    getEvent(this, nativeEvent, eventHandler);
}
createPool(SyntheticEvent);
SyntheticEventPrototype = SyntheticEvent.prototype;

SyntheticEvent.extend = function(child) {
    inherits(child, this);
    createPool(child);
    return child;
};

SyntheticEvent.create = function create(nativeTouch, eventHandler) {
    return this.getPooled(nativeTouch, eventHandler);
};

SyntheticEventPrototype.destructor = function() {
    this.nativeEvent = null;
    this.type = null;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = null;
    this.bubbles = null;
    this.cancelable = null;
    this.timeStamp = null;
    this.defaultPrevented = null;
    this.propagationStopped = null;
    this.isTrusted = null;
};

SyntheticEventPrototype.destroy = function() {
    this.constructor.release(this);
};

SyntheticEventPrototype.preventDefault = function() {
    var event = this.nativeEvent;

    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }

    this.defaultPrevented = true;
};

SyntheticEventPrototype.stopPropagation = function() {
    var event = this.nativeEvent;

    if (event.stopPropagation) {
        event.stopPropagation();
    } else {
        event.cancelBubble = false;
    }

    this.propagationStopped = true;
};

SyntheticEventPrototype.persist = function() {
    this.isPersistent = true;
};

SyntheticEventPrototype.stopImmediatePropagation = SyntheticEventPrototype.stopPropagation;


},
function(require, exports, module, global) {

var getEventTarget = require(73);


module.exports = getEvent;


function getEvent(obj, nativeEvent, eventHandler) {
    obj.nativeEvent = nativeEvent;
    obj.type = nativeEvent.type;
    obj.target = getEventTarget(nativeEvent, eventHandler.window);
    obj.currentTarget = nativeEvent.currentTarget;
    obj.eventPhase = nativeEvent.eventPhase;
    obj.bubbles = nativeEvent.bubbles;
    obj.cancelable = nativeEvent.cancelable;
    obj.timeStamp = nativeEvent.timeStamp;
    obj.defaultPrevented = (
        nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false
    );
    obj.propagationStopped = false;
    obj.isTrusted = nativeEvent.isTrusted;
}


},
function(require, exports, module, global) {

var getDragEvent = require(83),
    SyntheticMouseEvent = require(84);


var SyntheticMouseEventPrototype = SyntheticMouseEvent.prototype,
    SyntheticDragEventPrototype;


module.exports = SyntheticDragEvent;


function SyntheticDragEvent(nativeEvent, eventHandler) {

    SyntheticMouseEvent.call(this, nativeEvent, eventHandler);

    getDragEvent(this, nativeEvent, eventHandler);
}
SyntheticMouseEvent.extend(SyntheticDragEvent);
SyntheticDragEventPrototype = SyntheticDragEvent.prototype;

SyntheticDragEventPrototype.destructor = function() {

    SyntheticMouseEventPrototype.destructor.call(this);

    this.dataTransfer = null;
};


},
function(require, exports, module, global) {

module.exports = getDragEvent;


function getDragEvent(obj, nativeEvent) {
    obj.dataTransfer = nativeEvent.dataTransfer;
}


},
function(require, exports, module, global) {

var getMouseEvent = require(85),
    SyntheticUIEvent = require(86);


var SyntheticUIEventPrototype = SyntheticUIEvent.prototype,
    SyntheticMouseEventPrototype;


module.exports = SyntheticMouseEvent;


function SyntheticMouseEvent(nativeEvent, eventHandler) {

    SyntheticUIEvent.call(this, nativeEvent, eventHandler);

    getMouseEvent(this, nativeEvent, eventHandler);
}
SyntheticUIEvent.extend(SyntheticMouseEvent);
SyntheticMouseEventPrototype = SyntheticMouseEvent.prototype;

SyntheticMouseEventPrototype.getModifierState = require(88);

SyntheticMouseEventPrototype.destructor = function() {

    SyntheticUIEventPrototype.destructor.call(this);

    this.screenX = null;
    this.screenY = null;
    this.clientX = null;
    this.clientY = null;
    this.ctrlKey = null;
    this.shiftKey = null;
    this.altKey = null;
    this.metaKey = null;
    this.button = null;
    this.buttons = null;
    this.relatedTarget = null;
    this.pageX = null;
    this.pageY = null;
};


},
function(require, exports, module, global) {

module.exports = getMouseEvent;


function getMouseEvent(obj, nativeEvent, eventHandler) {
    obj.screenX = nativeEvent.screenX;
    obj.screenY = nativeEvent.screenY;
    obj.clientX = nativeEvent.clientX;
    obj.clientY = nativeEvent.clientY;
    obj.ctrlKey = nativeEvent.ctrlKey;
    obj.shiftKey = nativeEvent.shiftKey;
    obj.altKey = nativeEvent.altKey;
    obj.metaKey = nativeEvent.metaKey;
    obj.button = getButton(nativeEvent);
    obj.buttons = nativeEvent.buttons;
    obj.relatedTarget = getRelatedTarget(nativeEvent);
    obj.pageX = getPageX(nativeEvent, eventHandler.viewport);
    obj.pageY = getPageY(nativeEvent, eventHandler.viewport);
}

function getPageX(nativeEvent, viewport) {
    return nativeEvent.pageX != null ? nativeEvent.pageX : nativeEvent.clientX + viewport.currentScrollLeft;
}

function getPageY(nativeEvent, viewport) {
    return nativeEvent.pageX != null ? nativeEvent.pageY : nativeEvent.clientY + viewport.currentScrollTop;
}

function getRelatedTarget(nativeEvent) {
    return nativeEvent.relatedTarget || (
        nativeEvent.fromElement === nativeEvent.srcElement ? nativeEvent.toElement : nativeEvent.fromElement
    );
}

function getButton(nativeEvent) {
    var button = nativeEvent.button;

    return (
        nativeEvent.which != null ? button : (
            button === 2 ? 2 : button === 4 ? 1 : 0
        )
    );
}


},
function(require, exports, module, global) {

var getUIEvent = require(87),
    SyntheticEvent = require(80);


var SyntheticEventPrototype = SyntheticEvent.prototype,
    SyntheticUIEventPrototype;


module.exports = SyntheticUIEvent;


function SyntheticUIEvent(nativeEvent, eventHandler) {

    SyntheticEvent.call(this, nativeEvent, eventHandler);

    getUIEvent(this, nativeEvent, eventHandler);
}
SyntheticEvent.extend(SyntheticUIEvent);
SyntheticUIEventPrototype = SyntheticUIEvent.prototype;

SyntheticUIEventPrototype.destructor = function() {

    SyntheticEventPrototype.destructor.call(this);

    this.view = null;
    this.detail = null;
};


},
function(require, exports, module, global) {

var getWindow = require(67),
    getEventTarget = require(73);


module.exports = getUIEvent;


function getUIEvent(obj, nativeEvent, eventHandler) {
    obj.view = getView(nativeEvent, eventHandler);
    obj.detail = nativeEvent.detail || 0;
}

function getView(nativeEvent, eventHandler) {
    var target, document;

    if (nativeEvent.view) {
        return nativeEvent.view;
    } else {
        target = getEventTarget(nativeEvent, eventHandler.window);

        if (target != null && target.window === target) {
            return target;
        } else {
            document = target.ownerDocument;

            if (document) {
                return getWindow(document);
            } else {
                return eventHandler.window;
            }
        }
    }
}


},
function(require, exports, module, global) {

var modifierKeyToProp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
};


module.exports = getEventModifierState;


function getEventModifierState(keyArg) {
    var nativeEvent = this.nativeEvent,
        keyProp;

    if (nativeEvent.getModifierState != null) {
        return nativeEvent.getModifierState(keyArg);
    } else {
        keyProp = modifierKeyToProp[keyArg];
        return keyProp ? !!nativeEvent[keyProp] : false;
    }
}


},
function(require, exports, module, global) {

var getFocusEvent = require(90),
    SyntheticUIEvent = require(86);


var SyntheticUIEventPrototype = SyntheticUIEvent.prototype,
    SyntheticFocusEventPrototype;


module.exports = SyntheticFocusEvent;


function SyntheticFocusEvent(nativeEvent, eventHandler) {

    SyntheticUIEvent.call(this, nativeEvent, eventHandler);

    getFocusEvent(this, nativeEvent, eventHandler);
}
SyntheticUIEvent.extend(SyntheticFocusEvent);
SyntheticFocusEventPrototype = SyntheticFocusEvent.prototype;

SyntheticFocusEventPrototype.destructor = function() {

    SyntheticUIEventPrototype.destructor.call(this);

    this.relatedTarget = null;
};


},
function(require, exports, module, global) {

module.exports = getFocusEvent;


function getFocusEvent(obj, nativeEvent) {
    obj.relatedTarget = nativeEvent.relatedTarget;
}


},
function(require, exports, module, global) {

var getInputEvent = require(92),
    SyntheticEvent = require(80);


var SyntheticEventPrototype = SyntheticEvent.prototype,
    SyntheticInputEventPrototype;


module.exports = SyntheticInputEvent;


function SyntheticInputEvent(nativeEvent, eventHandler) {

    SyntheticEvent.call(this, nativeEvent, eventHandler);

    getInputEvent(this, nativeEvent, eventHandler);
}
SyntheticEvent.extend(SyntheticInputEvent);
SyntheticInputEventPrototype = SyntheticInputEvent.prototype;

SyntheticInputEventPrototype.destructor = function() {

    SyntheticEventPrototype.destructor.call(this);

    this.data = null;
};


},
function(require, exports, module, global) {

module.exports = getInputEvent;


function getInputEvent(obj, nativeEvent) {
    obj.data = nativeEvent.data;
}


},
function(require, exports, module, global) {

var getKeyboardEvent = require(94),
    SyntheticUIEvent = require(86);


var SyntheticUIEventPrototype = SyntheticUIEvent.prototype,
    SynthetiKeyboardEventPrototype;


module.exports = SynthetiKeyboardEvent;


function SynthetiKeyboardEvent(nativeEvent, eventHandler) {

    SyntheticUIEvent.call(this, nativeEvent, eventHandler);

    getKeyboardEvent(this, nativeEvent, eventHandler);
}
SyntheticUIEvent.extend(SynthetiKeyboardEvent);
SynthetiKeyboardEventPrototype = SynthetiKeyboardEvent.prototype;

SynthetiKeyboardEventPrototype.getModifierState = require(88);

SynthetiKeyboardEventPrototype.destructor = function() {

    SyntheticUIEventPrototype.destructor.call(this);

    this.key = null;
    this.location = null;
    this.ctrlKey = null;
    this.shiftKey = null;
    this.altKey = null;
    this.metaKey = null;
    this.repeat = null;
    this.locale = null;
    this.charCode = null;
    this.keyCode = null;
    this.which = null;
};


},
function(require, exports, module, global) {

var getEventKey = require(95),
    getEventCharCode = require(96);


module.exports = getKeyboardEvent;


function getKeyboardEvent(obj, nativeEvent) {
    obj.key = getEventKey(nativeEvent);
    obj.location = nativeEvent.location;
    obj.ctrlKey = nativeEvent.ctrlKey;
    obj.shiftKey = nativeEvent.shiftKey;
    obj.altKey = nativeEvent.altKey;
    obj.metaKey = nativeEvent.metaKey;
    obj.repeat = nativeEvent.repeat;
    obj.locale = nativeEvent.locale;
    obj.charCode = getCharCode(nativeEvent);
    obj.keyCode = getKeyCode(nativeEvent);
    obj.which = getWhich(nativeEvent);
}

function getCharCode(nativeEvent) {
    return nativeEvent.type === "keypress" ? getEventCharCode(nativeEvent) : 0;
}

function getKeyCode(nativeEvent) {
    var type = nativeEvent.type;

    return type === "keydown" || type === "keyup" ? nativeEvent.keyCode : 0;
}

function getWhich(nativeEvent) {
    var type = nativeEvent.type;

    return type === "keypress" ? getEventCharCode(event) : (
        type === "keydown" || type === "keyup" ? nativeEvent.keyCode : 0
    );
}


},
function(require, exports, module, global) {

var getEventCharCode = require(96);


var normalizeKey, translateToKey;


module.exports = getEventKey;


normalizeKey = {
    "Esc": "Escape",
    "Spacebar": " ",
    "Left": "ArrowLeft",
    "Up": "ArrowUp",
    "Right": "ArrowRight",
    "Down": "ArrowDown",
    "Del": "Delete",
    "Win": "OS",
    "Menu": "ContextMenu",
    "Apps": "ContextMenu",
    "Scroll": "ScrollLock",
    "MozPrintableKey": "Unidentified"
};

translateToKey = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
};


function getEventKey(nativeEvent) {
    var key, charCode;

    if (nativeEvent.key) {
        key = normalizeKey[nativeEvent.key] || nativeEvent.key;

        if (key !== "Unidentified") {
            return key;
        }
    }

    if (nativeEvent.type === "keypress") {
        charCode = getEventCharCode(nativeEvent);

        return charCode === 13 ? "Enter" : String.fromCharCode(charCode);
    }
    if (nativeEvent.type === "keydown" || nativeEvent.type === "keyup") {
        return translateToKey[nativeEvent.keyCode] || "Unidentified";
    }

    return "";
}


},
function(require, exports, module, global) {

module.exports = getEventCharCode;


function getEventCharCode(nativeEvent) {
    var keyCode = nativeEvent.keyCode,
        charCode;

    if (nativeEvent.charCode != null) {
        charCode = nativeEvent.charCode;

        if (charCode === 0 && keyCode === 13) {
            charCode = 13;
        }
    } else {
        charCode = keyCode;
    }

    if (charCode >= 32 || charCode === 13) {
        return charCode;
    } else {
        return 0;
    }
}


},
function(require, exports, module, global) {

var getTouchEvent = require(98),
    SyntheticUIEvent = require(86),
    SyntheticTouch = require(99);


var SyntheticUIEventPrototype = SyntheticUIEvent.prototype,
    SyntheticTouchEventPrototype;


module.exports = SyntheticTouchEvent;


function SyntheticTouchEvent(nativeEvent, eventHandler) {

    SyntheticUIEvent.call(this, nativeEvent, eventHandler);

    this.touches = createTouches(this.touches || [], nativeEvent.touches, eventHandler);
    this.targetTouches = createTouches(this.targetTouches || [], nativeEvent.targetTouches, eventHandler);
    this.changedTouches = createTouches(this.changedTouches || [], nativeEvent.changedTouches, eventHandler);

    getTouchEvent(this, nativeEvent, eventHandler);
}
SyntheticUIEvent.extend(SyntheticTouchEvent);
SyntheticTouchEventPrototype = SyntheticTouchEvent.prototype;

SyntheticTouchEventPrototype.getModifierState = require(88);

SyntheticTouchEventPrototype.destructor = function() {

    SyntheticUIEventPrototype.destructor.call(this);

    destroyTouches(this.touches);
    destroyTouches(this.targetTouches);
    destroyTouches(this.changedTouches);

    this.altKey = null;
    this.metaKey = null;
    this.ctrlKey = null;
    this.shiftKey = null;
};

function createTouches(touches, nativeTouches, eventHandler) {
    var i = -1,
        il = nativeTouches.length - 1;

    while (i++ < il) {
        touches[i] = SyntheticTouch.create(nativeTouches[i], eventHandler);
    }

    return touches;
}

function destroyTouches(touches) {
    var i;

    while (i--) {
        touches[i].destroy();
    }
    touches.length = 0;

    return touches;
}


},
function(require, exports, module, global) {

module.exports = getTouchEvent;


function getTouchEvent(obj, nativeEvent) {
    obj.altKey = nativeEvent.altKey;
    obj.metaKey = nativeEvent.metaKey;
    obj.ctrlKey = nativeEvent.ctrlKey;
    obj.shiftKey = nativeEvent.shiftKey;
}


},
function(require, exports, module, global) {

var getTouch = require(100),
    createPool = require(28);


var SyntheticTouchPrototype;


module.exports = SyntheticTouch;


function SyntheticTouch(nativeTouch, eventHandler) {
    getTouch(this, nativeTouch, eventHandler);
}
createPool(SyntheticTouch);
SyntheticTouchPrototype = SyntheticTouch.prototype;

SyntheticTouch.create = function(nativeTouch, eventHandler) {
    return this.getPooled(nativeTouch, eventHandler);
};

SyntheticTouchPrototype.destroy = function(instance) {
    SyntheticTouch.release(instance);
};

SyntheticTouchPrototype.destructor = function() {
    this.nativeTouch = null;
    this.identifier = null;
    this.screenX = null;
    this.screenY = null;
    this.clientX = null;
    this.clientY = null;
    this.pageX = null;
    this.pageY = null;
    this.radiusX = null;
    this.radiusY = null;
    this.rotationAngle = null;
    this.force = null;
    this.target = null;
};


},
function(require, exports, module, global) {

module.exports = getTouch;


function getTouch(obj, nativeTouch, eventHandler) {
    obj.nativeTouch = nativeTouch;
    obj.identifier = nativeTouch.identifier;
    obj.screenX = nativeTouch.screenX;
    obj.screenY = nativeTouch.screenY;
    obj.clientX = nativeTouch.clientX;
    obj.clientY = nativeTouch.clientY;
    obj.pageX = getPageX(nativeTouch, eventHandler.viewport);
    obj.pageY = getPageY(nativeTouch, eventHandler.viewport);
    obj.radiusX = getRadiusX(nativeTouch);
    obj.radiusY = getRadiusY(nativeTouch);
    obj.rotationAngle = getRotationAngle(nativeTouch);
    obj.force = getForce(nativeTouch);
    obj.target = nativeTouch.target;
}

function getPageX(nativeTouch, viewport) {
    return nativeTouch.pageX != null ? nativeTouch.pageX : nativeTouch.clientX + viewport.currentScrollLeft;
}

function getPageY(nativeTouch, viewport) {
    return nativeTouch.pageX != null ? nativeTouch.pageY : nativeTouch.clientY + viewport.currentScrollTop;
}

function getRadiusX(nativeTouch) {
    return (
        nativeTouch.radiusX != null ? nativeTouch.radiusX :
        nativeTouch.webkitRadiusX != null ? nativeTouch.webkitRadiusX :
        nativeTouch.mozRadiusX != null ? nativeTouch.mozRadiusX :
        nativeTouch.msRadiusX != null ? nativeTouch.msRadiusX :
        nativeTouch.oRadiusX != null ? nativeTouch.oRadiusX :
        0
    );
}

function getRadiusY(nativeTouch) {
    return (
        nativeTouch.radiusY != null ? nativeTouch.radiusY :
        nativeTouch.webkitRadiusY != null ? nativeTouch.webkitRadiusY :
        nativeTouch.mozRadiusY != null ? nativeTouch.mozRadiusY :
        nativeTouch.msRadiusY != null ? nativeTouch.msRadiusY :
        nativeTouch.oRadiusY != null ? nativeTouch.oRadiusY :
        0
    );
}

function getRotationAngle(nativeTouch) {
    return (
        nativeTouch.rotationAngle != null ? nativeTouch.rotationAngle :
        nativeTouch.webkitRotationAngle != null ? nativeTouch.webkitRotationAngle :
        nativeTouch.mozRotationAngle != null ? nativeTouch.mozRotationAngle :
        nativeTouch.msRotationAngle != null ? nativeTouch.msRotationAngle :
        nativeTouch.oRotationAngle != null ? nativeTouch.oRotationAngle :
        0
    );
}

function getForce(nativeTouch) {
    return (
        nativeTouch.force != null ? nativeTouch.force :
        nativeTouch.webkitForce != null ? nativeTouch.webkitForce :
        nativeTouch.mozForce != null ? nativeTouch.mozForce :
        nativeTouch.msForce != null ? nativeTouch.msForce :
        nativeTouch.oForce != null ? nativeTouch.oForce :
        1
    );
}


},
function(require, exports, module, global) {

var getWheelEvent = require(102),
    SyntheticMouseEvent = require(84);


var SyntheticMouseEventPrototype = SyntheticMouseEvent.prototype,
    SyntheticWheelEventPrototype;


module.exports = SyntheticWheelEvent;


function SyntheticWheelEvent(nativeEvent, eventHandler) {

    SyntheticMouseEvent.call(this, nativeEvent, eventHandler);

    getWheelEvent(this, nativeEvent, eventHandler);
}
SyntheticMouseEvent.extend(SyntheticWheelEvent);
SyntheticWheelEventPrototype = SyntheticWheelEvent.prototype;

SyntheticWheelEventPrototype.destructor = function() {

    SyntheticMouseEventPrototype.destructor.call(this);

    this.deltaX = null;
    this.deltaY = null;
    this.deltaZ = null;
    this.deltaMode = null;
};


},
function(require, exports, module, global) {

module.exports = getWheelEvent;


function getWheelEvent(obj, nativeEvent) {
    obj.deltaX = getDeltaX(nativeEvent);
    obj.deltaY = getDeltaY(nativeEvent);
    obj.deltaZ = nativeEvent.deltaZ;
    obj.deltaMode = nativeEvent.deltaMode;
}

function getDeltaX(nativeEvent) {
    return nativeEvent.deltaX != null ? nativeEvent.deltaX : (
        nativeEvent.wheelDeltaX != null ? -nativeEvent.wheelDeltaX : 0
    );
}

function getDeltaY(nativeEvent) {
    return nativeEvent.deltaY != null ? nativeEvent.deltaY : (
        nativeEvent.wheelDeltaY != null ? -nativeEvent.wheelDeltaY : (
            nativeEvent.wheelDelta != null ? -nativeEvent.wheelDelta : 0
        )
    );
}


},
function(require, exports, module, global) {

var has = require(18);


module.exports = applyEvents;


function applyEvents(events, eventHandler) {
    var localHas = has,
        id;

    for (id in events) {
        if (localHas(events, id)) {
            eventHandler.listenTo(id, events[id]);
        }
    }
}


},
function(require, exports, module, global) {

var getNodeById = require(68),
    applyPatch = require(105);


module.exports = applyPatches;


function applyPatches(hash, rootDOMNode, document) {
    var id;

    for (id in hash) {
        if (hash[id] !== undefined) {
            applyPatchIndices(getNodeById(id) || rootDOMNode, hash[id], id, document);
        }
    }
}

function applyPatchIndices(DOMNode, patchArray, id, document) {
    var i = -1,
        length = patchArray.length - 1;

    while (i++ < length) {
        applyPatch(patchArray[i], DOMNode, id, document);
    }
}


},
function(require, exports, module, global) {

var consts = require(106),
    createDOMElement = require(107),
    renderString = require(110),
    renderChildrenString = require(113),
    addDOMNodes = require(114),
    removeDOMNodes = require(117),
    getNodeById = require(68),
    applyProperties = require(108);



module.exports = applyPatch;


function applyPatch(patch, node, id, document) {
    switch (patch.type) {
        case consts.REMOVE:
            remove(node, patch.childId, patch.index);
            break;
        case consts.MOUNT:
            mount(node, patch.next, id);
            break;
        case consts.INSERT:
            insert(node, patch.childId, patch.index, patch.next, document);
            break;
        case consts.TEXT:
            text(node, patch.index, patch.next);
            break;
        case consts.REPLACE:
            replace(node, patch.childId, patch.index, patch.next, document);
            break;
        case consts.ORDER:
            order(node, patch.order);
            break;
        case consts.PROPS:
            applyProperties(node, patch.id, patch.next, patch.previous);
            break;
    }
}

function remove(parentNode, id, index) {
    var node;

    if (id === null) {
        node = parentNode.childNodes[index];
    } else {
        node = getNodeById(id);
        removeDOMNodes(node.childNodes);
    }

    if (parentNode !== node) {
        parentNode.removeChild(node);
    } else {
        node.parentNode.removeChild(node);
    }
}

function mount(parentNode, view, id) {
    parentNode.innerHTML = renderString(view, null, id);
    addDOMNodes(parentNode.childNodes);
}

function insert(parentNode, id, index, view, document) {
    var node = createDOMElement(view, id, document, false);

    if (view.children) {
        node.innerHTML = renderChildrenString(view.children, view.props, id);
        addDOMNodes(node.childNodes);
    }

    parentNode.appendChild(node);
}

function text(parentNode, index, value) {
    var textNode = parentNode.childNodes[index];

    if (textNode) {
        textNode.nodeValue = value;
    }
}

function replace(parentNode, id, index, view, document) {
    var node = createDOMElement(view, id, document, false);

    if (view.children) {
        node.innerHTML = renderChildrenString(view.children, view.props, id);
        addDOMNodes(node.childNodes);
    }

    parentNode.replaceChild(node, parentNode.childNodes[index]);
}

var order_children = [];

function order(parentNode, orderIndex) {
    var children = order_children,
        childNodes = parentNode.childNodes,
        reverseIndex = orderIndex.reverse,
        removes = orderIndex.removes,
        insertOffset = 0,
        i = -1,
        length = childNodes.length - 1,
        move, node, insertNode;

    children.length = length;
    while (i++ < length) {
        children[i] = childNodes[i];
    }

    i = -1;
    while (i++ < length) {
        move = orderIndex[i];

        if (move !== undefined && move !== i) {
            if (reverseIndex[i] > i) {
                insertOffset++;
            }

            node = children[move];
            insertNode = childNodes[i + insertOffset] || null;

            if (node !== insertNode) {
                parentNode.insertBefore(node, insertNode);
            }

            if (move < i) {
                insertOffset--;
            }
        }

        if (removes[i] != null) {
            insertOffset++;
        }
    }
}


},
function(require, exports, module, global) {

var keyMirror = require(32);


module.exports = keyMirror([
    "TEXT",
    "REPLACE",
    "PROPS",
    "ORDER",
    "INSERT",
    "MOUNT",
    "REMOVE"
]);


},
function(require, exports, module, global) {

var isString = require(15),

    DOM_ID_NAME = require(75),
    nodeCache = require(69),

    applyProperties = require(108),

    virt = require(8),
    getViewKey = require(109);


var View = virt.View,
    isPrimativeView = View.isPrimativeView;


module.exports = createDOMElement;


function createDOMElement(view, id, document, recurse) {
    var node, children, i, length, child;

    if (isPrimativeView(view)) {
        return document.createTextNode(view);
    } else if (isString(view.type)) {
        node = document.createElement(view.type);

        applyProperties(node, id, view.props, undefined);

        node.setAttribute(DOM_ID_NAME, id);
        nodeCache[id] = node;

        if (recurse !== false) {
            children = view.children;
            i = -1;
            length = children.length - 1;

            while (i++ < length) {
                child = children[i];
                node.appendChild(createDOMElement(child, id + "." + getViewKey(child, i), document));
            }
        }

        return node;
    } else {
        throw new TypeError("Arguments is not a valid view");
    }
}


},
function(require, exports, module, global) {

var isString = require(15),
    isObject = require(4),
    isFunction = require(5),
    getPrototypeOf = require(57);


module.exports = applyProperties;


function applyProperties(node, id, props, previous) {
    var propKey, propValue;

    for (propKey in props) {
        propValue = props[propKey];

        if (propKey !== "dangerouslySetInnerHTML" || !isFunction(propValue)) {
            if (propValue == null && previous != null) {
                removeProperty(node, id, previous, propKey);
            } else if (isObject(propValue)) {
                applyObject(node, previous, propKey, propValue);
            } else if (propValue != null && (!previous || previous[propKey] !== propValue)) {
                applyProperty(node, id, propKey, propValue);
            }
        }
    }
}

function applyProperty(node, id, propKey, propValue) {
    if (propKey !== "className" && node.setAttribute) {
        node.setAttribute(propKey, propValue);
    } else {
        node[propKey] = propValue;
    }
}

function removeProperty(node, id, previous, propKey) {
    var canRemoveAttribute = !!node.removeAttribute,
        previousValue = previous[propKey],
        keyName, style;

    if (propKey === "attributes") {
        for (keyName in previousValue) {
            if (canRemoveAttribute) {
                node.removeAttribute(keyName);
            } else {
                node[keyName] = isString(previousValue[keyName]) ? "" : null;
            }
        }
    } else if (propKey === "style") {
        style = node.style;

        for (keyName in previousValue) {
            style[keyName] = "";
        }
    } else {
        if (propKey !== "className" && canRemoveAttribute) {
            node.removeAttribute(propKey);
        } else {
            node[propKey] = isString(previousValue) ? "" : null;
        }
    }
}

function applyObject(node, previous, propKey, propValues) {
    var previousValue, key, value, nodeProps, replacer;

    if (propKey === "attributes") {
        for (key in propValues) {
            value = propValues[key];

            if (value === undefined) {
                node.removeAttribute(key);
            } else {
                node.setAttribute(key, value);
            }
        }

        return;
    }

    previousValue = previous ? previous[propKey] : undefined;

    if (
        previousValue != null &&
        isObject(previousValue) &&
        getPrototypeOf(previousValue) !== getPrototypeOf(propValues)
    ) {
        node[propKey] = propValues;
        return;
    }

    nodeProps = node[propKey];

    if (!isObject(nodeProps)) {
        nodeProps = node[propKey] = {};
    }

    replacer = propKey === "style" ? "" : undefined;

    for (key in propValues) {
        value = propValues[key];
        nodeProps[key] = (value === undefined) ? replacer : value;
    }
}


},
function(require, exports, module, global) {

var isNullOrUndefined = require(11);


var reEscape = /[=.:]/g;


module.exports = getViewKey;


function getViewKey(view, index) {
    var key = view.key;

    if (isNullOrUndefined(key)) {
        return index.toString(36);
    } else {
        return "$" + escapeKey(key);
    }
}

function escapeKey(key) {
    return (key + "").replace(reEscape, "$");
}


},
function(require, exports, module, global) {

var virt = require(8),
    getChildKey = require(111),

    escapeTextContent = require(112),
    isFunction = require(5),
    map = require(19),
    isString = require(15),
    isObject = require(4),
    isNullOrUndefined = require(11),

    DOM_ID_NAME = require(75);


var View = virt.View,
    isPrimativeView = View.isPrimativeView,

    closedTags = {
        area: true,
        base: true,
        br: true,
        col: true,
        command: true,
        embed: true,
        hr: true,
        img: true,
        input: true,
        keygen: true,
        link: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true
    };


module.exports = render;


function render(view, parentProps, id) {
    var type, props;

    if (isPrimativeView(view)) {
        return isString(view) ? contentMarkup(view, parentProps) : view + "";
    } else {
        type = view.type;
        props = view.props;

        return (
            closedTags[type] !== true ?
            contentTag(type, map(view.children, function(child, i) {
                return render(child, props, getChildKey(id, child, i));
            }).join(""), id, view.props) :
            closedTag(type, id, view.props)
        );
    }
}

function contentMarkup(content, props) {
    if (props && props.dangerouslySetInnerHTML !== true) {
        return escapeTextContent(content);
    } else {
        return content;
    }
}

function baseTagOptions(id, props) {
    var attributes = "",
        key, value;

    for (key in props) {
        if (key !== "dangerouslySetInnerHTML") {
            value = props[key];

            if (!isNullOrUndefined(value) && !isFunction(value)) {
                if (key === "className") {
                    key = "class";
                }

                if (isObject(value)) {
                    attributes += baseTagOptions(value);
                } else {
                    attributes += key + '="' + value + '" ';
                }
            }
        }
    }

    return attributes;
}

function tagOptions(id, props) {
    var attributes = baseTagOptions(id, props);
    return attributes !== "" ? " " + attributes : attributes;
}

function dataId(id) {
    return ' ' + DOM_ID_NAME + '="' + id + '"';
}

function closedTag(type, id, props) {
    return "<" + type + (isObject(props) ? tagOptions(id, props) : "") + dataId(id) + "/>";
}

function contentTag(type, content, id, props) {
    return (
        "<" + type + (isObject(props) ? tagOptions(id, props) : "") + dataId(id) + ">" +
        (isString(content) ? content : "") +
        "</" + type + ">"
    );
}


},
function(require, exports, module, global) {

var getViewKey = require(109);


module.exports = getChildKey;


function getChildKey(parentId, child, index) {
    return parentId + "." + getViewKey(child, index);
}


},
function(require, exports, module, global) {

var ESCAPE_REGEX = /[&><"']/g,
    ESCAPE_LOOKUP = {
        "&": "&amp;",
        ">": "&gt;",
        "<": "&lt;",
        "\"": "&quot;",
        "'": "&#x27;"
    };


function escaper(match) {
    return ESCAPE_LOOKUP[match];
}

module.exports = function escapeTextContent(text) {
    return (text + "").replace(ESCAPE_REGEX, escaper);
};


},
function(require, exports, module, global) {

var getChildKey = require(111),
    map = require(19),
    renderString = require(110);



module.exports = renderChildrenString;


function renderChildrenString(children, props, id) {
    return map(children, function(view, index) {
        return renderString(view, props, getChildKey(id, view, index));
    });
}


},
function(require, exports, module, global) {

var isElement = require(115),
    getNodeId = require(116);


module.exports = addDOMNodes;


function addDOMNodes(nodes) {
    var i = -1,
        il = nodes.length - 1;

    while (i++ < il) {
        addDOMNode(nodes[i]);
    }
}

function addDOMNode(node) {
    if (isElement(node)) {
        getNodeId(node);
        addDOMNodes(node.childNodes);
    }
}


},
function(require, exports, module, global) {

var isNode = require(7);


module.exports = function isElement(obj) {
    return isNode(obj) && obj.nodeType === 1;
};


},
function(require, exports, module, global) {

var has = require(18),
    nodeCache = require(69),
    getNodeAttributeId = require(74);


module.exports = getNodeId;


function getNodeId(node) {
    return node && getId(node);
}

function getId(node) {
    var id = getNodeAttributeId(node),
        cached;

    if (id) {
        if (has(nodeCache, id)) {
            cached = nodeCache[id];

            if (cached !== node) {
                nodeCache[id] = node;
            }
        } else {
            nodeCache[id] = node;
        }
    }

    return id;
}


},
function(require, exports, module, global) {

var isElement = require(115),
    nodeCache = require(69),
    getNodeAttributeId = require(74);


module.exports = removeDOMNodes;


function removeDOMNodes(nodes) {
    var i = -1,
        il = nodes.length - 1;

    while (i++ < il) {
        removeDOMNode(nodes[i]);
    }
}

function removeDOMNode(node) {
    if (isElement(node)) {
        delete nodeCache[getNodeAttributeId(node)];
        removeDOMNodes(node.childNodes);
    }
}


},
function(require, exports, module, global) {

module.exports = getRootNodeInContainer;


function getRootNodeInContainer(containerNode) {
    if (!containerNode) {
        return null;
    } else {
        if (containerNode.nodeType === 9) {
            return containerNode.documentElement;
        } else {
            return containerNode.firstChild;
        }
    }
}


},
function(require, exports, module, global) {

var isString = require(15),
    getNodeById = require(68);


module.exports = findDOMNode;


function findDOMNode(value) {
    if (isString(value)) {
        return getNodeById(value);
    } else if (value && value.__node) {
        return getNodeById(value.__node.id);
    } else if (value && value.id) {
        return getNodeById(value.id);
    } else {
        return null;
    }
}


},
function(require, exports, module, global) {

var MessengerWorker = require(121),
    has = require(18),
    isNode = require(7),
    isFunction = require(5),
    getWindow = require(67),
    EventHandler = require(72),
    applyEvents = require(103),
    applyPatches = require(104);


var ignoreNativeEventProp = {
    path: true,
    view: true
};


module.exports = createWorkerRender;


function createWorkerRender(url, containerDOMNode) {
    var document = containerDOMNode.ownerDocument,
        window = getWindow(document),

        eventHandler = new EventHandler(document, window),
        viewport = eventHandler.viewport,

        messenger = new MessengerWorker(url);

    messenger.on("handle_transaction", function(transaction, callback) {

        applyPatches(transaction.patches, containerDOMNode, document);
        applyEvents(transaction.events, eventHandler);
        applyPatches(transaction.removes, containerDOMNode, document);

        callback();
    });

    eventHandler.handleDispatch = function(topLevelType, nativeEvent, targetId) {
        if (targetId) {
            nativeEvent.preventDefault();
        }

        messenger.emit("handle_event_dispatch", {
            currentScrollLeft: viewport.currentScrollLeft,
            currentScrollTop: viewport.currentScrollTop,
            topLevelType: topLevelType,
            nativeEvent: nativeEventToJSON(nativeEvent),
            targetId: targetId
        });
    };

    return messenger;
}

function nativeEventToJSON(nativeEvent) {
    var json = {},
        localHas = has,
        key, value;


    for (key in nativeEvent) {
        if (localHas(nativeEvent, key)) {
            value = nativeEvent[key];

            if (ignoreNativeEventProp[key] !== true && !isNode(value) && !isFunction(value)) {
                json[key] = value;
            }
        }
    }

    return json;
}


},
function(require, exports, module, global) {

var environment = require(1);


var globalWorker;


if (environment.worker) {
    globalWorker = self;
}


module.exports = MessengerWorker;


function MessengerWorker(url) {
    var MESSAGE_ID = 0,
        worker = environment.worker ? globalWorker : new Worker(url),
        listeners = {},
        messages = {};

    worker.onmessage = function(e) {
        var message = JSON.parse(e.data),
            id = message.id,
            name = message.name,
            callback = messages[id];

        if (name) {
            if (listeners[name]) {
                emit(listeners[name], message.data, function callback(err, data) {
                    worker.postMessage(JSON.stringify({
                        id: id,
                        data: data
                    }));
                });
            }
        } else {
            if (callback) {
                callback(message.error, message.data);
                delete messages[id];
            }
        }
    };

    this.emit = function(name, data, callback) {
        var id = MESSAGE_ID++;

        messages[id] = callback;

        worker.postMessage(JSON.stringify({
            id: id,
            name: name,
            data: data
        }));
    };

    this.on = function(name, callback) {
        var listener = listeners[name] || (listeners[name] = []);
        listener[listener.length] = callback;
    };

    this.off = function(name, callback) {
        var listener = listeners[name],
            i;

        if (listener) {
            i = listener.length;

            while (i--) {
                if (listener[i] === callback) {
                    listener.splice(i, 1);
                }
            }
        }
    };
}

function emit(listeners, data, callback) {
    var index = 0,
        length = listeners.length,
        called = false;

    function done(err, data) {
        if (called === false) {
            called = true;
            callback(err, data);
        }
    }

    function next(err, data) {
        if (err || index === length) {
            done(err, data);
        } else {
            listeners[index++](data, next);
        }
    }

    next(undefined, data);
}


},
function(require, exports, module, global) {

var virt = require(8),
    WorkerAdaptor = require(123);


var ComponentPrototype = virt.Component.prototype,
    root = null;


module.exports = render;


function render(nextView) {
    if (root === null) {
        root = new virt.Root();
        root.adaptor = new WorkerAdaptor(root);

        ComponentPrototype.emitMessage = emitMessage;
        ComponentPrototype.onMessage = onMessage;
        ComponentPrototype.offMessage = offMessage;
    }

    root.render(nextView);
}

render.unmount = function() {
    if (root !== null) {
        root.unmount();
        root = null;
    }
};


function emitMessage(name, data, callback) {
    return this.__node.root.adaptor.messenger.emit(name, data, callback);
}

function onMessage(name, callback) {
    return this.__node.root.adaptor.messenger.on(name, callback);
}

function offMessage(name, callback) {
    return this.__node.root.adaptor.messenger.off(name, callback);
}


},
function(require, exports, module, global) {

var MessengerWorker = require(121),
    traverseAncestors = require(63),
    consts = require(70),
    eventClassMap = require(77);


module.exports = WorkerAdaptor;


function WorkerAdaptor(root) {
    var messenger = new MessengerWorker(),
        eventManager = root.eventManager,
        viewport = {
            currentScrollLeft: 0,
            currentScrollTop: 0
        },
        eventHandler = {
            window: global,
            document: global,
            viewport: viewport
        },
        events = eventManager.events;

    this.root = root;
    this.messenger = messenger;

    eventManager.propNameToTopLevel = consts.propNameToTopLevel;

    messenger.on("handle_event_dispatch", function(data, callback) {
        var childHash = root.childHash,
            topLevelType = data.topLevelType,
            nativeEvent = data.nativeEvent,
            targetId = data.targetId,
            eventType = events[topLevelType],
            target = childHash[targetId],
            event;

        if (target) {
            target = target.component;
        } else {
            target = null;
        }

        viewport.currentScrollLeft = data.currentScrollLeft;
        viewport.currentScrollTop = data.currentScrollTop;

        traverseAncestors(targetId, function(currentTargetId) {
            if (eventType[currentTargetId]) {
                event = event || eventClassMap[topLevelType].getPooled(nativeEvent, eventHandler);
                event.target = target;
                event.currentTarget = childHash[currentTargetId].component;
                eventType[currentTargetId](event);
                return event.returnValue;
            } else {
                return true;
            }
        });

        if (event && event.isPersistent !== true) {
            event.destroy();
        }

        callback(undefined);
    });

    this.handle = function(transaction, callback) {
        messenger.emit("handle_transaction", transaction, callback);
    };
}


},
function(require, exports, module, global) {

var virt = require(8),
    propTypes = require(125),
    TodoList = require(128),
    TodoForm = require(145);


var AppPrototype;


module.exports = App;


function App(props, children, context) {
    virt.Component.call(this, props, children, context);
}
virt.Component.extend(App, "App");
AppPrototype = App.prototype;

App.childContextTypes = {
    ctx: propTypes.object
};

AppPrototype.getChildContext = function() {
    return {
        ctx: {
            pathname: location.pathname
        }
    };
};

AppPrototype.render = function() {
    return (
        virt.createView("div", {
                className: "app"
            },
            virt.createView(TodoForm),
            virt.createView(TodoList)
        )
    );
};


},
function(require, exports, module, global) {

var isArray = require(12),
    isRegExp = require(126),
    isNullOrUndefined = require(11),
    emptyFunction = require(127),
    isFunction = require(5),
    has = require(18),
    indexOf = require(43);


var propTypes = exports,
    ANONYMOUS_CALLER = "<<anonymous>>";


propTypes.array = createPrimitiveTypeChecker("array");
propTypes.bool = createPrimitiveTypeChecker("boolean");
propTypes.func = createPrimitiveTypeChecker("function");
propTypes.number = createPrimitiveTypeChecker("number");
propTypes.object = createPrimitiveTypeChecker("object");
propTypes.string = createPrimitiveTypeChecker("string");

propTypes.regexp = createTypeChecker(function validate(props, propName, callerName) {
    var propValue = props[propName];

    if (isRegExp(propValue)) {
        return null;
    } else {
        return new TypeError(
            "Invalid " + propName + " of value " + propValue + " supplied to " + callerName + ", " +
            "expected RexExp."
        );
    }
});

propTypes.instanceOf = function createInstanceOfCheck(expectedClass) {
    return createTypeChecker(function validate(props, propName, callerName) {
        var propValue = props[propName],
            expectedClassName;

        if (propValue instanceof expectedClass) {
            return null;
        } else {
            expectedClassName = expectedClass.name || ANONYMOUS_CALLER;

            return new TypeError(
                "Invalid " + propName + " of type " + getPreciseType(propValue) + " supplied to " + callerName + ", " +
                "expected instance of " + expectedClassName + "."
            );
        }
    });
};

propTypes.any = createTypeChecker(emptyFunction.thatReturnsNull);

propTypes.oneOf = function createOneOfCheck(expectedValues) {
    return createTypeChecker(function validate(props, propName, callerName) {
        var propValue = props[propName];

        if (indexOf(expectedValues, propValue) !== -1) {
            return null;
        } else {
            return new TypeError(
                "Invalid " + propName + " of value " + propValue + " supplied to " + callerName + ", " +
                "expected one of " + JSON.stringify(expectedValues) + "."
            );
        }
    });
};

propTypes.implement = function createImplementCheck(expectedInterface) {
    var key;

    for (key in expectedInterface) {
        if (has(expectedInterface, key) && !isFunction(expectedInterface[key])) {
            throw new TypeError(
                "Invalid Interface value " + key + ", must be functions " +
                "(props : Object, propName : String[, callerName : String]) return Error or null."
            );
        }
    }

    return createTypeChecker(function validate(props, propName, callerName) {
        var results = null,
            propInterface = props[propName],
            propKey, propValidate, result;

        for (propKey in propInterface) {
            if (has(propInterface, propKey)) {
                propValidate = expectedInterface[propKey];
                result = propValidate(propInterface, propKey, callerName + "." + propKey);

                if (result) {
                    results = results || [];
                    results[results.length] = result;
                }
            }
        }

        return results;
    });
};


propTypes.createTypeChecker = createTypeChecker;


function createTypeChecker(validate) {

    function checkType(props, propName, callerName) {
        if (isNullOrUndefined(props[propName])) {
            return null;
        } else {
            return validate(props, propName, callerName || ANONYMOUS_CALLER);
        }
    }

    checkType.isRequired = function checkIsRequired(props, propName, callerName) {
        callerName = callerName || ANONYMOUS_CALLER;

        if (isNullOrUndefined(props[propName])) {
            return new TypeError(
                "Required " + propName + " was not specified in " + callerName + "."
            );
        } else {
            return validate(props, propName, callerName);
        }
    };

    return checkType;
}

function createPrimitiveTypeChecker(expectedType) {
    return createTypeChecker(function validate(props, propName, callerName) {
        var propValue = props[propName],
            type = getPropType(propValue);

        if (type !== expectedType) {
            callerName = callerName || ANONYMOUS_CALLER;

            return new TypeError(
                "Invalid " + propName + " of type " + getPreciseType(propValue) + " " +
                "supplied to " + callerName + " expected " + expectedType + "."
            );
        } else {
            return null;
        }
    });
}

function getPropType(value) {
    var propType = typeof(value);

    if (isArray(value)) {
        return "array";
    } else if (value instanceof RegExp) {
        return "object";
    } else {
        return propType;
    }
}

function getPreciseType(propValue) {
    var propType = getPropType(propValue);

    if (propType === "object") {
        if (propValue instanceof Date) {
            return "date";
        } else if (propValue instanceof RegExp) {
            return "regexp";
        } else {
            return propType;
        }
    } else {
        return propType;
    }
}


},
function(require, exports, module, global) {

var isObjectLike = require(14);


var objectRegExpStr = "[object RegExp]",
    objectToString = Object.prototype.toString;


module.exports = function isRegExp(obj) {
    return (isObjectLike(obj) && objectToString.call(obj) === objectRegExpStr) || false;
};


},
function(require, exports, module, global) {

module.exports = emptyFunction;


function emptyFunction() {}

function makeEmptyFunction(value) {
    return function() {
        return value;
    };
}

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function() {
    return this;
};
emptyFunction.thatReturnsArgument = function(argument) {
    return argument;
};


},
function(require, exports, module, global) {

var virt = require(8),
    virtDOM = require(60),
    CSSTransitionGroup = require(129),
    map = require(19),
    dispatcher = require(140),
    TodoStore = require(142),
    TodoItem = require(144);


var TodoListPrototype;


module.exports = TodoList;


function TodoList(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.state = {
        list: []
    };

    this.onChange = function(e) {
        return _this.__onChange(e);
    };
}
virt.Component.extend(TodoList, "TodoList");

TodoListPrototype = TodoList.prototype;

TodoListPrototype.onDestroy = function(id) {
    dispatcher.handleViewAction({
        actionType: TodoStore.consts.TODO_DESTROY,
        id: id
    });
};

TodoListPrototype.__onChange = function() {
    var _this = this;

    TodoStore.all(function(err, todos) {
        _this.setState({
            list: todos
        });
    });
};

TodoListPrototype.componentDidMount = function() {
    TodoStore.addChangeListener(this.onChange);
    this.__onChange();
};

TodoListPrototype.componentWillUnmount = function() {
    TodoStore.removeChangeListener(this.onChange);
};

TodoListPrototype.render = function() {
    var _this = this;

    return (
        virt.createView(CSSTransitionGroup, {
                className: "todo-list",
                component: "ul"
            },
            map(this.state.list, function(item) {
                return virt.createView(TodoItem, {
                    key: item.id,
                    id: item.id,
                    onDestroy: function() {
                        _this.onDestroy(item.id);
                    },
                    text: item.text
                });
            })
        )
    );
};


},
function(require, exports, module, global) {

var virt = require(8),
    extend = require(44),
    TransitionGroup = require(130),
    CSSTransitionGroupChild = require(135);


var CSSTransitionGroupPrototype;


module.exports = CSSTransitionGroup;


function CSSTransitionGroup(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.childWrap = {
        childFactory: function(child) {
            return _this.__wrapChild(child);
        }
    };
}
virt.Component.extend(CSSTransitionGroup, "CSSTransitionGroup");

CSSTransitionGroup.defaultProps = {
    transitionName: "transition",
    transitionMove: true,
    transitionEnter: true,
    transitionLeave: true
};

CSSTransitionGroupPrototype = CSSTransitionGroup.prototype;

CSSTransitionGroupPrototype.__wrapChild = function(child) {
    var props = this.props;

    return virt.createView(CSSTransitionGroupChild, {
        name: props.transitionName,
        move: props.transitionMove,
        enter: props.transitionEnter,
        leave: props.transitionLeave
    }, child);
};

CSSTransitionGroupPrototype.render = function() {
    return virt.createView(TransitionGroup, extend({}, this.props, this.childWrap), this.children);
};


},
function(require, exports, module, global) {

var virt = require(8),
    extend = require(44),
    forEach = require(71),
    propTypes = require(125),
    emptyFunction = require(127),
    createTransitionChild = require(131),
    getChildMapping = require(132),
    getMovePositions = require(133),
    mergeChildMappings = require(134);


var TransitionGroupPrototype;


module.exports = TransitionGroup;


function TransitionGroup(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.currentlyTransitioningKeys = {};
    this.currentKeyPositions = {};
    this.keysToEnter = [];
    this.keysToLeave = [];
    this.keysToMoveUp = [];
    this.keysToMoveDown = [];

    this.state = {
        children: getChildMapping(children)
    };

    this.performEnter = function(key) {
        return _this.__performEnter(key);
    };
    this.performLeave = function(key) {
        return _this.__performLeave(key);
    };
    this.performMoveUp = function(key) {
        return _this.__performMoveUp(key);
    };
    this.performMoveDown = function(key) {
        return _this.__performMoveDown(key);
    };
}
virt.Component.extend(TransitionGroup, "TransitionGroup");

TransitionGroup.propTypes = {
    component: propTypes.any,
    childFactory: propTypes.func
};

TransitionGroup.defaultProps = {
    component: "span",
    childFactory: emptyFunction.thatReturnsArgument
};

TransitionGroupPrototype = TransitionGroup.prototype;

TransitionGroupPrototype.componentWillReceiveProps = function(nextProps, nextChildren) {
    var nextChildMapping = getChildMapping(nextChildren),
        prevChildMapping = this.state.children,
        currentlyTransitioningKeys = this.currentlyTransitioningKeys,
        keysToEnter = this.keysToEnter,
        keysToLeave = this.keysToLeave,
        key, childMappings;


    childMappings = mergeChildMappings(prevChildMapping, nextChildMapping);
    getMovePositions(this.currentKeyPositions, nextChildMapping, this.keysToMoveUp, this.keysToMoveDown);

    for (key in nextChildMapping) {
        if (
            nextChildMapping[key] &&
            !(prevChildMapping && !!prevChildMapping[key]) &&
            !currentlyTransitioningKeys[key]
        ) {
            keysToEnter[keysToEnter.length] = key;
        }
    }

    for (key in prevChildMapping) {
        if (
            prevChildMapping[key] &&
            !(nextChildMapping && !!nextChildMapping[key]) &&
            !currentlyTransitioningKeys[key]
        ) {
            keysToLeave[keysToLeave.length] = key;
        }
    }

    this.setState({
        children: childMappings
    });
};

TransitionGroupPrototype.componentDidUpdate = function() {
    var keysToEnter = this.keysToEnter,
        keysToLeave = this.keysToLeave,
        keysToMoveUp = this.keysToMoveUp,
        keysToMoveDown = this.keysToMoveDown;

    this.keysToEnter = [];
    forEach(keysToEnter, this.performEnter);

    this.keysToLeave = [];
    forEach(keysToLeave, this.performLeave);

    this.keysToMoveUp = [];
    forEach(keysToMoveUp, this.performMoveUp);

    this.keysToMoveDown = [];
    forEach(keysToMoveDown, this.performMoveDown);
};

TransitionGroupPrototype.__performEnter = function(key) {
    var _this = this,
        component = this.refs[key];

    this.currentlyTransitioningKeys[key] = true;

    if (component.componentWillEnter) {
        component.componentWillEnter(function() {
            return _this.__handleEnterDone(key);
        });
    } else {
        this.__handleEnterDone(key);
    }
};

TransitionGroupPrototype.__handleEnterDone = function(key) {
    var component = this.refs[key],
        currentChildMapping;

    if (component.componentDidEnter) {
        component.componentDidEnter();
    }

    delete this.currentlyTransitioningKeys[key];
    currentChildMapping = getChildMapping(this.children);

    if (!currentChildMapping || !currentChildMapping[key]) {
        this.__performLeave(key);
    }
};

TransitionGroupPrototype.__performLeave = function(key) {
    var _this = this,
        component = this.refs[key];

    this.currentlyTransitioningKeys[key] = true;

    if (component.componentWillLeave) {
        component.componentWillLeave(function() {
            return _this.__handleLeaveDone(key);
        });
    } else {
        this.__handleLeaveDone(key);
    }
};

TransitionGroupPrototype.__handleLeaveDone = function(key) {
    var component = this.refs[key],
        currentChildMapping, newChildren;

    if (component.componentDidLeave) {
        component.componentDidLeave();
    }

    delete this.currentKeyPositions[key];
    delete this.currentlyTransitioningKeys[key];
    currentChildMapping = getChildMapping(this.children);

    if (currentChildMapping && currentChildMapping[key]) {
        this.performEnter(key);
    } else {
        newChildren = extend({}, this.state.children);
        delete newChildren[key];

        this.setState({
            children: newChildren
        });
    }
};

TransitionGroupPrototype.__performMoveUp = function(key) {
    var _this = this,
        component = this.refs[key];

    this.currentlyTransitioningKeys[key] = true;

    if (component.componentWillMoveUp) {
        component.componentWillMoveUp(function() {
            return _this.__handleMoveUpDone(key);
        });
    } else {
        this.__handleMoveUpDone(key);
    }
};

TransitionGroupPrototype.__performMoveDown = function(key) {
    var _this = this,
        component = this.refs[key];

    this.currentlyTransitioningKeys[key] = true;

    if (component.componentWillMoveDown) {
        component.componentWillMoveDown(function() {
            return _this.__handleMoveDownDone(key);
        });
    } else {
        this.__handleMoveDownDone(key);
    }
};

TransitionGroupPrototype.__handleMoveUpDone = function(key) {
    var component = this.refs[key],
        currentChildMapping;

    if (component.componentDidMoveUp) {
        component.componentDidMoveUp();
    }

    delete this.currentlyTransitioningKeys[key];
    currentChildMapping = getChildMapping(this.children);

    if (!currentChildMapping || !currentChildMapping[key]) {
        this.__performLeave(key);
    }
};

TransitionGroupPrototype.__handleMoveDownDone = function(key) {
    var component = this.refs[key],
        currentChildMapping;

    if (component.componentDidMoveDown) {
        component.componentDidMoveDown();
    }

    delete this.currentlyTransitioningKeys[key];
    currentChildMapping = getChildMapping(this.children);

    if (!currentChildMapping || !currentChildMapping[key]) {
        this.__performLeave(key);
    }
};

TransitionGroupPrototype.render = function() {
    var childrenToRender = [],
        childFactory = this.props.childFactory,
        children = this.state.children,
        key, child;

    if (children) {
        for (key in children) {
            if ((child = children[key])) {
                childrenToRender[childrenToRender.length] = createTransitionChild(childFactory(child), key, key);
            }
        }
    }

    return virt.createView(this.props.component, this.props, childrenToRender);
};


},
function(require, exports, module, global) {

var virt = require(8);


var View = virt.View,
    owner = virt.owner,
    context = virt.context;


module.exports = createTransitionChild;


function createTransitionChild(child, key, ref) {
    return new View(child.type, key, ref, child.props, child.children, owner.current, context.current);
}


},
function(require, exports, module, global) {

var virt = require(8);


var isPrimativeView = virt.View.isPrimativeView;


module.exports = getChildMapping;


function getChildMapping(children) {
    var childMapping = null,
        i = -1,
        il = children.length - 1,
        child;

    while (i++ < il) {
        child = children[i];

        if (!isPrimativeView(child)) {
            childMapping = childMapping || {};
            childMapping[child.key] = child;
        }
    }

    return childMapping;
}


},
function(require, exports, module, global) {

var has = require(18);


module.exports = getMovePositions;


function getMovePositions(currentKeyPositions, nextChildMapping, keysToMoveUp, keysToMoveDown) {
    var index = 0,
        key, prev;

    for (key in nextChildMapping) {
        if (has(nextChildMapping, key)) {
            prev = currentKeyPositions[key];

            if (prev != null) {
                if (prev > index) {
                    keysToMoveDown[keysToMoveDown.length] = key;
                } else if (prev < index) {
                    keysToMoveUp[keysToMoveUp.length] = key;
                }
            }

            currentKeyPositions[key] = index++;
        }
    }
}


},
function(require, exports, module, global) {

var has = require(18);


module.exports = mergeChildMappings;


function mergeChildMappings(prev, next) {
    var nextKeysPending = {},
        pendingKeys = [],
        childMapping = {},
        prevKey, nextKey, i, il, nextKeysPendingValue, pendingNextKey;

    prev = prev || {};
    next = next || {};

    for (prevKey in prev) {
        if (has(next, prevKey)) {
            if (pendingKeys.length) {
                nextKeysPending[prevKey] = pendingKeys;
                pendingKeys = [];
            }
        } else {
            pendingKeys.push(prevKey);
        }
    }

    for (nextKey in next) {
        if (has(next, nextKey)) {
            if (has(nextKeysPending, nextKey)) {
                nextKeysPendingValue = nextKeysPending[nextKey];
                i = -1;
                il = nextKeysPendingValue.length - 1;

                while (i++ < il) {
                    pendingNextKey = nextKeysPendingValue[i];
                    childMapping[pendingNextKey] = has(next, pendingNextKey) ? next[pendingNextKey] : prev[pendingNextKey];
                }
            }
            childMapping[nextKey] = has(next, nextKey) ? next[nextKey] : prev[nextKey];
        }
    }

    i = -1;
    il = pendingKeys.length - 1;
    while (i++ < il) {
        nextKey = pendingKeys[i];
        childMapping[nextKey] = has(next, nextKey) ? next[nextKey] : prev[nextKey];
    }

    return childMapping;
}


},
function(require, exports, module, global) {

var virt = require(8),
    virtDOM = require(60),
    forEach = require(71),
    transitionEvents = require(136),
    domClass = require(138);


var CSSTransitionGroupChildPrototype,
    TICK = 1000 / 60;


module.exports = CSSTransitionGroupChild;


function CSSTransitionGroupChild(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.timeout = null;

    this.classNameQueue = [];
    this.flushClassNameQueue = function() {
        return _this.__flushClassNameQueue();
    };
}
virt.Component.extend(CSSTransitionGroupChild, "CSSTransitionGroupChild");

CSSTransitionGroupChildPrototype = CSSTransitionGroupChild.prototype;

CSSTransitionGroupChildPrototype.componentWillUnmount = function() {
    if (this.timeout !== null) {
        clearTimeout(this.timeout);
    }
};

CSSTransitionGroupChildPrototype.componentWillEnter = function(done) {
    if (this.props.enter) {
        this.transition("enter", done);
    } else {
        done();
    }
};

CSSTransitionGroupChildPrototype.componentWillLeave = function(done) {
    if (this.props.leave) {
        this.transition("leave", done);
    } else {
        done();
    }
};

CSSTransitionGroupChildPrototype.componentWillMoveUp = function(done) {
    if (this.props.leave) {
        this.transition("move-up", done);
    } else {
        done();
    }
};

CSSTransitionGroupChildPrototype.componentWillMoveDown = function(done) {
    if (this.props.leave) {
        this.transition("move-down", done);
    } else {
        done();
    }
};

CSSTransitionGroupChildPrototype.transition = function(animationType, callback) {
    var node = virtDOM.findDOMNode(this),
        className = this.props.name + "-" + animationType,
        activeClassName = className + "-active";

    function endListener(e) {
        if (e && e.target === node) {
            domClass.remove(node, className);
            domClass.remove(node, activeClassName);

            transitionEvents.removeEndEventListener(node, endListener);

            if (callback) {
                callback();
            }
        }
    }

    transitionEvents.addEndEventListener(node, endListener);
    domClass.add(node, className);

    this.queueClass(activeClassName);
};

CSSTransitionGroupChildPrototype.queueClass = function(className) {
    var classNameQueue = this.classNameQueue;

    classNameQueue[classNameQueue.length] = className;

    if (this.timeout === null) {
        this.timeout = setTimeout(this.flushClassNameQueue, TICK);
    }
};

CSSTransitionGroupChildPrototype.__flushClassNameQueue = function() {
    var node;

    if (this.isMounted()) {
        node = virtDOM.findDOMNode(this);

        forEach(this.classNameQueue, function(className) {
            domClass.add(node, className);
        });
    }

    this.classNameQueue.length = 0;
    this.timeout = null;
};

CSSTransitionGroupChildPrototype.render = function() {
    return this.children[0];
};


},
function(require, exports, module, global) {

var has = require(18),
    supports = require(137);


var transitionEvents = exports,

    EVENT_NAME_MAP = {
        transitionend: {
            "transition": "transitionend",
            "WebkitTransition": "webkitTransitionEnd",
            "MozTransition": "mozTransitionEnd",
            "OTransition": "oTransitionEnd",
            "msTransition": "MSTransitionEnd"
        },

        animationend: {
            "animation": "animationend",
            "WebkitAnimation": "webkitAnimationEnd",
            "MozAnimation": "mozAnimationEnd",
            "OAnimation": "oAnimationEnd",
            "msAnimation": "MSAnimationEnd"
        }
    },

    END_EVENTS = [];

function detectEvents() {
    var testEl = document.createElement("div"),
        style = testEl.style,
        baseEventName, baseEvents, styleName;

    if (!("AnimationEvent" in window)) {
        delete EVENT_NAME_MAP.animationend.animation;
    }

    if (!("TransitionEvent" in window)) {
        delete EVENT_NAME_MAP.transitionend.transition;
    }

    for (baseEventName in EVENT_NAME_MAP) {
        if (has(EVENT_NAME_MAP, baseEventName)) {
            baseEvents = EVENT_NAME_MAP[baseEventName];
            for (styleName in baseEvents) {
                if (styleName in style) {
                    END_EVENTS[END_EVENTS.length] = baseEvents[styleName];
                    break;
                }
            }
        }
    }
}

if (supports.dom) {
    detectEvents();
}

function addEventListener(node, eventName, eventListener) {
    node.addEventListener(eventName, eventListener, false);
}

function removeEventListener(node, eventName, eventListener) {
    node.removeEventListener(eventName, eventListener, false);
}

transitionEvents.addEndEventListener = function(node, eventListener) {
    if (END_EVENTS.length === 0) {
        window.setTimeout(eventListener, 0);
    } else {
        END_EVENTS.forEach(function(endEvent) {
            addEventListener(node, endEvent, eventListener);
        });
    }
};

transitionEvents.removeEndEventListener = function(node, eventListener) {
    if (END_EVENTS.length !== 0) {
        END_EVENTS.forEach(function(endEvent) {
            removeEventListener(node, endEvent, eventListener);
        });
    }
};


},
function(require, exports, module, global) {

var environment = require(1);


var supports = module.exports;


supports.dom = !!(typeof(window) !== "undefined" && window.document && window.document.createElement);
supports.workers = typeof(Worker) !== "undefined";

supports.eventListeners = supports.dom && !!environment.window.addEventListener;
supports.attachEvents = supports.dom && !!environment.window.attachEvent;

supports.viewport = supports.dom && !!environment.window.screen;
supports.touch = supports.dom && "ontouchstart" in environment.window;


},
function(require, exports, module, global) {

var trim = require(139),
    isArray = require(12),
    isString = require(15),
    isElement = require(115);


var domClass = exports,

    CLASS_REMOVE = /[\t\r\n\f]/g,
    SPLITER = /[\s, ]+/;


domClass.add = function(node, names) {
    var classNames, i, current, className, finalValue;

    if (isElement(node)) {
        current = node.className ? (" " + node.className + " ").replace(CLASS_REMOVE, " ") : " ";

        if (current) {
            classNames = isArray(names) ? names : (isString(names) ? names.split(SPLITER) : []);
            i = classNames.length;

            while (i--) {
                className = classNames[i];

                if (current.indexOf(" " + className + " ") === -1) {
                    current += className + " ";
                }

                finalValue = trim(current);
                if (node.className !== finalValue) {
                    node.className = finalValue;
                }
            }
        }
    }
};

domClass.remove = function(node, names) {
    var classNames, i, current, className, finalValue;

    if (isElement(node)) {
        current = node.className ? (" " + node.className + " ").replace(CLASS_REMOVE, " ") : " ";

        if (current) {
            classNames = isArray(names) ? names : (isString(names) ? names.split(SPLITER) : []);
            i = classNames.length;

            while (i--) {
                className = classNames[i];

                if (current.indexOf(" " + className + " ") !== -1) {
                    current = current.replace(" " + className + " ", " ");
                }

                finalValue = trim(current);
                if (node.className !== finalValue) {
                    node.className = finalValue;
                }
            }
        }
    }
};

domClass.has = function(node, names) {
    var classNames, i, current, className;

    if (isElement(node)) {
        current = node.className ? (" " + node.className + " ").replace(CLASS_REMOVE, " ") : " ";

        if (current) {
            classNames = isArray(names) ? names : (isString(names) ? names.split(SPLITER) : []);
            i = classNames.length;

            while (i--) {
                className = classNames[i];

                if (current.indexOf(" " + className + " ") !== -1) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    } else {
        return false;
    }
};


},
function(require, exports, module, global) {

var isNative = require(21),
    isString = require(15);


var StringPrototype = String.prototype,

    nativeTrim = StringPrototype.trim,
    nativeTrimLeft = StringPrototype.trimLeft,
    nativeTrimRight = StringPrototype.trimRight,

    reTrim = /^[\s\xA0]+|[\s\xA0]+$/g,
    reTrimLeft = /^[\s\xA0]+/g,
    reTrimRight = /[\s\xA0]+$/g,

    baseTrim, baseTrimLeft, baseTrimRight;


module.exports = trim;


if (isNative(nativeTrim)) {
    baseTrim = function baseTrim(str) {
        return nativeTrim.call(str);
    };
} else {
    baseTrim = function baseTrim(str) {
        return str.replace(reTrim, "");
    };
}

if (isNative(nativeTrimLeft)) {
    baseTrimLeft = function baseTrimLeft(str) {
        return nativeTrimLeft.call(str);
    };
} else {
    baseTrimLeft = function baseTrimLeft(str) {
        return str.replace(reTrimLeft, "");
    };
}

if (isNative(nativeTrimRight)) {
    baseTrimRight = function baseTrimRight(str) {
        return nativeTrimRight.call(str);
    };
} else {
    baseTrimRight = function baseTrimRight(str) {
        return str.replace(reTrimRight, "");
    };
}


function trim(str) {
    return isString(str) ? baseTrim(str) : str;
}

trim.left = function trimLeft(str) {
    return isString(str) ? baseTrimLeft(str) : str;
};

trim.right = function trimRight(str) {
    return isString(str) ? baseTrimRight(str) : str;
};


},
function(require, exports, module, global) {

var EventEmitter = require(141);


var dispatcher = module.exports = new EventEmitter(-1),
    DISPATCH = "DISPATCH",
    VIEW_ACTION = "VIEW_ACTION";


dispatcher.register = function(callback) {
    dispatcher.on(DISPATCH, callback);
    return callback;
};

dispatcher.handleViewAction = function(action) {
    dispatcher.emit(DISPATCH, {
        type: VIEW_ACTION,
        action: action
    });
};


},
function(require, exports, module, global) {

var isFunction = require(5),
    inherits = require(50),
    fastSlice = require(17),
    keys = require(20);


function EventEmitter(maxListeners) {
    this.__events = {};
    this.__maxListeners = maxListeners != null ? maxListeners : EventEmitter.defaultMaxListeners;
}

EventEmitter.prototype.on = function(name, listener) {
    var events, eventList, maxListeners;

    if (!isFunction(listener)) {
        throw new TypeError("EventEmitter.on(name, listener) listener must be a function");
    }

    events = this.__events || (this.__events = {});
    eventList = (events[name] || (events[name] = []));
    maxListeners = this.__maxListeners || -1;

    eventList[eventList.length] = listener;

    if (maxListeners !== -1 && eventList.length > maxListeners) {
        console.error(
            "EventEmitter.on(type, listener) possible EventEmitter memory leak detected. " + maxListeners + " listeners added"
        );
    }

    return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function(name, listener) {
    var _this = this;

    function once() {

        _this.off(name, once);

        switch (arguments.length) {
            case 0:
                return listener();
            case 1:
                return listener(arguments[0]);
            case 2:
                return listener(arguments[0], arguments[1]);
            case 3:
                return listener(arguments[0], arguments[1], arguments[2]);
            case 4:
                return listener(arguments[0], arguments[1], arguments[2], arguments[3]);
            default:
                return listener.apply(null, arguments);
        }
    }

    this.on(name, once);

    return once;
};

EventEmitter.prototype.listenTo = function(obj, name) {
    var _this = this;

    if (!obj || !(isFunction(obj.on) || isFunction(obj.addListener))) {
        throw new TypeError("EventEmitter.listenTo(obj, name) obj must have a on function taking (name, listener[, ctx])");
    }

    function handler() {
        _this.emitArgs(name, arguments);
    }

    obj.on(name, handler);

    return handler;
};

EventEmitter.prototype.off = function(name, listener) {
    var events = this.__events || (this.__events = {}),
        eventList, event, i;

    eventList = events[name];
    if (!eventList) {
        return this;
    }

    if (!listener) {
        i = eventList.length;

        while (i--) {
            this.emit("removeListener", name, eventList[i]);
        }
        eventList.length = 0;
        delete events[name];
    } else {
        i = eventList.length;

        while (i--) {
            event = eventList[i];

            if (event === listener) {
                this.emit("removeListener", name, event);
                eventList.splice(i, 1);
            }
        }

        if (eventList.length === 0) {
            delete events[name];
        }
    }

    return this;
};

EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

EventEmitter.prototype.removeAllListeners = function() {
    var events = this.__events || (this.__events = {}),
        objectKeys = keys(events),
        i = -1,
        il = objectKeys.length - 1,
        key, eventList, j;

    while (i++ < il) {
        key = objectKeys[i];
        eventList = events[key];

        if (eventList) {
            j = eventList.length;

            while (j--) {
                this.emit("removeListener", key, eventList[j]);
                eventList.splice(j, 1);
            }
        }

        delete events[key];
    }

    return this;
};

function emit(eventList, args) {
    var a1, a2, a3, a4, a5,
        length = eventList.length - 1,
        i = -1,
        event;

    switch (args.length) {
        case 0:
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event();
                }
            }
            break;
        case 1:
            a1 = args[0];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1);
                }
            }
            break;
        case 2:
            a1 = args[0];
            a2 = args[1];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2);
                }
            }
            break;
        case 3:
            a1 = args[0];
            a2 = args[1];
            a3 = args[2];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2, a3);
                }
            }
            break;
        case 4:
            a1 = args[0];
            a2 = args[1];
            a3 = args[2];
            a4 = args[3];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2, a3, a4);
                }
            }
            break;
        case 5:
            a1 = args[0];
            a2 = args[1];
            a3 = args[2];
            a4 = args[3];
            a5 = args[4];
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event(a1, a2, a3, a4, a5);
                }
            }
            break;
        default:
            while (i++ < length) {
                if ((event = eventList[i])) {
                    event.apply(null, args);
                }
            }
            break;
    }
}

EventEmitter.prototype.emitArgs = function(name, args) {
    var eventList = (this.__events || (this.__events = {}))[name];

    if (!eventList || !eventList.length) {
        return this;
    }

    emit(eventList, args);

    return this;
};

EventEmitter.prototype.emit = function(name) {
    return this.emitArgs(name, fastSlice(arguments, 1));
};

function createFunctionCaller(args) {
    switch (args.length) {
        case 0:
            return function functionCaller(fn) {
                return fn();
            };
        case 1:
            return function functionCaller(fn) {
                return fn(args[0]);
            };
        case 2:
            return function functionCaller(fn) {
                return fn(args[0], args[1]);
            };
        case 3:
            return function functionCaller(fn) {
                return fn(args[0], args[1], args[2]);
            };
        case 4:
            return function functionCaller(fn) {
                return fn(args[0], args[1], args[2], args[3]);
            };
        case 5:
            return function functionCaller(fn) {
                return fn(args[0], args[1], args[2], args[3], args[4]);
            };
        default:
            return function functionCaller(fn) {
                return fn.apply(null, args);
            };
    }
}

function emitAsync(eventList, args, callback) {
    var length = eventList.length,
        index = 0,
        called = false,
        functionCaller;

    function next(err) {
        if (called !== true) {
            if (err || index === length) {
                called = true;
                callback(err);
            } else {
                functionCaller(eventList[index++]);
            }
        }
    }

    args[args.length] = next;
    functionCaller = createFunctionCaller(args);
    next();
}

EventEmitter.prototype.emitAsync = function(name, args, callback) {
    var eventList = (this.__events || (this.__events = {}))[name];

    args = fastSlice(arguments, 1);
    callback = args.pop();

    if (!isFunction(callback)) {
        throw new TypeError("EventEmitter.emitAsync(name [, ...args], callback) callback must be a function");
    }

    if (!eventList || !eventList.length) {
        callback();
    } else {
        emitAsync(eventList, args, callback);
    }

    return this;
};

EventEmitter.prototype.listeners = function(name) {
    var eventList = (this.__events || (this.__events = {}))[name];

    return eventList ? eventList.slice() : [];
};

EventEmitter.prototype.listenerCount = function(name) {
    var eventList = (this.__events || (this.__events = {}))[name];

    return eventList ? eventList.length : 0;
};

EventEmitter.prototype.setMaxListeners = function(value) {
    if ((value = +value) !== value) {
        throw new TypeError("EventEmitter.setMaxListeners(value) value must be a number");
    }

    this.__maxListeners = value < 0 ? -1 : value;
    return this;
};


inherits.defineProperty(EventEmitter, "defaultMaxListeners", 10);


inherits.defineProperty(EventEmitter, "listeners", function(obj, name) {
    var eventList;

    if (obj == null) {
        throw new TypeError("EventEmitter.listeners(obj, name) obj required");
    }
    eventList = obj.__events && obj.__events[name];

    return eventList ? eventList.slice() : [];
});

inherits.defineProperty(EventEmitter, "listenerCount", function(obj, name) {
    var eventList;

    if (obj == null) {
        throw new TypeError("EventEmitter.listenerCount(obj, name) obj required");
    }
    eventList = obj.__events && obj.__events[name];

    return eventList ? eventList.length : 0;
});

inherits.defineProperty(EventEmitter, "setMaxListeners", function(value) {
    if ((value = +value) !== value) {
        throw new TypeError("EventEmitter.setMaxListeners(value) value must be a number");
    }

    EventEmitter.defaultMaxListeners = value < 0 ? -1 : value;
    return value;
});

EventEmitter.extend = function(child) {
    inherits(child, this);
    return child;
};


module.exports = EventEmitter;


},
function(require, exports, module, global) {

var EventEmitter = require(141),
    values = require(143),
    dispatcher = require(140);


var TodoStore = module.exports = new EventEmitter(-1),
    CHANGE = "CHANGE";


TodoStore.consts = {
    TODO_CREATE: "TODO_CREATE",
    TODO_UPDATE: "TODO_UPDATE",
    TODO_DESTROY: "TODO_DESTROY"
};


var _todoId = 1,
    _todos = {
        0: {
            id: 0,
            text: "Im a Todo Item"
        }
    };


function create(text, callback) {
    var id = _todoId++,
        todo = _todos[id] = {
            id: id,
            text: text
        };

    callback(undefined, todo);
}

function update(id, text, callback) {
    var todo = _todos[id];

    todo.text = text;

    callback(undefined, todo);
}

function destroy(id, callback) {
    var todo = _todos[id];

    delete _todos[id];

    callback(undefined, todo);
}

TodoStore.all = function(callback) {
    callback(undefined, values(_todos));
};

TodoStore.show = function(id, callback) {
    callback(undefined, _todos[id]);
};

TodoStore.addChangeListener = function(callback) {
    TodoStore.on(CHANGE, callback);
};

TodoStore.removeChangeListener = function(callback) {
    TodoStore.off(CHANGE, callback);
};

TodoStore.emitChange = function() {
    TodoStore.emit(CHANGE);
};

TodoStore.id = dispatcher.register(function(payload) {
    var action = payload.action;

    switch (action.actionType) {
        case TodoStore.consts.TODO_CREATE:
            create(action.text, function() {
                TodoStore.emitChange();
            });
            break;
        case TodoStore.consts.TODO_UPDATE:
            update(action.id, action.text, function() {
                TodoStore.emitChange();
            });
            break;
        case TodoStore.consts.TODO_DESTROY:
            destroy(action.id, function() {
                TodoStore.emitChange();
            });
            break;
    }
});


},
function(require, exports, module, global) {

var keys = require(20);


function objectValues(object, objectKeys) {
    var length = objectKeys.length,
        results = new Array(length),
        i = -1,
        il = length - 1;

    while (i++ < il) {
        results[i] = object[objectKeys[i]];
    }

    return results;
}


function values(object) {
    return objectValues(object, keys(object));
}

values.objectValues = objectValues;


module.exports = values;


},
function(require, exports, module, global) {

var virt = require(8),
    propTypes = require(125);


var TodoItemPrototype;


module.exports = TodoItem;


function TodoItem(props, children, context) {
    virt.Component.call(this, props, children, context);
}
virt.Component.extend(TodoItem, "TodoItem");

TodoItemPrototype = TodoItem.prototype;

TodoItem.propTypes = {
    id: propTypes.number.isRequired,
    onDestroy: propTypes.func.isRequired,
    text: propTypes.string.isRequired
};

TodoItem.contextTypes = {
    ctx: propTypes.object.isRequired
};

TodoItemPrototype.render = function() {
    return (
        virt.createView("li", {
                id: this.props.id,
                className: "todo-item"
            },
            virt.createView("p", {
                    dangerouslySetInnerHTML: true
                },
                "<span>" + this.props.text + "</span>",
                virt.createView("span", {
                    onClick: this.props.onDestroy
                }, " x ")
            )
        )
    );
};


},
function(require, exports, module, global) {

var virt = require(8),
    virtDOM = require(60),
    eventListener = require(2),
    dispatcher = require(140),
    TodoStore = require(142);


var TodoFormPrototype;


module.exports = TodoForm;


function TodoForm(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.state = {
        name: "Default State"
    };

    this.onSubmit = function(e) {
        return _this.__onSubmit(e);
    };

    this.onInput = function(e) {
        return _this.__onInput(e);
    };
}
virt.Component.extend(TodoForm, "TodoForm");

TodoFormPrototype = TodoForm.prototype;

TodoFormPrototype.componentDidMount = function() {

};

TodoFormPrototype.componentWillUnmount = function() {

};

TodoFormPrototype.__onSubmit = function(e) {
    var DOMNode = virtDOM.findDOMNode(this.refs.name),
        value = DOMNode.value;

    e.preventDefault();

    if (value) {
        dispatcher.handleViewAction({
            actionType: TodoStore.consts.TODO_CREATE,
            text: value
        });

        DOMNode.value = "";

        this.setState({
            name: ""
        });
    }
};

TodoFormPrototype.__onInput = function() {
    var DOMNode = virtDOM.findDOMNode(this.refs.name),
        value = DOMNode.value;

    this.setState({
        name: value
    });
};

TodoFormPrototype.render = function() {
    return (
        virt.createView("div", {
                className: "todo-form"
            },
            virt.createView("form", {
                    onSubmit: this.onSubmit
                },
                virt.createView("input", {
                    type: "text",
                    name: "name",
                    ref: "name",
                    placeholder: "Todo",
                    value: this.state.name,
                    onInput: this.onInput
                })
            )
        )
    );
};


}], (new Function("return this;"))()));
