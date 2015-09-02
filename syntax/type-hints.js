(ria = ria || {}).__SYNTAX = ria.__SYNTAX || {};
(ria = ria || {}).__CFG = ria.__CFG || {};

(function () {
    "use strict";

    var IS_OPTIONAL = /^.+_$/;

    function checkDelegate(value, type, genericTypes, genericSpecs) {
        if ('function' !== typeof value)
            return false;

        var method = value.__META;
        if (method) {
            var delegate = type.__META;

            try {
                var drt = ria.__API.resolveGenericType(delegate.ret, genericTypes, genericSpecs);

                if (delegate.ret !== null && method.ret !== drt && !checkTypeHint(method.ret, drt)) { //noinspection ExceptionCaughtLocallyJS
                    throw new Exception('Lambda returns ' + ria.__API.getIdentifierOfType(method.ret)
                        + ', but delegate expects ' + ria.__API.getIdentifierOfType(drt));
                }

                if (delegate.argsNames.length > method.argsNames.length) { //noinspection ExceptionCaughtLocallyJS
                    throw new Exception('Delegate passes at most ' + delegate.argsNames.length
                                            + ', but lambda accepts no more then ' + method.argsNames.length);
                }

                method.argsNames.forEach(function (name, index) {
                    if (!IS_OPTIONAL.test(name)) {
                        if (delegate.argsNames[index] == undefined) {
                            throw new Exception('Lambda required arguments ' + name + ' that delegate does not supply');
                        }
                    }

                    var dat = ria.__API.resolveGenericType(delegate.argsTypes[index] || Object, genericTypes, genericSpecs);

                    if (!checkTypeHint(method.argsTypes[index] || Object, dat)) {
                         throw new Exception('Lambda accepts ' + ria.__API.getIdentifierOfType(method.argsTypes[index]) + ' for argument ' + name
                             + ', but delegate supplies ' + ria.__API.getIdentifierOfType(dat));
                    }
                });
            } catch (e) {
                throw new Exception('Delegate validation error', e);
            }
        }

        return true;
    }

    /**
     * @param {*} value
     * @param {*} type
     * @return {Boolean}
     * @param {Array} genericTypes
     * @param {Array} genericSpecs
     */
    function checkTypeHint(value, type, genericTypes, genericSpecs) {
        type = ria.__API.resolveGenericType(type, genericTypes || [], genericSpecs || []);

        if (value === undefined)
            return false;

        if (value === null || type === Object)
            return true;

        switch (typeof value) {
            case 'number': return type === Number;
            case 'string': return type === String;
            case 'boolean': return type === Boolean;

            default:
                if ( value === Boolean
                  || value === String
                  || value === Number
                  || value === Function
                  || value === Date
                  || value === RegExp ) {
                    return value == type;
                }

                if (ria.__API.isSpecification(type) && ria.__API.isSpecification(value)) {
                    return type.type == value.type && type.specs.every(function (_, index) { return _ == value.specs[index] });
                }

                if (ria.__API.isDelegate(type))
                    return checkDelegate(value, type, type.__META.genericTypes, []);

                if (ria.__API.isSpecification(type) && ria.__API.isDelegate(type.type))
                    return checkDelegate(value, type.type, type.type.__META.genericTypes, type.specs);

                if (type === Function)
                    return 'function' === typeof value;

                if (type === ria.__API.Interface) {
                    return value === ria.__API.Interface || ria.__API.isInterface(value);
                }

                if (ria.__API.isInterface(type)) {
                    if (ria.__API.isInterface(value))
                        return value === type;

                    return (ria.__API.isClassConstructor(value) || value instanceof ria.__API.Class) && ria.__API.implements(value, type, genericTypes || [], genericSpecs || []);
                }

                if (ria.__API.isSpecification(type) && ria.__API.isInterface(type.type)) {
                    if (ria.__API.isInterface(value))
                        return false;

                    return (ria.__API.isClassConstructor(value) || value instanceof ria.__API.Class) && ria.__API.implements(value, type, genericTypes || [], genericSpecs || []);
                }

                if (ria.__API.isArrayOfDescriptor(type)) {
                    if (ria.__API.isArrayOfDescriptor(value))
                        return checkTypeHint(value.valueOf(), type.valueOf(), genericTypes || [], genericSpecs || []);

                    var t = type.valueOf();
                    return Array.isArray(value) && value.every(function (_) { return checkTypeHint(_, t, genericTypes || [], genericSpecs || []); });
                }

                if (ria.__API.isClassOfDescriptor(type)) {
                    if (ria.__API.isClassOfDescriptor(value))
                        value = value.valueOf();

                    if (ria.__API.isSpecification(value))
                        value = value.type;

                    return checkTypeHint(value, type.valueOf(), genericTypes || [], genericSpecs || []);
                }

                if (ria.__API.isImplementerOfDescriptor(type)) {
                    if (ria.__API.isImplementerOfDescriptor(value))
                        value = value.valueOf();

                    return checkTypeHint(value, type.valueOf(), genericTypes || [], genericSpecs || []);
                }

                if (ria.__API.isClassConstructor(type)) {
                    if (ria.__API.isClassConstructor(value))
                        return ria.__API.extendsBase(value, type);

                    return value instanceof type;
                }

                if (ria.__API.isSpecification(type) && ria.__API.isClassConstructor(type.type)) {
                    if (ria.__API.isClassConstructor(value)) {
                        return false;
                    }

                    if (value instanceof type.type) {
                        var meta = type.type.__META;
                        return meta.genericTypes.slice(meta.baseSpecs.length).every(function (_, index) {
                            //return value.getSpecsOf(_.name) == type.specs[index];
                            return checkTypeHint(value.getSpecsOf(_.name), type.specs[index], genericTypes || [], genericSpecs || []);
                        })
                    }

                    return false;
                }

                if (ria.__API.isGeneralizedType(type)) {
                    return ria.__API.isGeneralizedType(value) && type == value;
                }

                if (typeof type === 'function') {
                    return type === value || value instanceof type;
                }

                return false;
        }
    }

    ria.__SYNTAX.checkTypeHint = checkTypeHint;

    /**
     * @function
     * Ensure argument is of correct types
     * @param {String} name
     * @param {Array} type
     * @param {*} value
     * @param {Array} [genericTypes]
     * @param {Array} [genericSpecs]
     */
    ria.__SYNTAX.checkArg = function (name, type, value, genericTypes, genericSpecs, isType_) {
        var isOptional = IS_OPTIONAL.test(name);
        if (isOptional && value === undefined)
            return;

        if (!isOptional && value === undefined)
            throw Error('Argument ' + name + ' is required');

        if (!Array.isArray(type))
            type = [type];

        var error;
        var t = type.slice();
        while (t.length > 0) {
            var t_ = t.pop();
            try {
                if (checkTypeHint(value, t_, genericTypes || [], genericSpecs || []))
                    return;
            } catch (e) {
                error = e;
            }
        }

        throw new Exception('Argument ' + name + ' expected to be ' + type.map(function (_) {
            return ria.__API.getIdentifierOfType(_, genericTypes || [], genericSpecs || []);
            }).join(' or ') + ' but received ' + (isType_ ? ria.__API.getIdentifierOfType(value) : ria.__API.getIdentifierOfValue(value)), error);
    };

    /**
     * @function
     * Ensure arguments are of correct types
     * @param {String[]} names
     * @param {Array} types
     * @param {Array} values
     * @param {Array} genericTypes
     * @param {Array} genericSpecs
     */
    ria.__SYNTAX.checkArgs = function (names, types, values, genericTypes, genericSpecs) {
        if (values.length > names.length)
            throw Error('Too many arguments passed');

        for(var index = 0; index < names.length; index++) {
            ria.__SYNTAX.checkArg(names[index], types.length > index ? types[index] : Object, values[index], genericTypes, genericSpecs);
        }
    };

    /**
     * Ensure function return is of correct type
     * @param {*} type
     * @param {*} value
     */
    ria.__SYNTAX.checkReturn = function (type, value, genericTypes, genericSpecs) {
        if (type === null)
            return ;

        if (type === undefined && value !== undefined) {
            throw Error('No return expected but got ' + ria.__API.getIdentifierOfValue(value));
        }

        if (type !== undefined && !checkTypeHint(value, type, genericTypes || [], genericSpecs || []))
            throw Error('Expected return of ' + ria.__API.getIdentifierOfType(type, genericTypes || [], genericSpecs || []) + ' but got ' + ria.__API.getIdentifierOfValue(value));
    };

    var ProtectedMethodProxy = function () {
        throw Error('Can NOT call protected methods');
    };

    function toBaseProxy(value, type) {
        if (value.getClass().__META.flags)

        if (value.getClass() == type && value.__PROTECTED)
            return value;

        value = value.__PROTECTED || value;
        var proxy = ria.__API.getInstanceOf(type);

        proxy.__PROTECTED = value;

        var __pre = type.__META.__precalc;
        for(var i = 0 ; i < __pre.length;i += 2) {
            var name_ = __pre[i];
            proxy[name_] = __pre[i + 1].__META.isProtected() ? ProtectedMethodProxy : value[name_];
        }

        Object.freeze(proxy);

        return proxy;
    }

    function toInterfaceProxy(value, type) {
        return value;
        var proxy = ria.__API.getInstanceOf(type);

        proxy.__PROXIED = value;

        var __pre = type.__META.methods;
        for(var name_ in __pre) if (__pre.hasOwnProperty(name_)) {
            proxy[name_] = value[name_];
        }

        Object.freeze(proxy);

        return proxy;
    }

    function proxyBaseInterface(value, type) {
        if (value === null)
            return value;
        else if (ria.__API.isClassConstructor(type))
            return toBaseProxy(value, type);
        else if (ria.__API.isInterface(type))
            return toInterfaceProxy(value, type);
        else
            return value;
    }

    ria.__SYNTAX.proxyBaseInterface = proxyBaseInterface;

    if (_DEBUG) {
        var guessScopeName = function (scope) {
            if (!scope)
                return '';

            var name = ria.__API.getIdentifierOfValue(scope);
            if (name == 'StaticScope')
                return '';

            return ' class ' + name;
        };

        ria.__API.addPipelineMethodCallStage('BeforeCall',
            function (body, meta, scope, args, callSession, genericTypes, specs) {
                try {
                    ria.__SYNTAX.checkArgs(meta.argsNames, meta.argsTypes, args, genericTypes || [], specs || []);
                } catch (e) {
                    throw new ria.__API.Exception('Bad argument for ' + meta.name + guessScopeName(scope), e);
                }
            });

        ria.__API.addPipelineMethodCallStage('AfterCall',
            function (body, meta, scope, args, result, callSession, genericTypes, specs) {
                try {
                    ria.__SYNTAX.checkReturn(meta.ret, result, genericTypes || [], specs || []);
                } catch (e) {
                    throw new ria.__API.Exception('Bad return of ' + meta.name + guessScopeName(scope), e);
                }
                return result;
            });
    }

})();