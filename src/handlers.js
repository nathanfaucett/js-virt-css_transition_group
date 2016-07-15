var virtDOM = require("@nathanfaucett/virt-dom"),
    domClass = require("@nathanfaucett/dom_class"),
    requestAnimationFrame = require("@nathanfaucett/request_animation_frame"),
    transitionEvents = require("./transitionEvents");


virtDOM.addNativeHandler("virt.CSSTransitionGroupChild.transition", function onTransition(data, callback, messenger) {
    var node = virtDOM.findDOMNode(data.id);

    if (node) {
        transitionEvents.addEndEventListener(node, function endListener(e) {
            if (e && e.target === node) {
                transitionEvents.removeEndEventListener(node, endListener);
                messenger.emit("virt.CSSTransitionGroupChild.transition.endListener-" + data.messageId, null, function onMessage() {
                    domClass.remove(node, data.className);
                    domClass.remove(node, data.activeClassName);
                });
            }
        });

        requestAnimationFrame(function onNextFrame() {
            domClass.add(node, data.className);

            requestAnimationFrame(function onNextFrame() {
                domClass.add(node, data.activeClassName);
                callback();
            });
        });
    } else {
        callback(new Error("virt.CSSTransitionGroupChild.transition(): Node with id " + data.id + " not found"));
    }
});
