var EventEmitter = require("event_emitter"),
    values = require("values"),
    dispatcher = require("./dispatcher");


var TodoStore = module.exports = new EventEmitter(-1),
    CHANGE = "CHANGE";


TodoStore.consts = {
    TODO_CREATE: "TODO_CREATE",
    TODO_UPDATE: "TODO_UPDATE",
    TODO_DESTROY: "TODO_DESTROY"
};


var _todoId = 1,
    _todos = {
        0: {
            id: 0,
            text: "Im a Todo Item"
        }
    };


function create(text, callback) {
    var id = _todoId++,
        todo = _todos[id] = {
            id: id,
            text: text
        };

    callback(undefined, todo);
}

function update(id, text, callback) {
    var todo = _todos[id];

    todo.text = text;

    callback(undefined, todo);
}

function destroy(id, callback) {
    var todo = _todos[id];

    delete _todos[id];

    callback(undefined, todo);
}

TodoStore.all = function(callback) {
    callback(undefined, values(_todos));
};

TodoStore.show = function(id, callback) {
    callback(undefined, _todos[id]);
};

TodoStore.addChangeListener = function(callback) {
    TodoStore.on(CHANGE, callback);
};

TodoStore.removeChangeListener = function(callback) {
    TodoStore.off(CHANGE, callback);
};

TodoStore.emitChange = function() {
    TodoStore.emit(CHANGE);
};

TodoStore.id = dispatcher.register(function(payload) {
    var action = payload.action;

    switch (action.actionType) {
        case TodoStore.consts.TODO_CREATE:
            create(action.text, function() {
                TodoStore.emitChange();
            });
            break;
        case TodoStore.consts.TODO_UPDATE:
            update(action.id, action.text, function() {
                TodoStore.emitChange();
            });
            break;
        case TodoStore.consts.TODO_DESTROY:
            destroy(action.id, function() {
                TodoStore.emitChange();
            });
            break;
    }
});
