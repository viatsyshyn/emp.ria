
NAMESPACE('ria.async', function () {
    "use strict";

    /** @class ria.async.ICancelable */
    INTERFACE(
        'ICancelable', [
            VOID, function cancel() {}
        ]);
});
