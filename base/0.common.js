/**
 * Created with JetBrains WebStorm.
 * User: Volodymyr
 * Date: 18.09.12
 * Time: 10:35
 * To change this template use File | Settings | File Templates.
 */

/** @namespace ria */
var ria = ria || {};

/** @namespace ria.__API */
ria.__API = ria.__API || {};

(function () {
    "use strict";

    /**
     * Retuns prototype of given constuctor or object
     * @param {Function|Object} v
     * @return {*}
     */
    ria.__API.getPrototypeOf = function (v) {
        return Object.getPrototypeOf(v) || v.prototype || v.__proto__;
    };

    /**
     * Returns constructor of given object
     * @param {Object} v
     * @return {Function}
     */
    ria.__API.getConstructorOf = function (v) {
        return ria.__API.getPrototypeOf(v).constructor;
    };

    /**
     * Inherit from given class
     * @param {Function} superClass
     * @param {String} [name_]
     * @return {Object}
     */
    ria.__API.inheritFrom = function (superClass, name_) {
        _DEBUG && console.warn('ria.__API.inheritFrom is deprecated');

        var InheritanceProxyClass = function () { };

        if (_DEBUG) {
            InheritanceProxyClass = new Function ("return function " + (name_ || '') + "() { }")();
        }

        InheritanceProxyClass.prototype = superClass.prototype;
        var object = new InheritanceProxyClass();
        object.__proto__ = superClass.prototype;
        return object;
    };

    /**
     * Inherit subClass from superClass
     * @param {Function} subClass
     * @param {Function} superClass
     */
    ria.__API.extend = function (subClass, superClass) {
        var InheritanceProxyClass = function () { this.constructor = subClass };

        if (_DEBUG) {
            InheritanceProxyClass = new Function ("subClass", "return function " + (subClass.name || '') + "() { this.constructor = subClass }")(subClass);
        }

        InheritanceProxyClass.prototype = superClass.prototype;
        subClass.prototype = new InheritanceProxyClass();
        subClass.prototype.__proto__ = superClass.prototype;
        subClass.super_ = superClass.prototype;
    };

    /**
     * Merge the content of second object into the first object.
     * @param {Object} first
     * @param {Object} second
     */
    ria.__API.extendWithDefault = function (first, second){
        !_RELEASE && console.warn('Function ria.__API.extendWithDefault is deprecated. Use ria.__API.merge instead');

        for(var prop in second){
            if(!first.hasOwnProperty(prop))
                first[prop] = second[prop];
        }
        return first;
    };


    /**
     * Merges the content of all passed objects. Properties of first obj have grater priority
     * @param {Object} first
     * @param {Object} second...
     */
    ria.__API.merge = function me(first, second) {
        var al = arguments.length;
        if (al < 2) {
            return first || {};
        }

        first = first || {};
        second = second || {};

        var result = {};
        Object.keys(second).forEach(function (_) { result[_] = second[_]; });
        Object.keys(first).forEach(function (_) { result[_] = first[_]; });

        if (al == 2)
            return result;

        return me.apply(this, [result].concat([].slice.call(arguments, 2)));
    };

    /**
     * Instantiate object from ctor without call to ctor
     * @param {Function} ctor
     * @param {String} [name_]
     * @return {Object}
     */
    ria.__API.getInstanceOf = function (ctor, name_) {
        var f = function () { this.constructor = ctor; };

        if (_DEBUG) {
            f = new Function("ctor", "return function " + (ctor.name || '') + "() { this.constructor = ctor; }")(ctor);
        }

        f.prototype = ctor.prototype;
        var object = new f();
        object.__proto__ = ctor.prototype;
        return object;
    };

    /**
     * Get string name of given type
     * @param {Object} type
     * @return {String}
     */
    ria.__API.getIdentifierOfType = function getType(type, genericTypes, genericSpecs) {
        if (type === undefined) return 'void';
        //if (type === __API.Modifiers.SELF) return 'SELF';
        if (type === null) return '*';
        if (type === Function) return 'Function';
        if (type === Number) return 'Number';
        if (type === Boolean) return 'Boolean';
        if (type === String) return 'String';
        if (type === RegExp) return 'RegExp';
        if (type === Date) return 'Date';
        if (type === Array) return 'Array';
        if (type === Object) return 'Object';

        if (ria.__API.isSpecification(type)) {
            return getType(type.type, genericTypes || [], genericSpecs || [])
                + '.OF(' + type.specs.map(function (type) {
                    return getType(resolveGenericType(type, genericTypes || [], genericSpecs || []), genericTypes || [], genericSpecs || [])
                }).join(', ') + ')';
        }

        if (ria.__API.isArrayOfDescriptor(type) || ria.__API.isClassOfDescriptor(type) || ria.__API.isImplementerOfDescriptor(type))
            return type.toString();

        if (type.__META)
            return type.__META.name;

        /*if (isCustomType(type))
            return type.__IDENTIFIER__;

        if (isImportedType(type))
            return type.__IDENTIFIER__;*/

        return type.name || 'UnknownType';
    };

    /**
     * Get string name of type of given value
     * @param {Object} value
     * @return {String}
     */
    ria.__API.getIdentifierOfValue = function (value) {
        if (value === undefined || value === null)
            return 'void';

        if (typeof value === 'number') return 'Number';
        if (typeof value === 'boolean') return 'Boolean';
        if (typeof value === 'string') return 'String';
        if (typeof value === 'regexp') return 'RegExp';
        if (typeof value === 'date') return 'Date';
        if (typeof value === 'function') return 'Function';

        if (Array.isArray(value))
            return 'Array';

        if (ria.__API.getConstructorOf(value).__META) {
            var meta = ria.__API.getConstructorOf(value).__META;
            var name = meta.name;
            if (meta.genericTypes.length) {
                name += '.OF(' + meta.genericTypes.slice(meta.baseSpecs.length).map(function (type) {
                    return ria.__API.getIdentifierOfType(value.getSpecsOf(type.name));
                }) + ')';
            }
            return name;
        }

        if (value instanceof Object) {
            var ctor = ria.__API.getConstructorOf(value);
            if (ctor)
                return ctor.name || 'Constructor';
        }

        return 'Object';
    };

    /**
     * Clone object/array
     * @param {*} obj
     * @returns {*}
     */
    ria.__API.clone = function clone(obj) {
        switch(typeof obj) {
            case 'number':
            case 'string':
            case 'boolean':
            case 'regexp':
                return obj;

            default:
                if (Array.isArray(obj) || (obj.length !== null && obj.length === +obj.length))
                    return [].slice.call(obj);

                if ('function' == typeof obj.clone)
                    return obj.clone();

                if (ria.__API.getConstructorOf(obj) !== Object)
                    throw Error('Can not clone instance of ' + ria.__API.getIdentifierOfValue(obj));

                var result = {};
                Object.keys(obj).forEach(function (_) { result[_] = obj[_]; });

                return result;
        }
    };

    /**
     * Run method in next tick
     * @param {Object} scope
     * @param {Function} method
     * @param {Array} [args_]
     */
    ria.__API.defer = function defer(scope, method, args_, delay_) {
        setTimeout(function () { method.apply(scope, args_ || []); }, delay_ || 1);
    };

    function GeneralizedType(name, specs) {
        this.name = name;
        this.specs = specs;
    }

    ria.__API.GeneralizedType = GeneralizedType;

    ria.__API.getGeneralizedType = function (name, specs) {
        return new GeneralizedType(name, specs);
    };

    ria.__API.isGeneralizedType = function (type) {
        return type instanceof GeneralizedType;
    };

    function SpecifyDescriptor(type, specs) {
        this.type = type;
        this.specs = (specs || []).slice();
    }

    ria.__API.SpecifyDescriptor = SpecifyDescriptor;

    ria.__API.specify = function (type, specs) {
        return new SpecifyDescriptor(type, specs);
    };

    ria.__API.OF = function OF() {
        var specs = ria.__API.clone(arguments),
            clazz = this,
            baseSpecs = clazz.__META.baseSpecs || [],
            genericTypes = clazz.__META.genericTypes.slice(baseSpecs.length);

        try {
            _DEBUG && genericTypes.forEach(function (type, index) {
                var spec = specs[index];
                var typeSpecs = type.specs.slice();

                if (ria.__API.isGeneralizedType(spec)) {
                    var specSpecs = spec.specs.slice();
                    if (ria.__API.isClassOfDescriptor(typeSpecs[0])) {
                        if (!ria.__API.isClassOfDescriptor(specSpecs[0]))
                            throw Error('Generic type ' + type.name + ' restricts to ' + ria.__API.getIdentifierOfType(typeSpecs[0]));

                        try {
                            ria.__SYNTAX.checkArg(type.name, typeSpecs[0], specSpecs[0], [], [], true);
                        } catch (e) {
                            throw Exception('Generic type ' + type.name + ' restricts to ' + ria.__API.getIdentifierOfType(typeSpecs[0]) + ', but got ' + ria.__API.getIdentifierOfType(specSpecs[0]), e);
                        }

                        typeSpecs.shift();
                        specSpecs.shift();
                    }

                    var typeIfcSpecs = typeSpecs.map(function (_) { return _.valueOf() ;});
                    var specIfcSpecs = specSpecs.map(function (_) { return _.valueOf() ;});

                    if (!typeIfcSpecs.every(function (_) { return specIfcSpecs.indexOf(_) >= 0; }))
                        throw Error('Generic type ' + type.name + ' restricts to ' + typeIfcSpecs.map(function (_) { return ria.__API.getIdentifierOfType(_); }).join(',')
                            + ', but got ' + specIfcSpecs.map(function (_) { return ria.__API.getIdentifierOfType(_); }).join(','));

                } else {
                    typeSpecs.forEach(function (restriction) {
                        ria.__SYNTAX.checkArg(type.name, restriction, spec, [], [], true);
                    });
                }
            });
        } catch (e) {
            throw new Exception('Specification of ' + ria.__API.getIdentifierOfType(clazz) + ' failed.', e);
        }

        return new ria.__API.specify(clazz, specs);
    };

    ria.__API.isSpecification = function (type) {
        return type instanceof SpecifyDescriptor;
    };

    function resolveGenericType(type, generics, specs) {
        if (ria.__API.isGeneralizedType(type)) {
            var index = generics.indexOf(type);
            if (index >= 0)
                return specs[index] || Object;
        }

        return type;
    }

    ria.__API.resolveGenericType = resolveGenericType;
})();
