REQUIRE('ria.reflection.Reflector');
REQUIRE('ria.reflection.ReflectionMethod');

/** @namespace ria.reflection*/
NS('ria.reflection', function () {
    "use strict";

    /** @class ria.reflection.ReflectionInterface */
    CLASS(
        FINAL, 'ReflectionInterface', EXTENDS(ria.reflection.Reflector), [
            READONLY, Interface, 'ifc',

            [[Interface]],
            function $(ifc) {
                BASE();
                this.ifc = ifc;
            },

            String, function getName() {
                return this.ifc.__META.name;
            },

            Array, function getMethodsNames() {
                return Object.keys(this.ifc.__META.methods)
            },

            Object, function getMethodInfo(name) { return this.ifc.__META.methods[name] || null; },
            function getMethodReturnType(name) { return this.ifc.__META.methods[name].retType; },
            ArrayOf(String), function getMethodArguments(name) { return this.ifc.__META.methods[name].argsNames;},
            ArrayOf(Object), function getMethodArgumentsTypes(name) { return this.ifc.__META.methods[name].argsTypes;},

            Boolean, function hasMethod(name) {
                return this.ifc.__META.methods.hasOwnProperty(name);
            },

            OVERRIDE, Array, function getAnnotations() {
                return []; // Interfaces has NO annotations
            },
        ]);
});
