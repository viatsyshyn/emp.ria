
/** @namespace ria.__SYNTAX */
ria = ria || {};
ria.__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    /**
     * @param {String} name
     * @param {Object} val
     * @return {Function}
     */
    ria.__SYNTAX.validateIdentifierDecl = function (name, predefined_) {
        ria.__SYNTAX.validateVarName(name);

        if (typeof name !== 'string')
            throw Error('String is expected as enum name');

        var val = predefined_ || {};
        for (var prop in val) if (val.hasOwnProperty(prop)) {
            ria.__SYNTAX.validateVarName(prop);
            var value_ = val[prop];
            switch (typeof value_) {
                case 'number':
                case 'string':
                case 'boolean':
                    break;
                default:
                    throw Error('Identifier predefined value should Number, String or Boolean, got ' + (typeof value_))

            }
        }
    };

    /**
     * @param {String} name
     * @param {Object} [predefined_]
     * @return {Function}
     */
    ria.__SYNTAX.compileIdentifier = function (name, predefined_) {
        var values = {};
        function IdentifierValue(value) {
            ria.__SYNTAX.checkArg('value', [String, Number, Boolean], value);
            return values.hasOwnProperty(value) ? values[value] : (values[value] = new IdentifierValueImpl(value));
        }
        ria.__API.identifier(IdentifierValue, name);

        function IdentifierValueImpl(value) {
            _DEBUG && (this.__VALUE = value);
            this.valueOf = function () { return value; };
            this.toString = function () { return '[' + name + '#' + value + ']'; };
            _DEBUG && Object.freeze(this);
        }

        if (_DEBUG) {
            IdentifierValueImpl = new Function ("Object, name, _DEBUG",
                    "return " + IdentifierValueImpl.toString().replace('IdentifierValueImpl', ria.__SYNTAX.toSingleVarName(name)))(Object, name, _DEBUG);
        }

        ria.__API.extend(IdentifierValueImpl, IdentifierValue);

        var predefined = predefined_ || {};
        for(var k in predefined) if (predefined.hasOwnProperty(k)) {
            var value = predefined[k];
            IdentifierValue[k] = values[value] = new IdentifierValueImpl(value);
        }

        Object.freeze(IdentifierValue);
        Object.freeze(IdentifierValueImpl);

        return IdentifierValue;
    };

    ria.__SYNTAX.IDENTIFIER = function (n, predefined_) {
        ria.__SYNTAX.validateIdentifierDecl(n, predefined_);
        var name = ria.__SYNTAX.getFullName(n);
        var identifier = ria.__SYNTAX.compileIdentifier(name, predefined_);
        ria.__SYNTAX.isProtected(name) || ria.__SYNTAX.define(name, identifier);
        return identifier;
    };
})();