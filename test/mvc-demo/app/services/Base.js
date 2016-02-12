REQUIRE('ria.serialize.JsonSerializer');

REQUIRE('ria.ajax.JsonGetTask');

REQUIRE('app.model.PaginatedList');

NAMESPACE('app.services', function () {
    "use strict";

    /** @class app.services.DataException */
    EXCEPTION(
        'DataException', [
            function $(msg, inner_) {
                BASE(msg, inner_);
            }
        ]);

    // Single instance
    var Serializer = new ria.serialize.JsonSerializer;

    /** @class app.services.Base */
    CLASS(
        'Base', [
            [[String, Object]],
            ria.async.Future, function get(uri, clazz) {
                return new ria.ajax.JsonGetTask(uri)
                    .run()
                    .then(data => Serializer.deserialize(data, clazz));
            },

            [[String, Object, Number]],
            ria.async.Future, function getPage(uri, clazz, pageIndex) {
                return this.get(uri, clazz);
            }
        ]);
});
