/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    /**
     * @param {ClassDescriptor} def
     */
    ria.__SYNTAX.validateException = function (def) {

        ria.__SYNTAX.validateClassDecl(def, 'Exception');

        if(def.annotations.length)
            throw Error('Annotations are not supported in delegates');

        if(def.flags.isAbstract || def.flags.isOverride || def.flags.isFinal)
            throw Error('Modifiers are not supported in exceptions');

        if(!ria.__SYNTAX.isDescendantOf(def.base.value ,ria.__API.Exception))
            throw Error('Errors can extend only from other exceptions');
    };

    ria.__SYNTAX.EXCEPTION = function () {
        var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
        ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Exception);
        ria.__SYNTAX.validateException(def);
        var name = ria.__SYNTAX.getFullName(def.name);
        var exception = ria.__SYNTAX.compileClass(name, def);
        ria.__SYNTAX.isProtected(name) || ria.__SYNTAX.define(name, exception);
        return exception;
    }
})();