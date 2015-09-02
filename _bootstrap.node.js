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

var path = require("path");
var fs = require("fs");
var vm = require("vm");
var sys = require("util");

function _bootstrap(__CFG) {
    "use strict";

    function resolve(path) {
        if (/^([0-9a-z_$]+(\.[0-9a-z_$]+)*)$/gi.test(path))
            path = path.replace(/\./gi, '/') + '.js';

        for(var prefix in libs) if (libs.hasOwnProperty(prefix)) {
            if (path.substr(0, prefix.length) == prefix) {
                path = libs[prefix] + path.substring(prefix.length);
                break;
            }
        }

        if (root)
            path = path.replace(/^~\//gi, root);
            
        if (appDir)
            path = path.replace(/^\.\//gi, appDir);

        if (!path.match(/^\//i) && !path.match(/^\w:\\/i) && appDir)
            path = appDir + path;

        return path.replace(/\/\//gi, '/');
    }

    var root = resolve(__CFG.appRoot || process.cwd()) + '/';
    var appDir = resolve(__CFG.appCodeDir || "~/app/");
    var assetsDir = resolve(__CFG.assetsDir || "~/assets/");
    var libs = __CFG.libs || {};

    if (!libs['ria/']) {
        libs['ria/'] = path.dirname(module.filename) + '/';
    }

    for(var prefix in libs) if (libs.hasOwnProperty(prefix)) {
      libs[prefix] = resolve(libs[prefix]);
    }

    var bootstrapContext = vm.createContext({
        console       : console,
        ria           : {},
                        
        _DEBUG        : true,
        _RELEASE      : false,
        
        _BROWSER      : false,
        _NODE         : true,
        
        _GLOBAL       : null,
        
        REQUIRE       : REQUIRE,
        NAMESPACE     : NS,
        NS            : NS,
        ASSET         : function () { return null; }
    });

    vm.runInContext('_GLOBAL = this;', bootstrapContext);

    var loaded = {};

    function load_global(file) {
        file = path.resolve(path.dirname(module.filename), file);
        try {
            if (loaded[file])
                return null;
        
            var code = fs.readFileSync(file, "utf8");
            vm.runInContext(code, bootstrapContext, file);
            loaded[file] = true;
            return null;
        } catch(ex) {
            // XXX: in case of a syntax error, the message is kinda
            // useless. (no location information).
            sys.debug("ERROR in file: " + file + "\n" + ex.stack);
            process.exit(1);
            return null;
        }
    }

    function REQUIRE(path) {
        load_global(resolve(path));
    }

    function NS(path, fn) {
        ria.__SYNTAX.NS(path, fn);
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

    if (__CFG.plugins)
        __CFG.plugins.forEach(REQUIRE);

    return {
        REQUIRE: REQUIRE,
        RUN: function (code) {
            if (typeof code == 'function') code = code.toString();
            vm.runInContext(code, bootstrapContext);
        }
    }
}


exports._bootstrap = _bootstrap;