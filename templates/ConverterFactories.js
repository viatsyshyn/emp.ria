REQUIRE('ria.templates.Exception');
REQUIRE('ria.templates.IConverterFactory');

REQUIRE('ria.reflection.ReflectionClass');

NAMESPACE('ria.templates', function () {
    "use strict";

    var instanceSingleton = null;

    /** @class ria.templates.ConverterFactories */
    CLASS(
        'ConverterFactories', [
            // $$ - instance factory
            function $$(instance, Clazz, ctor, args) {
                return instanceSingleton ||( instanceSingleton = new ria.__API.init(instance, Clazz, ctor, args));
            },

            function $() {
                BASE();
                this._map = {};
                this._cache = {};
            },

            [[ria.templates.IConverterFactory]],
            VOID, function register(factory) {
                var hashCode = factory.getHashCode();
                if (this._map.hasOwnProperty(hashCode))
                    throw new ria.templates.Exception('Factory ' + ria.__API.getIdentifierOfValue(factory) + ' already registered');

                this._cache = {};
                this._map[hashCode] = factory;
            },

            [[ria.templates.IConverterFactory]],
            VOID, function unregister(factory) {
                var hashCode = factory.getHashCode();
                if (!this._map.hasOwnProperty(hashCode))
                    throw new ria.templates.Exception('Factory ' + ria.__API.getIdentifierOfValue(factory) + ' not registered');

                this._cache = {};
                delete this._map[factory.getHashCode()];
            },

            [[ImplementerOf(ria.templates.IConverter)]],
            ria.templates.IConverter, function create(converterClass) {
                var name = ria.__API.getIdentifierOfType(converterClass);
                if (this._cache.hasOwnProperty(name))
                    return this._cache[name];

                for (var key in this._map) if(this._map.hasOwnProperty(key)) {
                    var factory = this._map[key];
                    if (factory.canCreate(converterClass))
                        return this._cache[name] = factory.create(converterClass);
                }

                throw new Exception('No factory agreed to create convertor ' + name);
            }
        ]);
});