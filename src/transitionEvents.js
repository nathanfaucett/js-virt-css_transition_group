var has = require("has"),
    arrayForEach = require("array-for_each"),
    supports = require("supports"),
    requestAnimationFrame = require("request_animation_frame");


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


if (supports.dom) {
    (function detectEvents() {
        var localHas = has,
            testNode = document.createElement("div"),
            style = testNode.style,
            baseEventName, baseEvents, styleName;

        if (!("AnimationEvent" in window)) {
            delete EVENT_NAME_MAP.animationend.animation;
        }

        if (!("TransitionEvent" in window)) {
            delete EVENT_NAME_MAP.transitionend.transition;
        }

        for (baseEventName in EVENT_NAME_MAP) {
            if (localHas(EVENT_NAME_MAP, baseEventName)) {
                baseEvents = EVENT_NAME_MAP[baseEventName];
                for (styleName in baseEvents) {
                    if (styleName in style) {
                        END_EVENTS[END_EVENTS.length] = baseEvents[styleName];
                        break;
                    }
                }
            }
        }
    }());
}

function addEventListener(node, eventName, eventListener) {
    node.addEventListener(eventName, eventListener, false);
}

function removeEventListener(node, eventName, eventListener) {
    node.removeEventListener(eventName, eventListener, false);
}

transitionEvents.addEndEventListener = function(node, eventListener) {
    if (END_EVENTS.length === 0) {
        requestAnimationFrame(eventListener);
    } else {
        arrayForEach(END_EVENTS, function(endEvent) {
            addEventListener(node, endEvent, eventListener);
        });
    }
};

transitionEvents.removeEndEventListener = function(node, eventListener) {
    if (END_EVENTS.length !== 0) {
        arrayForEach(END_EVENTS, function(endEvent) {
            removeEventListener(node, endEvent, eventListener);
        });
    }
};
