/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 2/14/13
 * Time: 9:05 AM
 * To change this template use File | Settings | File Templates.
 */

(ria = ria || {}).__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    var registry = {};

    ria.__SYNTAX.Registry = {};

    ria.__SYNTAX.Registry.cleanUp = function () { registry = {}; };

    ria.__SYNTAX.Registry.find = function (name) {
        if ('string' !== typeof name)
            throw Error('String is only acceptable type for name');

        if (registry.hasOwnProperty('window.' + name))
            return registry['window.' + name];

        return registry.hasOwnProperty(name)
            ? registry[name]
            : null;
    };

    ria.__SYNTAX.Registry.registry = function (name, value) {
        if ('string' !== typeof name)
            throw Error('String is only acceptable type for name');

        registry[name] = value;
    };
})();