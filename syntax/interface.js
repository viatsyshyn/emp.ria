/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

(function () {
    "use strict";

    function isFactoryCtor(name) {
        return name !== '$$' && /^\$.*/i.test(name);
    }

    function isStaticMethod(name) {
        return name.toUpperCase() == name && /[_a-z].*/i.test(name);
    }

    function checkXxxOfIsSELF(token, descriptor) {
        return token.value instanceof descriptor
            && token.value.clazz == ria.__SYNTAX.Modifiers.SELF;
    }

    function processSelf(token, SELF) {
        if (Array.isArray(token))
            return token.map(function (_) { return processSelf(_, SELF); });

        if (!token)
            return token;

        if (token instanceof ria.__SYNTAX.Tokenizer.SelfToken)
            return new ria.__SYNTAX.Tokenizer.RefToken(SELF);

        if (checkXxxOfIsSELF(token, ria.__API.ArrayOfDescriptor))
            return new ria.__SYNTAX.Tokenizer.RefToken(ria.__API.ArrayOf(SELF));

        if (checkXxxOfIsSELF(token, ria.__API.ClassOfDescriptor))
            return new ria.__SYNTAX.Tokenizer.RefToken(ria.__API.ClassOf(SELF));

        if (checkXxxOfIsSELF(token, ria.__API.ImplementerOfDescriptor))
            return new ria.__SYNTAX.Tokenizer.RefToken(ria.__API.ImplementerOf(SELF));

        return token;
    }

    /**
     * @param {ClassDescriptor} def
     */
    ria.__SYNTAX.validateInterfaceDecl = function (def) {
        ria.__SYNTAX.validateVarName(def.name);

        // throw Error if any flags
        if (def.flags.isFinal)
            throw Error('Interface can NOT be marked with FINAL');

        if (def.flags.isAbstract)
            throw Error('Interface can NOT be marked with ABSTRACT');

        if (def.flags.isOverride)
            throw Error('Interface can NOT be marked with OVERRIDE');

        if (def.flags.isReadonly)
            throw Error('Interface can NOT be marked with READONLY');

        if (def.flags.isUnSafe)
            throw Error('Interface can NOT be marked with UNSAFE');

        // throw Error if any annotations;
        if (def.annotations.length != 0)
            throw Error('Annotation are not supported on interfaces');

        if (def.base != null)
            throw Error('Interface can NOT extend classes or interfaces');

        if (def.ifcs.values.length)
            throw Error('Interface can NOT implement interfaces');

        // validate no duplicate members
        def.methods
            .forEach(function (_) {
                var name = _.name;
                ria.__SYNTAX.validateVarName(name);

                if (def.methods.filter(function (_) { return _.name === name}).length > 1)
                    throw Error('Duplicate method declaration "' + name + '"');
            });

        // validate no duplicate members
        def.properties
            .forEach(function (_) {
                var name = _.name;
                ria.__SYNTAX.validateVarName(name);

                if (def.properties.filter(function (_) { return _.name === name}).length > 1)
                    throw Error('Duplicate property declaration "' + name + '"');
            });

        def.methods.map(
            /**
             * @param {MethodDescriptor} method
             */
            function (method) {
                if (isFactoryCtor(method.name) || method.name == '$$')
                    throw Error('Interface ctors, named ctors and factories are not supported');

                if(isStaticMethod(method.name))
                    throw Error('Interface static methods are not supported');

                if (method.flags.isAbstract || method.flags.isOverride || method.flags.isReadonly || method.flags.isFinal || method.flags.isUnSafe)
                    throw Error('Interface method can NOT be marked with ABSTRACT, OVERRIDE, READONLY or FINAL');

                if (method.annotations.length)
                    throw Error('Interface method can NOT be annotated');
            });

        def.properties.forEach(
            /**
             * @param {PropertyDescriptor} property
             */
            function (property) {
                if (property.flags.isAbstract || property.flags.isOverride || property.flags.isFinal || property.flags.isUnSafe )
                    throw Error('Interface property can NOT be marked with ABSTRACT, OVERRIDE or FINAL');

                if (property.annotations.length)
                    throw Error('Interface properties can NOT be annotated');
            });
    };

    /**
     * @param {String} name
     * @param {ClassDescriptor} def
     * @return {Function}
     */
    ria.__SYNTAX.compileInterface = function (name, def) {
        function InterfaceProxy() {
            throw Error('Anonymous classes from interfaces are not supported');

            // TODO: update to tokenizer
            /*var members = ria.__SYNTAX.parseMembers([].slice.call(arguments));
            var flags = {isFinal: true };
            var properties = members.filter(function (_1) { return _1 instanceof ria.__SYNTAX.PropertyDescriptor });
            var methods = members.filter(function (_1) { return _1 instanceof ria.__SYNTAX.MethodDescriptor });
            var def = new ria.__SYNTAX.ClassDescriptor('$AnonymousClass', ria.__API.Class, [InterfaceProxy], flags, [], properties, methods);
            var impl = ria.__SYNTAX.buildClass('$AnonymousClass', def);
            return impl();*/
        }

        if (_DEBUG) {
            InterfaceProxy = new Function("return " + InterfaceProxy.toString().replace('InterfaceProxy', ria.__SYNTAX.toSingleVarName(name)))();
        }

        var methods = def.methods.map(
        /**
         * @param {MethodDescriptor} method
         */
        function (method) {
            method.argsTypes = processSelf(method.argsTypes, InterfaceProxy);
            method.retType = processSelf(method.retType, InterfaceProxy);

            return [
                method.name,
                method.retType ? method.retType.value : null,
                method.argsTypes.map(function (_) { return _.value; }),
                method.argsNames
            ];
        });

        def.properties.forEach(
            /**
             * @param {PropertyDescriptor} property
             */
            function (property) {
                methods.push([
                    property.getGetterName(),
                    property.type instanceof ria.__SYNTAX.Tokenizer.SelfToken ? InterfaceProxy : property.type.value,
                    [],
                    []
                ]);

                if (property.flags.isReadonly)
                    return ;

                methods.push([
                    property.getSetterName(),
                    undefined,
                    [property.type instanceof ria.__SYNTAX.Tokenizer.SelfToken ? InterfaceProxy : property.type.value],
                    ['value']
                ]);
            });

        ria.__API.ifc(InterfaceProxy, name, methods, def.genericTypes);

        InterfaceProxy.OF = ria.__API.OF;

        Object.freeze(InterfaceProxy);
        ria.__SYNTAX.Registry.registry(name, InterfaceProxy);

        return InterfaceProxy;
    };

    /**
     * @function
     */
    function INTERFACE() {
        var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
        ria.__SYNTAX.validateInterfaceDecl(def);
        var name = ria.__SYNTAX.getFullName(def.name);
        var ifc = ria.__SYNTAX.compileInterface(name, def);
        ria.__SYNTAX.isProtected(name) || ria.__SYNTAX.define(name, ifc);
        return ifc;
    }

    ria.__SYNTAX.INTERFACE = INTERFACE;

    if (false) {
        ria.__API.addPipelineMethodCallStage('BeforeCall',
            function (body, meta, scope, args, result, callSession) {
                // TODO: wrap args into proxy if it's ifc
            });

        ria.__API.addPipelineMethodCallStage('AfterCall',
            function (body, meta, scope, args, result, callSession) {
                if (meta.ret && ria.__API.isInterface(meta.ret)) {
                    var fn = function AnonymousClass() {};
                    // TODO: wrap result into proxy if it's ifc
                }

                return result;
            });
    }
})();
