REQUIRE('ria.mvc.DefaultApplication');
REQUIRE('ria.dom.SizzleDom');

REQUIRE('ria.controls.ActionLinkControl');

REQUIRE('app.controllers.NotesController');

_DEBUG && ria.__REQUIRE.addAssetAlias('ria.templates.TemplateBind');

NAMESPACE('app', function () {

    ASSET('~/assets/jade/controls/action-link.jade')();
    ASSET('~/assets/jade/controls/date-picker.jade')();

    /** @class app.Application */
    CLASS(
        'Application', EXTENDS(ria.mvc.DefaultApplication), [
            OVERRIDE, ria.async.Future, function onStart_() {
                return BASE()
                    .then(function (data) {
                        new ria.dom.Dom()
                            .fromHTML(ASSET('~/assets/jade/index.jade')())
                            .appendTo('#main');
                        return data;
                    });
            }
        ]);
});
