/** @namespace ria.__SYNTAX */
(ria = ria || {}).__SYNTAX = ria.__SYNTAX || {};

(function (global) {
    "use strict";

    /**
     * Checks if type is native js constructor
     * @param {*} type
     * @return {Boolean}
     */
    function isBuildInType(type) {
        return type === Function
            || type === String
            || type === Boolean
            || type === Number
            || type === RegExp
            || type === Object
            || type === Array
            || type === Date
    }

    /**
     * Checks if type is ria enabled custom constructor
     * @param {*} type
     * @return {Boolean}
     */
    function isCustomType(type) {
        return ria.__API.isClassConstructor(type)
            || ria.__API.isInterface(type)
            || ria.__API.isEnum(type)
            || ria.__API.isIdentifier(type)
            || ria.__API.isDelegate(type)
            || ria.__API.isSpecification(type);
            //|| ArrayOfDescriptor.isArrayOfDescriptor(type)
            ;
    }

    /**
     * Checks if type is ria enabled external constructor
     * @param type
     * @return {Boolean}
     */
    function isImportedType(type) {
        if (!type)
            throw Error('value expected');

        return false;
    }

    /**
     * Check if type is embedded or ria enabled type
     * @param {*} type
     * @return {Boolean}
     */
    function isType(type) {
        return isBuildInType(type) || isCustomType(type) || isImportedType(type);
    }

    function parseName(fn) {
        return fn.name || (fn.toString().substring(9).match(/[a-z0-9_$]+/i) || [])[0] || '';
    }

    function getParameters(fn) {
        var body = fn.toString().substring(8);
        var start = body.indexOf('(');
        var params = body.substring(start + 1, body.indexOf(')', start));
        return params.length > 0 ? params.replace(/\s+/g, '').split(',') : [];
    }

    var Modifiers = function () {
        function Modifiers() { throw Error(); }
        ria.__API.enumeration(Modifiers, 'Modifiers');
        function ModifiersImpl(raw) { this.valueOf = function () { return raw; } }
        ria.__API.extend(ModifiersImpl, Modifiers);
        Modifiers.OVERRIDE = new ModifiersImpl('OVERRIDE');
        Modifiers.ABSTRACT = new ModifiersImpl('ABSTRACT');
        Modifiers.VOID = new ModifiersImpl('VOID');
        Modifiers.SELF = new ModifiersImpl('SELF');
        Modifiers.FINAL = new ModifiersImpl('FINAL');
        Modifiers.READONLY = new ModifiersImpl('READONLY');
        Modifiers.UNSAFE = new ModifiersImpl('UNSAFE');
        //Object.freeze(Modifiers);
        return Modifiers;
    }();

    ria.__SYNTAX.Modifiers = Modifiers;

    function FunctionToken(value) {
        this.value = value;
    }

    FunctionToken.prototype.getName = function () {
        return parseName(this.value);
    };

    FunctionToken.prototype.getParameters = function () {
        return getParameters(this.value);
    };

    FunctionToken.prototype.hasBaseCall = function () {
        return /BASE\(/.test(this.value.toString()
            .replace(/\/\*[^\*]*\*\//g, '')         // replace /* .. */
            .replace(/\/\/[^\n\r]*[\n\r]/g, '')     // replace // ... \n
            );
    };

    function FunctionCallToken(token) {
        throw Error('This token type can not be detected at RtDebug')
    }

    function StringToken (str) {
        this.value = str;
        this.raw = str;
    }

    function RefToken (ref) {
        this.value = ref;
        this.raw = ref;
    }

    function ModifierToken(mod) {
        this.value = mod;
    }

    function ArrayToken(value, raw) {
        this.values = value;
        this.raw = raw;
    }

    ArrayToken.prototype.getTokenizer = function () {
        return new Tokenizer(this.raw);
    };

    function DoubleArrayToken(value, raw) {
        this.values = value;
        this.raw = raw;
    }

    function VoidToken() {}
    function SelfToken() {}

    function ExtendsToken(base, specs) {
        this.value = base;
        this.raw = base;
        this.specs = specs;
    }

    function ImplementsToken(ifcs) {
        this.raw = this.values = [].slice.call(ifcs);
    }

    /**
     * @param {Function} base
     * @constructor
     */
    function ExtendsDescriptor(base, specs) {
        this.base = base;
        this.specs = specs;
    }

    ria.__SYNTAX.ExtendsDescriptor = ExtendsDescriptor;

    ria.__SYNTAX.EXTENDS = function (base) {
        if (base === undefined)
            throw Error('Class expected, but got undefined. Check if it is defined already');

        var specs = [];
        if (ria.__API.isSpecification(base)) {
            specs = base.specs;
            base = base.type;
        }

        if (!ria.__API.isClassConstructor(base))
            throw Error('Class expected, but got ' + ria.__API.getIdentifierOfType(base));

        return new ExtendsDescriptor(base, specs);
    };

    /**
     * @param {Function[]} ifcs
     * @constructor
     */
    function ImplementsDescriptor(ifcs) {
        this.ifcs = ifcs;
    }

    ria.__SYNTAX.ImplementsDescriptor = ImplementsDescriptor;

    ria.__SYNTAX.IMPLEMENTS = function () {
        var ifcs = [].slice.call(arguments);

        if (ifcs.length < 1)
            throw Error('Interfaces expected, but got nothing');

        for(var index = 0; index < ifcs.length; index++) {
            var ifc = ifcs[index];

            if (ifc === undefined)
                throw Error('Interface expected, but got undefined. Check if it is defined already');

            if ((!ria.__API.isSpecification(ifc) || !ria.__API.isInterface(ifc.type))
                && !ria.__API.isInterface(ifc))
                throw Error('Interface expected, but got ' + ria.__API.getIdentifierOfType(ifc));
        }

        return new ImplementsDescriptor(ifcs);
    };

    function GenericToken(desc) {
        this.value = desc;
    }

    function GeneralizeDescriptor(types) {
        this.types = types.slice();

        this.define();
    }

    GeneralizeDescriptor.prototype.define = function () {
        this.types.forEach(function (type) { global[type.name] = type; });
    };

    GeneralizeDescriptor.prototype.undefine = function () {
        this.types.forEach(function (type) { delete global[type.name]; });
    };

    ria.__SYNTAX.GENERIC = function GENERIC() {
        var types = [];
        var args = ria.__API.clone(arguments);

        while(args.length) {
            var name = args.shift(), specs = [];
            if (typeof name != 'string')
                throw Error('Expected string as GeneralizedType name');

            if (args.length) {
                var hasClassOf = false;
                do {
                    var spec = args.shift();
                    if (typeof spec == 'string') {
                        args.unshift(spec);
                        break;
                    }

                    if (ria.__API.isClassOfDescriptor(spec)) {
                        if (hasClassOf)
                            throw Error('Only one ClassOf() is supported as restriction of GeneralizedType');

                        hasClassOf = true;
                        specs.push(spec);
                        continue;
                    }

                    if (ria.__API.isImplementerOfDescriptor(spec)) {
                        specs.push(spec);
                        continue;
                    }

                    throw Error('Only ClassOf() or ImplementerOf() are supported as restrictions of GeneralizedType')
                } while (args.length);
            }

            types.push(new ria.__API.GeneralizedType(name, specs));
        }

        return new GeneralizeDescriptor(types);
    };

    function Tokenizer(data) {
        this.token = this.token.bind(this);
        this.data = [].slice.call(data).map(this.token);
    }

    Tokenizer.prototype.token = function (token) {
        if (token instanceof Modifiers) {
            if (token == Modifiers.VOID)
                return new VoidToken();

            if (token == Modifiers.SELF)
                return new SelfToken();

            return new ModifierToken(token);
        }

        if (token instanceof ExtendsDescriptor)
            return new ExtendsToken(token.base, token.specs);

        if (token instanceof ImplementsDescriptor)
            return new ImplementsToken(token.ifcs);

        if (token instanceof GeneralizeDescriptor)
            return new GenericToken(token);

        if (Array.isArray(token) && token.length == 1 && Array.isArray(token[0]))
            return new DoubleArrayToken(token[0].map(this.token), token);

        if (Array.isArray(token))
            return new ArrayToken(token.map(this.token), token);

        if (typeof token === 'function' && !isType(token))
            return new FunctionToken(token);

        if (typeof token === 'string')
            return new StringToken(token);

        if (typeof token === 'function')
            return new RefToken(token);

        if (typeof token === 'object')
            return new RefToken(token);

        throw Error('Unexpected token, type: ' + typeof token);
    };

    Tokenizer.prototype.check = function (type) {
        return this.data[0] instanceof type;
    };

    Tokenizer.prototype.next = function () {
        return this.data.shift();
    };

    Tokenizer.prototype.ensure = function(type) {
        if (!this.check(type))
            throw Error('Expected ' + type.name);
    };

    Tokenizer.prototype.eot = function () {
        return this.data.length < 1;
    };

    Tokenizer.FunctionToken = FunctionToken;
    Tokenizer.FunctionCallToken = FunctionCallToken;
    Tokenizer.StringToken = StringToken;
    Tokenizer.RefToken = RefToken;
    Tokenizer.ModifierToken = ModifierToken;
    Tokenizer.ArrayToken = ArrayToken;
    Tokenizer.DoubleArrayToken = DoubleArrayToken;
    Tokenizer.VoidToken = VoidToken;
    Tokenizer.SelfToken = SelfToken;
    Tokenizer.ExtendsToken = ExtendsToken;
    Tokenizer.ImplementsToken = ImplementsToken;
    Tokenizer.GenericToken = GenericToken;

    ria.__SYNTAX.Tokenizer = Tokenizer;
})(_GLOBAL);