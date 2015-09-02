NAMESPACE('ria.serialize', function () {
    "use strict";

    /** @class ria.serialize.ISerializable */
    INTERFACE(
        GENERIC('TReturn'),
        'ISerializable', [
            TReturn, function serialize() {}
        ])
});