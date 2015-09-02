 /**
 * Created with JetBrains WebStorm.
 * User: paladin
 * Date: 12/10/12
 * Time: 5:17 AM
 * To change this template use File | Settings | File Templates.
 */

(function () {
    "use strict";

    var cfg = ria.__CFG['#mvc'] || {};

    if (!cfg.appClass)
        throw Error('__CFG.#mvc.appClass option is required.');

    var REQUIRE = ria.__REQUIRE.requireSymbol,
        NAMESPACE = ria.__REQUIRE.addCurrentModuleCallback;

    ria.__BOOTSTRAP.onBootstrapped(function () {
        REQUIRE('ria.dom.ready');
        REQUIRE(cfg.appClass);

        NAMESPACE('', function () {
            ria.dom.ready()
                .then(function () {
                    ria.mvc.Application.RUN(eval(cfg.appClass), cfg.settings);
                });
        });
    });
})();