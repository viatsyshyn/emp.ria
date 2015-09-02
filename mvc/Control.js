REQUIRE('ria.mvc.IContextable');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.Control */
    CLASS(ABSTRACT,
        'Control', IMPLEMENTS(ria.mvc.IContextable), [
            ria.mvc.IContext, 'context',

            /**
             * Method is called once Application is starting
             * A magic method 'cause you can load required resources
             */
            ria.async.Future, function onAppStart() {
                return ria.async.DeferredAction();
            },

            function init() {
                this.onCreate_();
            },

            ABSTRACT, VOID, function onCreate_() {},
            VOID, function onDispose_() {}
        ]);
});
