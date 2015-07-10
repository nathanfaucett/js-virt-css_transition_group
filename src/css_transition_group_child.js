var virt = require("virt");


var MESSAGE_ID = 0,
    CSSTransitionGroupChildPrototype;


module.exports = CSSTransitionGroupChild;


function CSSTransitionGroupChild(props, children, context) {

    virt.Component.call(this, props, children, context);

    this.classNameQueue = [];
}
virt.Component.extend(CSSTransitionGroupChild, "virt.CSSTransitionGroupChild");

CSSTransitionGroupChildPrototype = CSSTransitionGroupChild.prototype;

CSSTransitionGroupChildPrototype.componentWillUnmount = function() {
    // cancel any request ids
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

CSSTransitionGroupChildPrototype.enqueueEndListener = function(messageId, callback) {
    var _this = this,
        messageName = "virt.CSSTransitionGroupChild.transition.endListener" + messageId;

    function onEndListener(error) {
        if (error) {
            throw error;
        } else {
            //console.log("called", messageId);
            _this.offMessage(messageName, onEndListener);
            callback();
        }
    }

    //console.log("queued", messageId);
    this.onMessage(messageName, onEndListener);
};

CSSTransitionGroupChildPrototype.transition = function(animationType, callback) {
    var _this = this,
        messageId = MESSAGE_ID++,
        className = this.props.name + "-" + animationType,
        activeClassName = className + "-active";

    this.enqueueEndListener(messageId, callback);

    this.emitMessage("virt.CSSTransitionGroupChild.transition", {
        id: this.getInternalId(),
        messageId: messageId,
        className: className,
        activeClassName: activeClassName
    }, function(error) {
        if (error) {
            throw error;
        } else {
            _this.queueClass(activeClassName);
        }
    });
};

CSSTransitionGroupChildPrototype.queueClass = function(className) {
    var classNameQueue = this.classNameQueue;
    classNameQueue[classNameQueue.length] = className;
    this.flushClassNameQueue();
};

CSSTransitionGroupChildPrototype.flushClassNameQueue = function() {
    var classNameQueue = this.classNameQueue;

    if (this.isMounted()) {
        this.emitMessage("virt.CSSTransitionGroupChild.flushClassNameQueue", {
            id: this.getInternalId(),
            classNameQueue: classNameQueue.slice()
        }, function onFlushClassNameQueue() {
            classNameQueue.length = 0;
        });
    }
};

CSSTransitionGroupChildPrototype.render = function() {
    return this.children[0];
};
