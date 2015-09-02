REQUIRE('ria.reflection.Reflector');

/** @namespace ria.reflection*/
NS('ria.reflection', function () {
    "use strict";

    var cache = {};

    /** @class ria.reflection.ReflectionMethod */
    CLASS(
        FINAL, 'ReflectionMethod', EXTENDS(ria.reflection.Reflector), [

            function DROP_CACHE() {
                cache = {};
            },

            // $$ - instance factory
            function $$(instance, Clazz, ctor, args) {
                args = ria.__API.clone(args);
                var clazz = args[0],
                    methodName = args[1],
                    specs = args[2];

                if (!ria.__API.isClassConstructor(clazz))
                    throw new ria.reflection.Exception('ReflectionFactory works only on CLASS');

                var name = ria.__API.getIdentifierOfType(ria.__API.specify(clazz, specs)) + '@' + clazz.__REF_ID + '#' + methodName;
                if (cache.hasOwnProperty(name))
                    return cache[name];

                return cache[name] = new ria.__API.init(instance, Clazz, ctor, args);
            },

            READONLY, ClassOf(Class), 'clazz',
            READONLY, String, 'name',

            [[ClassOf(Class), String, Array]],
            function $(clazz, name, specs_) {
                BASE();
                this.clazz = clazz;
                this.method = clazz.__META.methods[name];
                this.name = name;
            },

            String, function getName() { return this.clazz.__META.name + '#' + this.name; },
            String, function getShortName() { return this.name; },
            //Boolean, function isAbstract() { return this.method.flags.isAbstract;},
            //Boolean, function isFinal() { return this.method.flags.isFinal; },
            //Boolean, function isOverride() { return this.method.flags.isOverride; },

            OVERRIDE, Array, function getAnnotations() { return this.method.annotations; },
            Object, function getReturnType() { return this.method.retType; },

            ArrayOf(String), function getArguments() { return this.method.argsNames;},

            ArrayOf(String), function getRequiredArguments() {
                return this.getArguments()
                    .filter(function (_) { return !/^.+_$/.test(_) });
            },

            Array, function getArgumentsTypes() { return this.method.argsTypes;},

            function invokeOn(instance, args_) {
                VALIDATE_ARG('instance', [this.clazz], instance);

                var impl = this.method.impl;
                if (_DEBUG) {
                    instance = instance.__PROTECTED || instance;
                }

                if (!_RELEASE && impl.__META) {
                    var genericTypes = this.clazz.__META.genericTypes;
                    var genericSpecs = this.clazz.__META.genericTypes.map(function (type, index) {
                        if (this.clazz.__META.baseSpecs.length > index)
                            return this.clazz.__META.genericTypes[index];

                        return instance.getSpecsOf(type.name);
                    }.bind(this));
                    impl = ria.__API.getPipelineMethodCallProxyFor(impl, impl.__META, instance, genericTypes, genericSpecs);
                }

                return impl.apply(instance, args_ || []);
            }
        ]);
});

