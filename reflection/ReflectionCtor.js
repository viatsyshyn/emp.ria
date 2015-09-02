REQUIRE('ria.reflection.Reflector');

/** @namespace ria.reflection*/
NS('ria.reflection', function () {
    "use strict";

    var cache = {};

    /** @class ria.reflection.ReflectionCtor */
    CLASS(FINAL,
        'ReflectionCtor', EXTENDS(ria.reflection.Reflector), [

            function DROP_CACHE() {
                cache = {};
            },

            // $$ - instance factory
            function $$(instance, Clazz, ctor, args) {
                args = ria.__API.clone(args);
                var clazz = args[0],
                    ctorName = '$',
                    specs = args[2];

                if (!ria.__API.isClassConstructor(clazz))
                    throw new ria.reflection.Exception('ReflectionFactory works only on CLASS');

                var name = ria.__API.getIdentifierOfType(ria.__API.specify(clazz, specs)) + '@' + clazz.__REF_ID + '#' + ctorName;
                if (cache.hasOwnProperty(name))
                    return cache[name];

                return cache[name] = new ria.__API.init(instance, Clazz, ctor, args);
            },

            READONLY, ClassOf(Class), 'clazz',
            READONLY, String, 'name',

            [[ClassOf(Class)]],
            function $(clazz) {
                BASE();
                this.clazz = clazz;

                this.method = clazz.__META.defCtor;
                this.name = 'ctor';
            },

            String, function getName() { return this.clazz.__META.name + '#' + this.name; },

            OVERRIDE, Array, function getAnnotations() {
                return this.method.annotations;
            },

            ArrayOf(String), function getArguments() { return this.method.argsNames;},
            ArrayOf(String), function getRequiredArguments() {
                return this.getArguments()
                    .filter(function (_) { return !/^.+_$/.test(_) });
            },

            Array, function getArgumentsTypes() { return this.method.argsTypes;}
        ]);
});

