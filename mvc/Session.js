REQUIRE('ria.mvc.ISession');

NAMESPACE('ria.mvc', function () {
    "use strict";

    function def(x, d) {
        return x === undefined ? d : x;
    }

    /** @class ria.mvc.Session */
    CLASS(
        'Session', IMPLEMENTS(ria.mvc.ISession), [

            function $() {
                BASE();
                this.items = {};
            },

            [[String, Object]],
            Object, function get(key, def_) {
                return def(this.items.hasOwnProperty(key) ? this.items[key] : def_, null);
            },

            [[String, Object, Boolean]],
            VOID, function set(key, value, isPersistent_) {
                this.items[key] = value;
            },

            [[String]],
            VOID, function remove(key) {
                delete this.items[key];
            }
        ]);
});
