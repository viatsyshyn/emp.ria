REQUIRE('ria.reflection.ReflectionClass');

REQUIRE('ria.serialize.Exception');
REQUIRE('ria.serialize.SerializeProperty');
REQUIRE('ria.serialize.IDeserializable');
REQUIRE('ria.serialize.ISerializable');
REQUIRE('ria.serialize.ISerializer');

REQUIRE('ria.async.wait');

NAMESPACE('ria.serialize', function () {
    "use strict";

    function isValue(_) { return _ !== null && _ !== undefined; }

    /** @class ria.serialize.JsonSerializer */
    CLASS(
        'JsonSerializer', IMPLEMENTS(ria.serialize.ISerializer), [

            Object, function serialize(object) {
                throw Error('Not implemented');
            },

            ria.async.Future, function serializeAsync(object) {
                throw Error('Not implemented');
            },

            Object, function deserialize(raw, clazz, instance_) {
                var value;

                if (clazz === Object)
                    return raw || {};

                if (clazz === Array && (Array.isArray(raw) || raw == null)) {
                    return raw || [];
                }

                if (clazz === Boolean) {
                    var intVal = Number(raw);
                    var isNum = !isNaN(intVal) && intVal > 0;
                    return raw === 'true' || raw === 'on' || raw === true || isNum;
                }

                if(clazz === Number && (raw === '' || raw === null)) {
                    return null;
                }

                if (clazz === Number || clazz === String) {
                    return clazz(raw || '');
                }

                if (ria.__API.isIdentifier(clazz)) {
                    if (raw === null || raw === undefined)
                        return null;

                    return clazz(raw);
                }

                if (ria.__API.isEnum(clazz)) {
                    if (raw === null || raw === undefined)
                        return null;

                    value = clazz(raw);
                    if (value == undefined)
                        throw new ria.serialize.Exception('Unknown value "' + JSON.stringify(raw) + '" of enum ' + clazz.__IDENTIFIER__);

                    return value;
                }

                var deserialize = this.deserialize;

                if (ria.__API.isArrayOfDescriptor(clazz)) {
                    if (raw === null || raw === undefined)
                        return [];

                    if (!Array.isArray(raw))
                        throw new ria.serialize.Exception('Value expected to be array, but got: ' + JSON.stringify(raw));

                    var type = clazz.valueOf();
                    if (ria.__API.isGeneralizedType(type) && instance_) {
                        type = instance_.getSpecsOf(type.name);
                    }

                    return raw.filter(isValue).map(function (_, i) {
                        try {
                            return deserialize(_, type, instance_);
                        } catch (e) {
                            throw new ria.serialize.Exception('Error deserializing ' + clazz + ' value with index ' + i, e);
                        }
                    });
                }

                var genericSpecs = [];
                if (ria.__API.isSpecification(clazz)) {
                    genericSpecs = clazz.specs;
                    clazz = clazz.type;
                }

                if (ria.__API.isClassConstructor(clazz)) {
                    if (raw === null || raw === undefined)
                        return null;

                    var ref = new ria.reflection.ReflectionClass(clazz);
                    value = ref.instantiate(genericSpecs);

                    if (ref.implementsIfc(ria.serialize.IDeserializable)) {
                        try {
                            ref.getMethodReflector('deserialize').invokeOn(value, [raw]);
                        } catch (e) {
                            throw new ria.serialize.Exception('Error in deserialize method of class ' + ref.getName(), e);
                        }
                        return value;
                    }

                    ref.getPropertiesReflector().forEach(function (property) {
                        if (property.isReadonly())
                            return ;

                        var name = property.getShortName();
                        if (property.isAnnotatedWith(ria.serialize.SerializeProperty))
                            name = property.findAnnotation(ria.serialize.SerializeProperty).pop().name;

                        try {
                            var tmp = null;
                            var r = raw;
                            var path = name.split('.').filter(isValue);
                            while (isValue(r) && path.length)
                                r = r[path.shift()];

                            if (isValue(r))
                                tmp = deserialize(r, property.getType(), value);

                            property.invokeSetterOn(value, tmp);
                        } catch (e) {
                            throw new ria.serialize.Exception('Error deserializing property "' + property.getName() + ', value: ' + JSON.stringify(r), e);
                        }
                    });

                    return value;
                }

                throw new ria.serialize.Exception('Unsupported type "' + ria.__API.getIdentifierOfType(clazz) + '"');
            },

            ria.async.Future, function deserializeAsync(raw, clazz, instance_) {
                var value;

                if (clazz === Object)
                    return ria.async.Future.$fromData(raw || {});

                if (clazz === Array && (Array.isArray(raw) || raw == null)) {
                    return ria.async.Future.$fromData(raw || []);
                }

                if (clazz === Boolean) {
                    var intVal = Number(raw);
                    var isNum = !isNaN(intVal) && intVal > 0;
                    return ria.async.Future.$fromData(raw === 'true' || raw === 'on' || raw === true || isNum);
                }

                if(clazz === Number && (raw === '' || raw === null)) {
                    return ria.async.Future.$fromData(null);
                }

                if (clazz === Number || clazz === String) {
                    return ria.async.Future.$fromData(isValue(raw) ? clazz(raw) : null);
                }

                if (ria.__API.isIdentifier(clazz)) {
                    return ria.async.Future.$fromData(isValue(raw) ? clazz(raw) : null);
                }

                if (ria.__API.isEnum(clazz)) {
                    if (raw === null || raw === undefined)
                        return ria.async.Future.$fromData(null);

                    value = clazz(raw);
                    if (value == undefined)
                        throw new ria.serialize.Exception('Unknown value "' + JSON.stringify(raw) + '" of enum ' + clazz.__IDENTIFIER__);

                    return ria.async.Future.$fromData(value);
                }

                var deserialize = this.deserializeAsync;

                if (ria.__API.isArrayOfDescriptor(clazz)) {
                    if (raw === null || raw === undefined)
                        return [];

                    if (!Array.isArray(raw))
                        throw new ria.serialize.Exception('Value expected to be array, but got: ' + JSON.stringify(raw));

                    var type = clazz.valueOf();
                    if (ria.__API.isGeneralizedType(type) && instance_) {
                        type = instance_.getSpecsOf(type.name);
                    }

                    return ria.async.wait(raw.filter(isValue).map(function (_, i) {
                        try {
                            return deserialize(_, type, instance_);
                        } catch (e) {
                            throw new ria.serialize.Exception('Error deserializing ' + clazz + ' value with index ' + i, e);
                        }
                    }));

                }

                var genericSpecs = [];
                if (ria.__API.isSpecification(clazz)) {
                    genericSpecs = clazz.specs;
                    clazz = clazz.type;
                }

                if (ria.__API.isClassConstructor(clazz)) {
                    if (raw === null || raw === undefined)
                        return null;

                    var ref = new ria.reflection.ReflectionClass(clazz);
                    value = ref.instantiate(genericSpecs);

                    if (ref.implementsIfc(ria.serialize.IDeserializable)) {
                        try {
                            return ria.async.Future.$fromData({})
                                .then(function () {
                                    ref.getMethodReflector('deserialize').invokeOn(value, [raw]);
                                    return value;
                                });
                        } catch (e) {
                            throw new ria.serialize.Exception('Error in deserialize method of class ' + ref.getName(), e);
                        }
                        //return value;
                    }

                    return ria.async.wait(ref.getPropertiesReflector()
                        .filter(function (property) {
                            return !property.isReadonly();
                        })
                        .map(function (property) {
                            var name = property.getShortName();
                            if (property.isAnnotatedWith(ria.serialize.SerializeProperty))
                                name = property.findAnnotation(ria.serialize.SerializeProperty).pop().name;

                            try {
                                var tmp = null;
                                var r = raw;
                                var path = name.split('.').filter(isValue);
                                while (isValue(r) && path.length)
                                    r = r[path.shift()];

                                if (isValue(r))
                                    tmp = deserialize(r, property.getType(), value);
                                else
                                    tmp = ria.async.Future.$fromData(null);

                                return tmp.then(function(tmp) {
                                    property.invokeSetterOn(value, tmp);
                                    return value;
                                });
                            } catch (e) {
                                throw new ria.serialize.Exception('Error deserializing property "' + property.getName() + ', value: ' + JSON.stringify(r), e);
                            }
                        }))
                        .then(function (d) {
                            return value;
                        });
                }

                throw new ria.serialize.Exception('Unsupported type "' + ria.__API.getIdentifierOfType(clazz) + '"');
            }
        ]);
});