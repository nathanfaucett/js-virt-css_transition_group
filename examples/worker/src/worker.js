var virt = require("virt"),
    virtDOM = require("virt-dom"),
    App = require("./app");


virtDOM.renderWorker(virt.createView(App));
