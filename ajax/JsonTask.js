/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 6/2/13
 * Time: 10:22 AM
 * To change this template use File | Settings | File Templates.
 */

REQUIRE('ria.ajax.Task');

NAMESPACE('ria.ajax', function () {
    "use strict";

    /** @class ria.ajax.JsonParseException */
    EXCEPTION(
        'JsonParseException', [
            [[String]],
            function $(json, e_) {
                BASE('Invalid JSON: ' + JSON.stringify(json), e_);
            }
        ]);

    /** @class ria.ajax.JsonGetTask */
    CLASS(
        'JsonTask', EXTENDS(ria.ajax.Task), [
            function $(url, method_, params_) {
                BASE(url, method_, params_);
            },

            OVERRIDE, ria.async.Future, function run() {
                return BASE()
                    .then(function (data) {
                        try {
                            return JSON.parse(data);
                        } catch (e) {
                            throw ria.ajax.JsonParseException(data, e);
                        }
                    })
            }
        ]);
});