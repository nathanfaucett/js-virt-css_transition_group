var environment = require("environment"),
    eventListener = require("event_listener"),
    virtDOM = require("virt-dom");


require("../../../src/handlers");


eventListener.on(environment.window, "load", function() {
    virtDOM.createWorkerRender("worker.js", document.getElementById("app"));
});


