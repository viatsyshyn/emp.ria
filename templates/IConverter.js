NAMESPACE('ria.templates', function () {
    "use strict";

    /** @class ria.templates.IConverter */
    INTERFACE(
        GENERIC('TSource', 'TReturn'),
        'IConverter', [
            [[TSource]],
            TReturn, function convert(source) {}
        ])
});