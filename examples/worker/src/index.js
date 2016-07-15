var environment = require("@nathanfaucett/environment"),
    eventListener = require("@nathanfaucett/event_listener"),
    virtDOM = require("@nathanfaucett/virt-dom");;


require("../../../src/handlers");


eventListener.on(environment.window, "load", function() {
    virtDOM.createWorkerRender("worker.js", document.getElementById("app"));
});


