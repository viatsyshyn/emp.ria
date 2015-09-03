ria = ria || {};
ria.__REQUIRE = ria.__REQUIRE || {};

(function () {
    "use strict";

    var global = this;

    function defer(fn, args, scope) {
        setTimeout(function () { fn.apply(scope || this, args || []); }, 1);
    }

    ria.__REQUIRE.init = function (cfg, onBootstraped) {
        root.addReadyCallback(function () {
            onBootstraped.forEach(function (_) { defer(_) } );
        })
    };

    function resolve(path, isAsset) {
        var original = path;

        if (/^([0-9a-z_$]+(\.[0-9a-z_$]+)*)$/gi.test(path))
            path = path.replace(/\./gi, '/') + '.js';

        var libs = ria.__CFG['#require'].libs;
        var appRoot = ria.__CFG['#require'].appRoot;
        var appCodeDir = ria.__CFG['#require'][isAsset ? 'assetsDir' : 'appCodeDir'];

        if (!isAsset) {
            for(var prefix in libs) if (libs.hasOwnProperty(prefix)) {
                if (path.substr(0, prefix.length) == prefix) {
                    path = libs[prefix] + path;
                    break;
                }
            }
        }

        path = path.replace(/^~\//gi, appRoot);
        path = path.replace(/^\.\//gi, appCodeDir);

        if (!path.match(/^\/\//i))
            path = appCodeDir + path;

        path = (path.match(/^\/\//i) ? '/' : '') + path.replace(/\/\//gi, '/');

        return path;
    }

    function requireUri(uri, cb, isAsset) {
        var dep = ria.__REQUIRE.ModuleDescriptor.getById(resolve(uri, isAsset));

        var module = ria.__REQUIRE.ModuleDescriptor.getCurrentModule();
        module.addDependency(dep);
        cb && module.addReadyCallback(cb);

        return dep;
    }

    ria.__REQUIRE.requireAsset = function (uri) {
        return requireUri(uri, null, true);
    };

    ria.__REQUIRE.requireSymbol = function (symbol) {
        return requireUri(symbol, symbol.indexOf('/') >=0 ? null : function () {
            var root = _GLOBAL;
            symbol.split('.').forEach(function (part) {
                if (!root.hasOwnProperty(part))
                    throw Error('Symbol "' + symbol + '" not loaded.');

                root = root[part];
            });
        }, false);
    };

    var AssetAliases = [/ASSET\('([^']+)'\)/g];

    ria.__REQUIRE.addCurrentModuleCallback = function (ns, callback) {
        ns && ns.split('.').forEach(ria.__SYNTAX.validateVarName);

        var R = ria.__REQUIRE.ModuleDescriptor,
            root = R.getCurrentModule();

        AssetAliases.forEach(function (ASSET_REGEX) {
            var m, fn = callback.toString();

            while(m = ASSET_REGEX.exec(fn)) {
                root.addDependency(R.getById(resolve(m[1], true)));
                //fn = fn.substring(m.index + m[1].length);

            }
        });

        root.addReadyCallback(function () {
            ria.__SYNTAX.NS(ns, callback);
        });
    };

    /**
     * @param {String} uri
     * @return {*}
     */
    ria.__REQUIRE.getContent = function (uri) {
        return ria.__REQUIRE.ModuleDescriptor.getById(resolve(uri, true)).content;
    };

    ria.__REQUIRE.setContent = function (uri, content) {
        setTimeout(function() {
            ria.__REQUIRE.ModuleDescriptor.getById(resolve(uri, true)).content = content;
        }, 1);
    };

    ria.__REQUIRE.addAssetAlias = function(alias) {
        AssetAliases.push(new RegExp(
            alias.replace(/\./gi, '\\.')
            + '\\([\'"]([^\'"]+)[\'"]\\)', 'g'
        ))
    };

    /*ria.__REQUIRE.onReady = function (cb) {
        root.addReadyCallback(cb);
    };*/

    ria.__REQUIRE.addPlugin = function (cb) {
        var deps = [].slice.call(arguments);
        cb = deps.pop();

        var plugin = ria.__REQUIRE.ModuleDescriptor.getById('plugin-' + Math.random().toString(36).substr(2));
        plugin.state = 2;
        deps.forEach(function (symbol) {
            var dep = ria.__REQUIRE.ModuleDescriptor.getById(resolve(symbol));
            plugin.addDependency(dep);
        });
        plugin.addReadyCallback(cb);

        root.addDependency(plugin);
    };


    var root = ria.__REQUIRE.ModuleDescriptor.getCurrentModule();

    if (root.isNotLoaded())
        root.state = 2; // this is a hack

    ria.__REQUIRE.reloadJade = function () {
        !function walkModule(root) {
            if (/\.jade$/.test(root.id)) {
                root.content = null;
                ria.__REQUIRE.load(root.id)
                    .done(function (content) { this.content = this.content || content; }.bind(root));
            } else {
                root.deps.forEach(walkModule);
            }
        }(root);
    }
})();
