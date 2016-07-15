var virt = require("@nathanfaucett/virt"),
    virtDOM = require("@nathanfaucett/virt-dom"),
    App = require("./app");


virtDOM.renderWorker(virt.createView(App));
