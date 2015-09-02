/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    /**
     * @param {MethodDescriptor} def
     */
    ria.__SYNTAX.validateAnnotationDecl = function (def) {
        ria.__SYNTAX.validateVarName(def.name);

        if(def.annotations.length)
            throw Error('Annotations are not supported in annotations');

        if(def.flags.isAbstract || def.flags.isOverride || def.flags.isFinal || def.flags.isUnSafe)
            throw Error('Modifiers are not supported in annotations');

        if(def.retType !== null)
            throw Error('Return type is not supported in annotations');

        def.argsTypes.forEach(function(type){
            if(type instanceof ria.__SYNTAX.Tokenizer.SelfToken)
                throw Error('Argument type can\'t be SELF in annotations');
        });

        // TODO: warn if has body
    };

    /**
     * @param {String} name
     * @param {MethodDescriptor} def
     * @return {Function}
     */
    ria.__SYNTAX.compileAnnotation = function (name, def) {
        return ria.__API.annotation(
            name,
            def.argsTypes.map(function(_) { return _.value}),
            def.argsNames);
    };

    ria.__SYNTAX.ANNOTATION = function () {
        var def = ria.__SYNTAX.parseMember(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
        ria.__SYNTAX.validateAnnotationDecl(def);
        var name = ria.__SYNTAX.getFullName(def.name);
        var annotation = ria.__SYNTAX.compileAnnotation(name, def);
        ria.__SYNTAX.isProtected(name) || ria.__SYNTAX.define(name, annotation);
        return annotation;
    }
})();