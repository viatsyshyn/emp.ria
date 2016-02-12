NAMESPACE('ria.mvc', function () {
    "use strict";

    /**
     * @class ria.mvc.IReadonlySession
     */
    INTERFACE(
        'IReadonlySession', [
            [[String, Object]],
            Object, function get(key, def_) {}
        ]);
});
