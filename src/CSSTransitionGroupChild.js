var virt = require("@nathanfaucett/virt");


var MESSAGE_ID = 0,
    CSSTransitionGroupChildPrototype;


module.exports = CSSTransitionGroupChild;


function CSSTransitionGroupChild(props, children, context) {

    virt.Component.call(this, props, children, context);

    this.isDoing = false;
}
virt.Component.extend(CSSTransitionGroupChild, "virt.CSSTransitionGroupChild");
CSSTransitionGroupChildPrototype = CSSTransitionGroupChild.prototype;

CSSTransitionGroupChildPrototype.componentWillEnter = function(done) {
    if (!this.isDoing) {
        this.isDoing = true;

        if (this.props.enter) {
            this.transition("enter", done);
        } else {
            done();
        }
    }
};

CSSTransitionGroupChildPrototype.componentWillLeave = function(done) {
    if (!this.isDoing) {
        this.isDoing = true;

        if (this.props.leave) {
            this.transition("leave", done);
        } else {
            done();
        }
    }
};

CSSTransitionGroupChildPrototype.componentWillMoveUp = function(done) {
    if (!this.isDoing) {
        this.isDoing = true;

        if (this.props.move) {
            this.transition("move-up", done);
        } else {
            done();
        }
    }
};

CSSTransitionGroupChildPrototype.componentWillMoveDown = function(done) {
    if (!this.isDoing) {
        this.isDoing = true;

        if (this.props.move) {
            this.transition("move-down", done);
        } else {
            done();
        }
    }
};

function CSSTransitionGroupChild_enqueueEndListener(_this, messageId, callback) {
    var messageName = "virt.CSSTransitionGroupChild.transition.endListener-" + messageId;

    _this.onMessage(messageName, function onEndListener(error, done) {

        _this.offMessage(messageName, onEndListener);
        _this.isDoing = false;

        if (error) {
            throw error;
        } else {
            callback();
            done();
        }
    });
}

CSSTransitionGroupChildPrototype.transition = function(animationType, callback) {
    var messageId = MESSAGE_ID++,
        className = this.props.name + "-" + animationType,
        activeClassName = className + "-active";

    CSSTransitionGroupChild_enqueueEndListener(this, messageId, callback);

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
