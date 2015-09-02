REQUIRE('ria.async.Future');

NAMESPACE('ria.serialize', function () {

    /** @class ria.serialize.ISerializer */
    INTERFACE(
        'ISerializer', [
            Object, function serialize(object) {},
            ria.async.Future, function serializeAsync(object) {},
            Object, function deserialize(raw, clazz) {},
            ria.async.Future, function deserializeAsync(raw, clazz) {}
        ]);
});