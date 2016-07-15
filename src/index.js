var virt = require("@nathanfaucett/virt"),
    extend = require("@nathanfaucett/extend"),
    TransitionGroup = require("@nathanfaucett/virt-transition_group"),
    CSSTransitionGroupChild = require("./CSSTransitionGroupChild");


var Component = virt.Component,
    CSSTransitionGroupPrototype;


require("./handlers");


module.exports = CSSTransitionGroup;


function CSSTransitionGroup(props, children, context) {
    var _this = this;

    Component.call(this, props, children, context);

    this.childWrap = {
        childFactory: function childFactory(child) {
            return _this.__wrapChild(child);
        }
    };
}
Component.extend(CSSTransitionGroup, "virt.CSSTransitionGroup");

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
