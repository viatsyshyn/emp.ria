/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    /**
     * @param {ria.__SYNTAX.Tokenizer} tkz
     */
    ria.__SYNTAX.parseDelegate = function (tkz) {
        ria.__SYNTAX.checkArg('tkz', [ria.__SYNTAX.Tokenizer], tkz);

        var genericTypes = null;
        if (tkz.check(ria.__SYNTAX.Tokenizer.GenericToken))
            genericTypes = tkz.next().value;

        var def = ria.__SYNTAX.parseMember(tkz);

        if (genericTypes) {
            def.genericTypes = genericTypes.types;
            genericTypes.undefine();
        }

        return def;
    };

    /**
     * @param {MethodDescriptor} def
     */
    ria.__SYNTAX.validateDelegateDecl = function (def) {
        ria.__SYNTAX.validateVarName(def.name);

        if(def.annotations.length)
            throw Error('Annotations are not supported in delegates');

        if(def.flags.isAbstract || def.flags.isOverride || def.flags.isFinal || def.flags.isUnSafe)
            throw Error('Modifiers are not supported in delegates');

        def.argsTypes.forEach(function(type){
            if(type instanceof ria.__SYNTAX.Tokenizer.SelfToken)
                throw Error('Argument type can\'t be SELF in delegates');
        });

        if(def.retType instanceof ria.__SYNTAX.Tokenizer.SelfToken)
            throw Error('Return type can\'t be SELF in delegates');

        // TODO: warn if has body
    };

    /**
     * @param {String} name
     * @param {MethodDescriptor} def
     * @return {Function}
     */
    ria.__SYNTAX.compileDelegate = function (name, def) {
        var delegate = ria.__API.delegate(
            name,
            def.retType ? def.retType.value : null,
            def.argsTypes.map(function (_) { return _.value; }),
            def.argsNames,
            def.genericTypes);

        delegate.OF = ria.__API.OF;

        _DEBUG && Object.freeze(delegate);

        return delegate;
    };

    /**
     * @function
     */
    function DELEGATE() {
        var def = ria.__SYNTAX.parseDelegate(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
        ria.__SYNTAX.validateDelegateDecl(def);
        var name = ria.__SYNTAX.getFullName(def.name);
        var delegate = ria.__SYNTAX.compileDelegate(name, def);
        ria.__SYNTAX.isProtected(name) || ria.__SYNTAX.define(name, delegate);
        return delegate;
    }

    ria.__SYNTAX.DELEGATE = DELEGATE;
})();