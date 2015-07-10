var virtDOM = require("virt-dom"),
    domClass = require("dom_class"),
    requestAnimationFrame = require("request_animation_frame"),
    transitionEvents = require("./transition_events");


virtDOM.addNativeHandler("virt.CSSTransitionGroupChild.transition", function onTransition(data, callback, messenger) {
    var node = virtDOM.findDOMNode(data.id),
        endListener;

    if (node) {
        endListener = function endListener(e) {
            if (e && e.target === node) {
                domClass.remove(node, data.className);
                domClass.remove(node, data.activeClassName);
                transitionEvents.removeEndEventListener(node, endListener);
                messenger.emit("virt.CSSTransitionGroupChild.transition.endListener" + data.messageId);
            }
        };

        transitionEvents.addEndEventListener(node, endListener);
        domClass.add(node, data.className);

        requestAnimationFrame(function onNextFrame() {
            domClass.add(node, data.activeClassName);
        });

        callback();
    } else {
        callback(new Error("virt.CSSTransitionGroupChild.transition(): Node with id " + data.id + " not found"));
    }
});
