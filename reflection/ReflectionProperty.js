REQUIRE('ria.reflection.Reflector');

/** @namespace ria.reflection*/
NS('ria.reflection', function () {
    "use strict";

    var cache = {};

    /** @class ria.reflection.ReflectionProperty */
    CLASS(
        FINAL, 'ReflectionProperty', EXTENDS(ria.reflection.Reflector), [

            function DROP_CACHE() {
                cache = {};
            },

            // $$ - instance factory
            function $$(instance, Clazz, ctor, args) {
                args = ria.__API.clone(args);
                var clazz = args[0],
                    propName = args[1],
                    specs = args[2];

                if (!ria.__API.isClassConstructor(clazz))
                    throw new ria.reflection.Exception('ReflectionFactory works only on CLASS');

                var name = ria.__API.getIdentifierOfType(ria.__API.specify(clazz, specs)) + '@' + clazz.__REF_ID + '#' + propName;
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
                this.property = clazz.__META.properties[name];
                this.name = name;
            },

            String, function getName() { return this.clazz.__META.name + '#' + this.name; },
            String, function getShortName() { return this.name; },
            Boolean, function isReadonly() { return this.property.setter == undefined; },
            OVERRIDE, Array, function getAnnotations() { return this.property.annotations; },
            Object, function getType() { return this.property.retType; },

            function invokeGetterOn(instance) {
                VALIDATE_ARG('instance', [this.clazz], instance);
                var getter = this.property.getter;
                _DEBUG && (instance = instance.__PROTECTED || instance);

                if (!_RELEASE && getter.__META) {
                    var genericTypes = this.clazz.__META.genericTypes;
                    var genericSpecs = this.clazz.__META.genericTypes.map(function (type, index) {
                        if (this.clazz.__META.baseSpecs.length > index)
                            return this.clazz.__META.baseSpecs[index];

                        return instance.getSpecsOf(type.name);
                    }.bind(this));
                    getter = ria.__API.getPipelineMethodCallProxyFor(getter, getter.__META, instance, genericTypes, genericSpecs);
                }

                return getter.call(instance);
            },

            VOID, function invokeSetterOn(instance, value) {
                VALIDATE_ARG('instance', [this.clazz], instance);
                var setter = this.property.setter;
                if (_DEBUG) {
                    instance = instance.__PROTECTED || instance;
                }

                if (!_RELEASE && setter.__META) {
                    var genericTypes = this.clazz.__META.genericTypes;
                    var genericSpecs = this.clazz.__META.genericTypes.map(function (type, index) {
                        if (this.clazz.__META.baseSpecs.length > index)
                            return this.clazz.__META.baseSpecs[index];

                        return instance.getSpecsOf(type.name);
                    }.bind(this));
                    setter = ria.__API.getPipelineMethodCallProxyFor(setter, setter.__META, instance, genericTypes, genericSpecs);
                }

                setter.call(instance, value);
            }
        ]);
});


