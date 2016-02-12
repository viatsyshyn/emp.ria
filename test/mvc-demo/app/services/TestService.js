/**
 * Created with JetBrains WebStorm.
 * User: viatsyshyn
 * Date: 04.06.13
 * Time: 16:30
 * To change this template use File | Settings | File Templates.
 */

REQUIRE('app.model.CoordinateZ');

REQUIRE('app.services.Base');

NAMESPACE('app.services', function () {
    "use strict";

    /** @class app.services.TestService */
    CLASS(
        'TestService', EXTENDS(app.services.Base), [
            ria.async.Future, function getItems(page) {
                return this.getList('my-server-action', app.model.MyArrayViewModel, {
                    "page": page
                });
            },

            ria.async.Future, function getSector(x_, y_, z_) {
                return this.get('data/sample.json', ArrayOf(app.model.MyViewModel));
            }
        ])
});