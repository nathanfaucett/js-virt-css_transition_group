var EventEmitter = require("@nathanfaucett/event_emitter");


var dispatcher = module.exports = new EventEmitter(-1),
    DISPATCH = "DISPATCH",
    VIEW_ACTION = "VIEW_ACTION";


dispatcher.register = function(callback) {
    dispatcher.on(DISPATCH, callback);
    return callback;
};

dispatcher.handleViewAction = function(action) {
    dispatcher.emit(DISPATCH, {
        type: VIEW_ACTION,
        action: action
    });
};
