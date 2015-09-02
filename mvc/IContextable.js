REQUIRE('ria.mvc.IContext');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.IContextable */
    INTERFACE(
        'IContextable', [
            ria.mvc.IContext, 'context'
        ]);
});
