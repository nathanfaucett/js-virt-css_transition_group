var has = require("has"),
    supports = require("supports");


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
