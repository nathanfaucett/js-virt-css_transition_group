var virt = require("virt"),
    propTypes = require("prop_types");


var TodoItemPrototype;


module.exports = TodoItem;


function TodoItem(props, children, context) {
    virt.Component.call(this, props, children, context);
}
virt.Component.extend(TodoItem, "TodoItem");

TodoItemPrototype = TodoItem.prototype;

TodoItem.propTypes = {
    id: propTypes.number.isRequired,
    onDestroy: propTypes.func.isRequired,
    text: propTypes.string.isRequired
};

TodoItem.contextTypes = {
    ctx: propTypes.object.isRequired
};

TodoItemPrototype.render = function() {
    return (
        virt.createView("li", {
                id: this.props.id,
                className: "todo-item"
            },
            virt.createView("p", {
                    dangerouslySetInnerHTML: true
                },
                "<span>" + this.props.text + "</span>",
                virt.createView("span", {
                    onClick: this.props.onDestroy
                }, " x ")
            )
        )
    );
};
