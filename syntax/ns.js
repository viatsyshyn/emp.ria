/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

(function (global) {
    "use strict";

    function buildNs(ns, name) {
        return ns ? ns + '.' + name : name;
    }

    function setPath(path, value) {
        var p = path.split(/\./);
        var root = global;
        var name = p.pop();

        while (p.length) {
            var n = p.shift();
            if (!root.hasOwnProperty(n)) {
                ria.__SYNTAX.validateVarName(n);
                Object.defineProperty(root, n, { writable: false, configurable: false, value: {} });
            }

            root = root[n];
        }

        if (name && !root.hasOwnProperty(name)) {
            ria.__SYNTAX.validateVarName(name);
            Object.defineProperty(root, name, { writable: false, configurable: false, value: value });
        }
    }

    ria.__SYNTAX.getFullName = function (name) {
        return buildNs(CurrentNamespace, name);
    };

    ria.__SYNTAX.define = function (name, def) {
        setPath(name, def);
    };

    var CurrentNamespace = null;

    /**
     * @param {String} name
     * @param {Function} callback
     * @constructor
     */
    ria.__SYNTAX.NS = function (name, callback) {
        var old = CurrentNamespace;
        //noinspection JSUnusedAssignment
        setPath(CurrentNamespace = name, {});
        callback();
        CurrentNamespace = old;
    }
})(this);