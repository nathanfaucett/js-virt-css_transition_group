Virt CSSTransitionGroup
=======

Virt CSSTransitionGroup for the browser and node.js


```javascript
var CSSTransitionGroup = require("virt-css_transition_group");


// if not in same thread as DOM require this in DOM thread
require("virt-css_transition_group/src/handlers");


virt.createView(CSSTransitionGroup, {
        component: "ul"
    },
    children...
);


```