window.REQUIRE = function (global) {
    "use strict";
    return function (symbol) {
        if (symbol.indexOf('/') >=0) return;

        var root = global;
        symbol.split('.').forEach(function (part) {
            if (!root.hasOwnProperty(part))
                throw Error('Symbol "' + symbol + '" not loaded.');

            root = root[part];
        });
    }
}(this);