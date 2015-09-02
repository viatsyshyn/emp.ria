NAMESPACE('ria.serialize', function () {
    "use strict";

    /** @class ria.serialize.IDeserializable */
    INTERFACE(
        GENERIC('TSource'),
        'IDeserializable', [
            [[TSource]],
            VOID, function deserialize(raw) {}
        ])
});