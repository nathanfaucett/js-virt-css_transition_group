var virt = require("virt"),
    virtDOM = require("virt-dom"),
    forEach = require("for_each"),
    transitionEvents = require("./transition_events"),
    domClass = require("dom_class");


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
