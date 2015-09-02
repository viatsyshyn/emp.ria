/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 6/2/13
 * Time: 10:22 AM
 * To change this template use File | Settings | File Templates.
 */

REQUIRE('ria.ajax.JsonTask');

NAMESPACE('ria.ajax', function () {
    "use strict";

    /** @class ria.ajax.JsonPostTask */
    CLASS(
        'JsonPostTask', EXTENDS(ria.ajax.JsonTask), [
            function $(url) {
                BASE(url, ria.ajax.Method.POST);
            }
        ]);
});