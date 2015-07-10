var virtDOM = require("virt-dom"),
    domClass = require("dom_class"),
    requestAnimationFrame = require("request_animation_frame"),
    transitionEvents = require("./transition_events");


virtDOM.addNativeHandler("virt.CSSTransitionGroupChild.flushClassNameQueue", function onFlushClassNameQueue(data, callback) {
    requestAnimationFrame(function onNextFrame() {
        var node = virtDOM.findDOMNode(data.id);

        if (node) {
            domClass.add(node, data.classNameQueue);
            callback();
        } else {
            callback(new Error("virt.CSSTransitionGroupChild.flushClassNameQueue(): Node with id " + data.id + " not found"));
        }
    });
});

virtDOM.addNativeHandler("virt.CSSTransitionGroupChild.transition", function onTransition(data, callback, messenger) {
    var node = virtDOM.findDOMNode(data.id),
        className = data.className,
        activeClassName = data.activeClassName;

    if (node) {
        transitionEvents.addEndEventListener(node, function endListener(e) {
            if (e && e.target === node) {
                domClass.remove(node, className);
                domClass.remove(node, activeClassName);
                transitionEvents.removeEndEventListener(node, endListener);
            }

            messenger.emit("virt.CSSTransitionGroupChild.transition.endListener" + data.messageId);
        });

        domClass.add(node, className);
        callback();
    } else {
        callback(new Error("virt.CSSTransitionGroupChild.transition(): Node with id " + data.id + " not found"));
    }
});
