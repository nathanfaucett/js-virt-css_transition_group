var environment = require("environment"),
    eventListener = require("event_listener"),
    virt = require("virt"),
    virtDOM = require("virt-dom"),
    App = require("./app");


require("../../../src/handlers");


eventListener.on(environment.window, "load", function() {
    virtDOM.render(virt.createView(App), document.getElementById("app"));
});


