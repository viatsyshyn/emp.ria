/**
 * Created with JetBrains WebStorm.
 * User: paladin
 * Date: 12/9/12
 * Time: 9:44 AM
 * To change this template use File | Settings | File Templates.
 */

var ria = {};
var _DEBUG = true;
var _RELEASE = false;
var _BROWSER = true;
var _NODE = false;
var _GLOBAL = window;

(function () {
    "use strict";

    ria.__BOOTSTRAP = ria.__BOOTSTRAP || {};

    ria.__CFG = {"#require": {"plugins": []}};

    var scripts = document.getElementsByTagName('script');
    for(var index = 0; index < scripts.length; index++) {
        var script = scripts[index];

        if (script.src.toString().match(/ria\/_bootstrap\.js$/i)) {
            var text = (script.innerText || script.innerHTML).toString().split('=').slice(1);
            ria.__CFG = JSON.parse(text.join('='));
        }
    }

    var siteRoot = ria.__CFG["#require"].siteRoot;
    if (siteRoot === undefined) {
        siteRoot = window.location.origin;
    }

    var serviceRoot = ria.__CFG["#require"].serviceRoot;
    if (serviceRoot === undefined) {
        serviceRoot = "/";
    }

    if (serviceRoot[serviceRoot.length - 1] != '/'){
        serviceRoot += '/';
    }

    if (siteRoot[siteRoot.length - 1] != '/' && serviceRoot[0] != '/'){
        siteRoot += '/';
    }

    var root = ria.__CFG["#require"].appRoot;
    if (root === undefined) {
        var t = window.location.pathname.split('/');
        t.pop();
        root = t.join('/') + '/';
    }

    var appDir = resolve(ria.__CFG["#require"].appCodeDir || "~/app/");
    var assetsDir = resolve(ria.__CFG["#require"].assetsDir || "~/assets/");

    // configuring ria.require.js
    ria.__CFG["#require"].appRoot = root;
    ria.__CFG["#require"].siteRoot = siteRoot;
    ria.__CFG["#require"].serviceRoot = serviceRoot;
    ria.__CFG["#require"].appCodeDir = appDir;
    ria.__CFG["#require"].assetsDir = assetsDir;
    var libs = ria.__CFG["#require"].libs = ria.__CFG["#require"].libs || {};

    function resolve(path) {
        if (/^([0-9a-z_$]+(\.[0-9a-z_$]+)*)$/gi.test(path))
            path = path.replace(/\./gi, '/') + '.js';

        for(var prefix in libs) if (libs.hasOwnProperty(prefix)) {
            if (path.substr(0, prefix.length) == prefix) {
                path = libs[prefix] + path.substring(prefix.length);
                break;
            }
        }

        if (root)   path = path.replace(/^~\//gi, root);
        if (appDir) path = path.replace(/^\.\//gi, appDir);

        if (!path.match(/^\//i) && appDir)
            path = appDir + path;

        return path.replace(/\/\//gi, '/');
    }

    function REQUIRE(path) {
        document.write("<" + "script src='" + resolve(path) + "' type='text/javascript'></" + "script>");
    }

    if (!ria.__CFG._bootstraps)
        ria.__CFG._bootstraps = [];

    if (ria.__CFG['#mvc'])
        ria.__CFG._bootstraps.push('ria/mvc');

    Object.freeze(ria.__CFG);

    if (ria.__CFG.stackTraceJs) {
        REQUIRE(ria.__CFG.stackTraceJs);
    }

    // load ria.base
    REQUIRE('ria/base/0.common.js');
    REQUIRE('ria/base/0.pipeline.js');
    REQUIRE('ria/base/0.stacktrace.js');
    REQUIRE('ria/base/5.annotations.js');
    REQUIRE('ria/base/5.delegates.js');
    REQUIRE('ria/base/5.enum.js');
    REQUIRE('ria/base/5.identifier.js');
    REQUIRE('ria/base/6.interface.js');
    REQUIRE('ria/base/8.class.js');
    REQUIRE('ria/base/9.arrayof.js');
    REQUIRE('ria/base/9.classof.js');
    REQUIRE('ria/base/9.implementerof.js');
    REQUIRE('ria/base/9.exception.js');

    // load ria.syntax
    REQUIRE('ria/syntax/annotations.js');
    REQUIRE('ria/syntax/assert.js');
    REQUIRE('ria/syntax/registry.js');
    REQUIRE('ria/syntax/tokenizer.js');
    REQUIRE('ria/syntax/parser2.js');
    REQUIRE('ria/syntax/class.js');
    REQUIRE('ria/syntax/delegate.js');
    REQUIRE('ria/syntax/enum.js');
    REQUIRE('ria/syntax/exception.js');
    REQUIRE('ria/syntax/identifier.js');
    REQUIRE('ria/syntax/interface.js');
    REQUIRE('ria/syntax/ns.js');
    REQUIRE('ria/syntax/type-hints.js');

    // load symbols
    REQUIRE('ria/syntax/yyy.symbols.js');
    REQUIRE('ria/syntax/zzz.init.js');

    // load ria.require
    REQUIRE('ria/require/loader.js');
    REQUIRE('ria/require/module.js');
    REQUIRE('ria/require/require.js');
    REQUIRE('ria/require/script-loader.js');
    REQUIRE('ria/require/zzz.symbols.js');

    var callbacks = [];
    ria.__BOOTSTRAP.onBootstrapped = function (cb) {callbacks.push(cb); };

    var boostraps = ria.__CFG._bootstraps;
    while(boostraps.length > 0) {
        REQUIRE(boostraps.shift() + '/_bootstrap.js');
    }

    (ria.__CFG['#require'].plugins || []).forEach(REQUIRE);

    ria.__BOOTSTRAP.complete = function () {
        ria.__REQUIRE.init(ria.__CFG['#require'], callbacks);
    };

    document.write('<' + 'script type="text/javascript" ' + '>ria.__BOOTSTRAP.complete()</' + 'script>');
})();