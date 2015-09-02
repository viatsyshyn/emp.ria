ria = ria || {};
ria.__REQUIRE = ria.__REQUIRE || {};

(function () {
    "use strict";

    var global = this;

    var loaders = [];

    function defer(fn, args, scope) {
        setTimeout(function () { fn.apply(scope || this, args || []); }, 1);
    }

    /**
     * @param {String} uri
     * @returns {Function}
     */
    function findLoaderFor(uri) {
        var filtered = loaders.filter(function (_1) { return _1[0].call(global, uri); });
        return filtered && filtered[0] && filtered[0][1];
    }

    /**
     * @param {String} uri
     * @param {Function} loader
     */
    function loadWith(uri, loader) {
        var callbacks = [];
        var errbacks = [];

        defer(function () {
            loader(uri, function (content, error) {
                content && callbacks.forEach(function (cb) { defer(cb, [content]); });
                !content && error && errbacks.forEach(function (eb) { defer(eb, [error]); });
            });
        });

        return {
            done: function (callback) {
                callbacks.push(callback);
                return this;
            },

            error: function (errback) {
                errbacks.push(errback);
                return this;
            }
        }
    }

    /**
     * @param {Function} filter Filter should return true when it is capable of loading this item
     * @param {Function} loader Loader is responsible for loading given URI
     */
    ria.__REQUIRE.addLoader = function (filter, loader) {
        loaders.push([filter, loader]);
    };

    /**
     * Load given URI
     * @param {String} uri
     */
    ria.__REQUIRE.load = function (uri) {
        var loader = findLoaderFor(uri);
        if (loader == null)
            throw Error('Found not loader capable to load "' + uri + '"');

        return loadWith(uri, loader);
    };
})();
