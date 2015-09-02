NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.MvcException */
    EXCEPTION(
        'MvcException', [
            [[String, Object]],
            function $(message, inner_) {
                BASE(message, inner_);
            }
        ]);
});