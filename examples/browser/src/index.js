var environment = require("@nathanfaucett/environment"),
    eventListener = require("@nathanfaucett/event_listener"),
    virt = require("@nathanfaucett/virt"),
    virtDOM = require("@nathanfaucett/virt-dom"),
    App = require("./app");


require("../../../src/handlers");


eventListener.on(environment.window, "load", function() {
    virtDOM.render(virt.createView(App), document.getElementById("app"));
});
