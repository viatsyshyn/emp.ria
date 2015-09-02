REQUIRE('ria.reflection.ReflectionClass');

NAMESPACE('ria.reflection', function () {

    // TODO: remove ria.reflection.ReflectionFactory

    /** @class ria.reflection.ReflectionFactory */
    ria.reflection.ReflectionFactory = function (clazz, reflector) {
        console && console.warn && console.warn('ria.reflection.ReflectionFactory is deprecated. Please use ' + ria.__API.getIdentifierOfType(reflector));

        if (reflector == undefined)
            reflector = ria.reflection.ReflectionClass;

        return new reflector(clazz);
    };
});