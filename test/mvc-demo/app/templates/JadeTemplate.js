REQUIRE('ria.templates.CompiledTemplate');

NAMESPACE('app.templates', function () {
    "use strict";

    ASSET('~/assets/jade/render-with.jade')();

    /** @class app.templates.JadeTemplate */
    CLASS(
        'JadeTemplate', EXTENDS(ria.templates.CompiledTemplate), [
            Function, 'block'
        ])
});