REQUIRE('ria.templates.IConverter');

NAMESPACE('ria.templates', function () {
    "use strict";

    /** @class ria.templates.IConverterFactory */
    INTERFACE(
        'IConverterFactory', [
            [[ImplementerOf(ria.templates.IConverter)]],
            Boolean, function canCreate(converterClass) {},

            [[ImplementerOf(ria.templates.IConverter)]],
            ria.templates.IConverter, function create(converterClass) {}
        ]);
});