/**
 * Created by viatsyshyn on 15.10.13.
 */

REQUIRE('ria.mvc.BaseContext');
REQUIRE('ria.mvc.StateSerializer');
REQUIRE('ria.mvc.Application');

NAMESPACE('ria.mvc', function () {

    /** @class ria.mvc.DefaultApplication */
    CLASS(
        'DefaultApplication', EXTENDS(ria.mvc.Application.OF(ria.mvc.BaseContext, ria.mvc.StateSerializer)), []);
});