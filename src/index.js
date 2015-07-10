var virt = require("virt"),
    extend = require("extend"),
    TransitionGroup = require("virt-transition_group"),
    CSSTransitionGroupChild = require("./css_transition_group_child");


var CSSTransitionGroupPrototype;


module.exports = CSSTransitionGroup;


function CSSTransitionGroup(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.childWrap = {
        childFactory: function childFactory(child) {
            return _this.__wrapChild(child);
        }
    };
}
virt.Component.extend(CSSTransitionGroup, "virt.CSSTransitionGroup");

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
