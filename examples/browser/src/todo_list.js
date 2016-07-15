var virt = require("@nathanfaucett/virt"),
    arrayMap = require("@nathanfaucett/array-map"),
    CSSTransitionGroup = require("../../.."),
    dispatcher = require("./dispatcher"),
    TodoStore = require("./todo_store"),
    TodoItem = require("./todo_item");


var TodoListPrototype;


module.exports = TodoList;


function TodoList(props, children, context) {
    var _this = this;

    virt.Component.call(this, props, children, context);

    this.state = {
        list: []
    };

    this.onChange = function(e) {
        return _this.__onChange(e);
    };
}
virt.Component.extend(TodoList, "TodoList");

TodoListPrototype = TodoList.prototype;

TodoListPrototype.onDestroy = function(id) {
    dispatcher.handleViewAction({
        actionType: TodoStore.consts.TODO_DESTROY,
        id: id
    });
};

TodoListPrototype.__onChange = function() {
    var _this = this;

    TodoStore.all(function(err, todos) {
        _this.setState({
            list: todos
        });
    });
};

TodoListPrototype.componentDidMount = function() {
    TodoStore.addChangeListener(this.onChange);
    this.__onChange();
};

TodoListPrototype.componentWillUnmount = function() {
    TodoStore.removeChangeListener(this.onChange);
};

TodoListPrototype.render = function() {
    var _this = this;

    return (
        virt.createView(CSSTransitionGroup, {
                className: "todo-list",
                component: "ul"
            },
            arrayMap(this.state.list, function(item) {
                return virt.createView(TodoItem, {
                    key: item.id,
                    id: item.id,
                    onDestroy: function() {
                        _this.onDestroy(item.id);
                    },
                    text: item.text
                });
            })
        )
    );
};
