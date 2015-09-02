/** @namespace ria.__SYNTAX */
(ria = ria || {}).__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    ria.__SYNTAX.toSingleVarName = function (name) {
        return (name || '').replace(/[^a-z0-9_$]/gi, '_');
    };

    ria.__SYNTAX.isValidIdentifierName = function (name) {
        return /^[$_a-z]([$_a-z0-9])*$/i.test(name);
    };

    var KEYWORDS = ('break else new var case finally return void catch for switch while continue function this with '
        + 'default if throw delete in try do instanceof typeof true false null undefined').split(' ');
    ria.__SYNTAX.isKeyword = function (name) {
        return KEYWORDS.indexOf(name) >= 0;
    };

    var RIA_KEYWORDS = ('ANNOTATION CLASS EXTENDS IMPLEMENTS DELEGATE ENUM EXCEPTION IDENTIFIER INTERFACE NS '
        + 'NAMESPACE SELF BASE VOID OVERRIDE ClassOf ArrayOf ImplementerOf Assert OF').split(' ');
    ria.__SYNTAX.isRiaKeyword = function (name) {
        return RIA_KEYWORDS.indexOf(name) >= 0;
    };

    var RESERVED = ('abstract enum int short boolean export interface static byte extends long super char final native '
        + 'synchronized class float package throws const goto private transient debugger implements protected volatile '
        + 'double import public').split(' ');

    ria.__SYNTAX.isReservedIdentifier = function (name) {
        return RESERVED.indexOf(name) >= 0;
    };

    ria.__SYNTAX.isValidVarName = function (name) {
        return ria.__SYNTAX.isValidIdentifierName(name)
            && !ria.__SYNTAX.isKeyword(name)
            && !ria.__SYNTAX.isRiaKeyword(name)
            && !ria.__SYNTAX.isReservedIdentifier(name);
    };

    ria.__SYNTAX.validateVarName = function (name) {
        if (!ria.__SYNTAX.isValidVarName(name))
            throw Error('Invalid variable name ' + name);
    };

    ria.__SYNTAX.isProtected = function (name) {
        return /^.+_$/.test(name);
    };

    /**
     * @param {ria.__SYNTAX.Tokenizer} tkz
     * @return {Object}
     */
    ria.__SYNTAX.parseModifiers = function (tkz) {
        ria.__SYNTAX.checkArg('tkz', [ria.__SYNTAX.Tokenizer], tkz);

        var flags = {
            isAbstract: false,
            isFinal: false,
            isOverride: false,
            isReadonly: false,
            isUnSafe: false
        };

        while (!tkz.eot() && tkz.check(ria.__SYNTAX.Tokenizer.ModifierToken)) {
            switch(tkz.next().value) {
                case ria.__SYNTAX.Modifiers.ABSTRACT: flags.isAbstract = true; break;
                case ria.__SYNTAX.Modifiers.FINAL: flags.isFinal = true; break;
                case ria.__SYNTAX.Modifiers.OVERRIDE: flags.isOverride = true; break;
                case ria.__SYNTAX.Modifiers.READONLY: flags.isReadonly = true; break;
                case ria.__SYNTAX.Modifiers.UNSAFE: flags.isUnSafe = true; break;
            }
        }

        return flags;
    };

    /**
     * @param {ria.__SYNTAX.Tokenizer} tkz
     * @return {Object}
     */
    ria.__SYNTAX.parseAnnotations = function (tkz) {
        ria.__SYNTAX.checkArg('tkz', [ria.__SYNTAX.Tokenizer], tkz);

        var annotations = [];
        while(!tkz.eot() && tkz.check(ria.__SYNTAX.Tokenizer.ArrayToken)) {
            var a = tkz.next();
            if (a.values.length != 1
                //|| !(a.values[0] instanceof Tokenizer.FunctionCallToken || a.values[0] instanceof Tokenizer.RefToken)
                )
                throw Error('Annotation expected, eg [SomeAnnotation] or [SomeAnnotationWithParams("some values here")], or check if annotation is loaded');

            annotations.push(a.values[0]);
        }

        return annotations;
    };

    function MethodDescriptor(name, argsNames, argsTypes, retType, flags, body, annotations) {
        this.name = name;
        this.argsNames = argsNames;
        this.argsTypes = argsTypes;
        this.retType = retType;
        this.body = body;
        this.annotations = annotations;
        this.flags = flags;
    }

    ria.__SYNTAX.MethodDescriptor = MethodDescriptor;

    function capitalize(str) {
        return str.replace(/\w/,function (_1){ return _1.toUpperCase(); });
    }

    function PropertyDescriptor(name, type, annotations, flags, isOverride) {
        this.name = name;
        this.type = type;
        this.annotations = annotations;
        this.flags = flags;
        this.isOverride = isOverride === true;
    }

    PropertyDescriptor.prototype.isOfBooleanType = function () {
        return (this.type.value === Boolean);
    };

    PropertyDescriptor.prototype.getGetterName = function () {
        return (this.isOfBooleanType() ? 'is' : 'get') + capitalize(this.name);
    };

    PropertyDescriptor.prototype.getSetterName = function () {
        return 'set' + capitalize(this.name);
    };

    ria.__SYNTAX.PropertyDescriptor = PropertyDescriptor;
    /**
     *
     * @param {ria.__SYNTAX.Tokenizer} tkz
     * @return {MethodDescriptor|PropertyDescriptor}
     */
    ria.__SYNTAX.parseMember = function (tkz) {
        ria.__SYNTAX.checkArg('tkz', [ria.__SYNTAX.Tokenizer], tkz);
        //if (tkz.check(Tokenizer.ArrayToken))

        var annotations = ria.__SYNTAX.parseAnnotations(tkz);
        var argsHints = [];
        if (tkz.check(ria.__SYNTAX.Tokenizer.DoubleArrayToken))
            argsHints = tkz.next().values;

        var flags = ria.__SYNTAX.parseModifiers(tkz);

        var retType = null;
        if (tkz.check(ria.__SYNTAX.Tokenizer.RefToken)
                || tkz.check(ria.__SYNTAX.Tokenizer.FunctionCallToken)
                || tkz.check(ria.__SYNTAX.Tokenizer.VoidToken)
                || tkz.check(ria.__SYNTAX.Tokenizer.SelfToken))
            retType = tkz.next();

        if (tkz.check(ria.__SYNTAX.Tokenizer.StringToken))
            return new PropertyDescriptor(tkz.next().value, retType, annotations, flags);

        tkz.ensure(ria.__SYNTAX.Tokenizer.FunctionToken);
        var body = tkz.next();
        return new MethodDescriptor(body.getName(), body.getParameters(), argsHints, retType, flags, body, annotations);
    };

    /**
     *
     * @param {ria.__SYNTAX.Tokenizer} tkz
     */
    ria.__SYNTAX.parseMembers = function (tkz) {
        ria.__SYNTAX.checkArg('tkz', [ria.__SYNTAX.Tokenizer], tkz);

        var members = [];
        while (!tkz.eot())
            members.push(ria.__SYNTAX.parseMember(tkz));

        return members;
    };

    /**
     * @param {String} name
     * @param {Function} base
     * @param {Function[]} ifcs
     * @param {Object} flags
     * @param {AnnotationInstance[]} annotations
     * @param {PropertyDescriptor[]} properties
     * @param {MethodDescriptor[]} methods
     * @constructor
     */
    function ClassDescriptor(name, base, ifcs, flags, annotations, properties, methods, genericTypes) {
        this.name = name;
        this.base = base;
        this.ifcs = ifcs;
        this.flags = flags;
        this.annotations = annotations;
        this.properties = properties;
        this.methods = methods;
        this.genericTypes = genericTypes;
    }

    ria.__SYNTAX.ClassDescriptor = ClassDescriptor;

    /**
     * @param {ria.__SYNTAX.Tokenizer} tkz
     * @return {ClassDescriptor}
     */
    ria.__SYNTAX.parseClassDef = function (tkz) {
        ria.__SYNTAX.checkArg('tkz', [ria.__SYNTAX.Tokenizer], tkz);

        var genericTypes = null;
        if (tkz.check(ria.__SYNTAX.Tokenizer.GenericToken))
            genericTypes = tkz.next().value;

        var annotations = ria.__SYNTAX.parseAnnotations(tkz);
        var flags = ria.__SYNTAX.parseModifiers(tkz);
        tkz.ensure(ria.__SYNTAX.Tokenizer.StringToken);
        var name = tkz.next().value;
        var base = null;
        if (tkz.check(ria.__SYNTAX.Tokenizer.ExtendsToken))
            base = tkz.next();
        var ifcs = new ria.__SYNTAX.Tokenizer.ImplementsToken([]);
        if (tkz.check(ria.__SYNTAX.Tokenizer.ImplementsToken))
            ifcs = tkz.next();

        tkz.ensure(ria.__SYNTAX.Tokenizer.ArrayToken);
        var members = ria.__SYNTAX.parseMembers(tkz.next().getTokenizer());

        if (!tkz.eot())
            throw Error('Expected end of class declaration');

        var properties = members.filter(function (_1) {return _1 instanceof PropertyDescriptor; });
        var methods = members.filter(function (_1) {return _1 instanceof MethodDescriptor; });

        if (genericTypes)
            genericTypes.undefine();

        return new ClassDescriptor(name, base, ifcs, flags, annotations, properties, methods, genericTypes ? genericTypes.types : []);
    };

    /**
     * @param {ClassDescriptor} object
     * @param {ClassDescriptor} constructor
     * @returns {Boolean}
     */
    ria.__SYNTAX.isInstanceOf = function(object, constructor){
        var o = object;
        while (o.__proto__ != null) {
            if (o.__proto__ === constructor.prototype)
                return true;
            o = o.__proto__;
        }
        return false;
    };

    /**
     * @param {ClassDescriptor} clazz
     * @param {ClassDescriptor} constructor
     * @returns {Boolean}
     */
    ria.__SYNTAX.isDescendantOf = function(clazz, constructor){
        var o = clazz;
        while (o.__META != null) {
            if (o === constructor)
                break;

            o = o.__META.base;
        }
        return o === constructor;
    }
})();