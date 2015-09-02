NAMESPACE('ria.reflection', function () {
    "use strict";

    /** @class ria.reflection.Exception */
    EXCEPTION('Exception', [
        [[String, Object]],
        function $(message, inner_) {
            BASE(message, inner);
        }
    ]);
});