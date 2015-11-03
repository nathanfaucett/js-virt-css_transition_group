var virt = require("virt");


var MESSAGE_ID = 0,
    CSSTransitionGroupChildPrototype;


module.exports = CSSTransitionGroupChild;


function CSSTransitionGroupChild(props, children, context) {
    virt.Component.call(this, props, children, context);
}
virt.Component.extend(CSSTransitionGroupChild, "virt.CSSTransitionGroupChild");
CSSTransitionGroupChildPrototype = CSSTransitionGroupChild.prototype;

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
    if (this.props.move) {
        this.transition("move-up", done);
    } else {
        done();
    }
};

CSSTransitionGroupChildPrototype.componentWillMoveDown = function(done) {
    if (this.props.move) {
        this.transition("move-down", done);
    } else {
        done();
    }
};

CSSTransitionGroupChildPrototype.enqueueEndListener = function(messageId, callback) {
    var _this = this,
        messageName = "virt.CSSTransitionGroupChild.transition.endListener-" + messageId;

    function onEndListener(error) {

        _this.offMessage(messageName, onEndListener);

        if (error) {
            throw error;
        } else {
            callback();
        }
    }

    this.onMessage(messageName, onEndListener);
};

CSSTransitionGroupChildPrototype.transition = function(animationType, callback) {
    var messageId = MESSAGE_ID++,
        className = this.props.name + "-" + animationType,
        activeClassName = className + "-active";

    this.enqueueEndListener(messageId, callback);

    this.emitMessage("virt.CSSTransitionGroupChild.transition", {
        id: this.getInternalId(),
        messageId: messageId,
        className: className,
        activeClassName: activeClassName
    });
};

CSSTransitionGroupChildPrototype.render = function() {
    return this.children[0];
};
