NAMESPACE('ria.mvc', function () {
    "use strict";

    /**
     * @class ria.mvc.ISession
     */
    INTERFACE(
        'ISession', [
            [[String, Object]],
            Object, function get(key, def_) {},

            [[String, Object, Boolean]],
            VOID, function set(key, value, isPersistent_) {},

            [[String]],
            VOID, function remove(key) {}
        ]);
});
