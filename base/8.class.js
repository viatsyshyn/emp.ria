(function () {
    "use strict";

    //noinspection JSUnusedLocalSymbols
    function TypeOf(type) {}

    /**
     * @param {String} name
     * @param {Function} base
     * @param {Function[]} ifcs
     * @param {Array} anns
     * @param {Array} isAbstract
     * @param {Array} genericTypes
     * @param {Array} baseSpecs
     */
    function ClassDescriptor(name, base, ifcs, anns, isAbstract, genericTypes, baseSpecs) {
        this.name = name;
        this.base = base;
        //noinspection JSUnusedGlobalSymbols
        this.ifcs = [].concat.call(base ? base.__META.ifcs : []).concat(ifcs);
        //noinspection JSUnusedGlobalSymbols
        this.anns = anns;
        this.isAbstract = isAbstract;
        this.properties = base ? ria.__API.clone(base.__META.properties) : {};
        this.methods = base ? ria.__API.clone(base.__META.methods) : {};
        this.defCtor = null;
        this.ctors = {};
        this.children = [];

        var gt = [];
        var bs = [];

        if (base) {
            bs = base.__META.baseSpecs || [];
            gt = base.__META.genericTypes.filter(function (bt) {
                return (genericTypes || []).every(function (_) { return _.name != bt.name });
            });
        }

        this.genericTypes = gt.concat(genericTypes);
        this.baseSpecs = bs.concat((baseSpecs || []).filter(function (_) { return !ria.__API.isGeneralizedType(_); } ));

        this.__precalc = [];
    }

    ClassDescriptor.prototype.addProperty = function (name, ret, anns, getter, setter) {
        this.properties[name] = {
            retType: ret,
            annotations: anns,
            getter: getter,
            setter: setter
        };
    };
    ClassDescriptor.prototype.addMethod = function (impl, name, ret, argsTypes, argsNames, anns) {
        this.methods[name] = {
            impl: impl,
            retType: ret,
            argsNames: argsNames,
            argsTypes:argsTypes,
            annotations: anns
        };
    };
    ClassDescriptor.prototype.addCtor = function (name, impl, argsTypes, argsNames, anns) {
        var def = {
            name: name,
            impl: impl,
            argsNames: argsNames,
            argsTypes:argsTypes,
            annotations: anns
        };

        if (name == '$')
            this.defCtor = def;

        this.ctors[def.name] = def;
    };
    ClassDescriptor.prototype.addChild = function (clazz) {
        if (!ria.__API.isClassConstructor(clazz))
            throw Error('Child should be a CLASS');

        if (clazz.__META.base.__META != this)
            throw Error('Child should extend me.');

        this.children.push(clazz);
    };

    ria.__API.ClassDescriptor = ClassDescriptor;

    var clazzRegister = {};

    /**
     * @param {String} name
     * @return {Function}
     */
    ria.__API.getClassByName = function(name) {
        return clazzRegister[name];
    };

    /**
     * @param {Function} clazz
     * @param {String} name
     * @param {Function} [base_]
     * @param {Function[]} [ifcs_]
     * @param {Annotation[]} [anns_]
     * @param {Boolean} [isAbstract_]
     * @param {Array} genericTypes_
     * @param {Array} baseSpecs_
     */
    ria.__API.clazz = function (clazz, name, base_, ifcs_, anns_, isAbstract_, genericTypes_, baseSpecs_) {
        clazzRegister[name] = clazz;

        clazz.__META = new ClassDescriptor(name, base_, ifcs_, anns_, isAbstract_ || false, genericTypes_ || [], baseSpecs_ || []);
        if (base_) {
            ria.__API.extend(clazz, base_);
            base_.__META.addChild(clazz);
        }
    };

    /**
     * @param {Function} clazz
     * @param {String} name
     * @param {*} [propType_]
     * @param {*[]} [anns_]
     * @param {Function} getter
     * @param {Function} setter
     */
    ria.__API.property = function (clazz, name, propType_, anns_, getter, setter) {
        //noinspection JSUndefinedPropertyAssignment
        getter.__META = new ria.__API.MethodDescriptor(_DEBUG ? 'getter of ' + name : '', propType_, [], []);
        if (setter)
        { //noinspection JSUndefinedPropertyAssignment
            setter.__META = new ria.__API.MethodDescriptor(_DEBUG ? 'setter of ' + name : '', undefined, [propType_], ['value']);
        }
        clazz.__META.addProperty(name, propType_, anns_, getter, setter);
    };

    /**
     * @param {Function} clazz
     * @param {Function} impl
     * @param {String} name
     * @param {*} [ret_]
     * @param {Array} [argsTypes_]
     * @param {String[]} [argsNames_]
     * @param {Annotation[]} [anns_]
     */
    ria.__API.method = function (clazz, impl, name, ret_, argsTypes_, argsNames_, anns_) {
        clazz.__META.addMethod(impl, name, ret_, argsTypes_, argsNames_, anns_);

        impl.__META = new ria.__API.MethodDescriptor(name, ret_, argsTypes_, argsNames_);

        _DEBUG && Object.freeze(impl);
    };

    /**
     * @param {Function} clazz
     * @param {Function} impl
     * @param {Array} [argsTypes_]
     * @param {String[]} [argsNames_]
     * @param {Annotation[]} [anns_]
     */
    ria.__API.ctor = function (name, clazz, impl, argsTypes_, argsNames_, anns_) {
        clazz.__META.addCtor(name, impl, argsTypes_, argsNames_, anns_);

        impl.__META = new ria.__API.MethodDescriptor(name, undefined, argsTypes_, argsNames_);
        _DEBUG && Object.freeze(impl);
    };

    var ProtectedMethodProxy = function () {
        throw Error('Can NOT call protected methods');
    };

    var __slice = function (arr, start, end) { return [].slice.call(arr, start, end); };

    /**
     * @param {Object} instance
     * @param {Function} clazz
     * @param {Function} ctor
     * @param {Arguments} args
     * @return {Object}
     */
    ria.__API.init = function (instance, clazz, ctor, args) {
        var __META = clazz.__META;

        if (__META.isAbstract)
            throw Error('Can NOT instantiate abstract class ' + __META.name);

        if (!(instance instanceof clazz))
            instance = ria.__API.getInstanceOf(clazz);

        var genericTypes = __META.genericTypes || [],
            genericTypesLength = genericTypes.length - __META.baseSpecs.length,
            ownGenericSpecs = __slice(args, 0, genericTypesLength),
            genericSpecs = __META.baseSpecs.concat(ownGenericSpecs);

        args = __slice(args, genericTypesLength);

        if (_DEBUG) {
            ria.__API.OF.apply(clazz, ownGenericSpecs);
        }

        var publicInstance = instance;
        if (_DEBUG) {
            instance = ria.__API.getInstanceOf(clazz);
            publicInstance.__PROTECTED = instance;
        }

        var __pre = __META.__precalc;
        for(var i = 0 ; i < __pre.length;) {
            var name_ = __pre[i],
                f_ = __pre[i+1],
                meta_ = f_.__META;

            if (!_RELEASE) {
                var fn = ria.__API.getPipelineMethodCallProxyFor(f_, meta_, instance, genericTypes, genericSpecs);
                if (_DEBUG) {
                    Object.defineProperty(instance, name_, { writable : false, configurable: false, enumerable: false, value: fn });
                    if (meta_.isProtected())
                        fn = ProtectedMethodProxy;

                    Object.defineProperty(publicInstance, name_, { writable : false, configurable: false, enumerable: false, value: fn });
                } else {
                    publicInstance[name_] = fn;
                }
            } else {
                instance[name_] = f_.bind(instance);
            }

            i+=2;
        }

        if (_DEBUG) {
            instance.$ = publicInstance.$ = undefined;
            for(var name in __META.ctors) {
                if (__META.ctors.hasOwnProperty(name)) {
                    Object.defineProperty(publicInstance, name, { writable : false, configurable: false, enumerable: false, value: undefined });
                    Object.defineProperty(instance, name, { writable : false, configurable: false, enumerable: false, value: undefined });
                }
            }
        }

        if (!_RELEASE && ctor.__META) {
            ctor = ria.__API.getPipelineMethodCallProxyFor(ctor, ctor.__META, instance, genericTypes, genericSpecs);
        }

        var specs = instance.__SPECS = {};
        genericTypes.forEach(function (_, index) {
            specs[_.name] = genericSpecs[index];
        });

        if (_DEBUG) for(var name in __META.properties) {
            if (__META.properties.hasOwnProperty(name)) {
                instance[name] = null;
            }
        }

        ctor.apply(instance, args);

        _DEBUG && Object.seal(instance);
        _DEBUG && Object.freeze(publicInstance);

        return publicInstance;
    };

    /**
     * @param {Object} instance
     * @param {Function} clazz
     * @param {Function} ctor
     * @param {Arguments} args
     * @return {Object}
     */
    ria.__API.initUnSafe = function (instance, clazz, ctor, args) {
        var __META = clazz.__META;

        if (__META.isAbstract)
            throw Error('Can NOT instantiate abstract class ' + __META.name);

        if (!(instance instanceof clazz))
            instance = ria.__API.getInstanceOf(clazz);

        var genericTypes = __META.genericTypes || [],
            genericTypesLength = genericTypes.length - __META.baseSpecs.length,
            ownGenericSpecs = __slice(args, 0, genericTypesLength),
            genericSpecs = __META.baseSpecs.concat(ownGenericSpecs);

        args = __slice(args, genericTypesLength);

        if (_DEBUG) {
            ria.__API.OF.apply(clazz, ownGenericSpecs);
        }

        var publicInstance = instance;
        if (_DEBUG) {
            instance = ria.__API.getInstanceOf(clazz);
            publicInstance.__PROTECTED = instance;
        }

        if (!_RELEASE) {
            var __pre = __META.__precalc;
            for(var i = 0 ; i < __pre.length;) {
                var name_ = __pre[i],
                    f_ = __pre[i + 1],
                    meta_ = f_.__META;

                var fn = ria.__API.getPipelineMethodCallProxyFor(f_, meta_, instance, genericTypes, genericSpecs);
                if (_DEBUG) {
                    Object.defineProperty(instance, name_, { writable: false, configurable: false, enumerable: false, value: fn });
                    if (meta_.isProtected())
                        fn = ProtectedMethodProxy;

                    Object.defineProperty(publicInstance, name_, { writable: false, configurable: false, enumerable: false, value: fn });
                } else {
                    publicInstance[name_] = fn;
                }

                i += 2;
            }

            if (ctor.__META) {
                ctor = ria.__API.getPipelineMethodCallProxyFor(ctor, ctor.__META, instance, genericTypes, genericSpecs);
            }
        }

        if (_DEBUG) {
            instance.$ = publicInstance.$ = undefined;
            for(var name in __META.ctors) {
                if (__META.ctors.hasOwnProperty(name)) {
                    Object.defineProperty(publicInstance, name, { writable : false, configurable: false, enumerable: false, value: undefined });
                    Object.defineProperty(instance, name, { writable : false, configurable: false, enumerable: false, value: undefined });
                }
            }
        }

        var specs = instance.__SPECS = {};
        genericTypes.forEach(function (_, index) {
            specs[_.name] = genericSpecs[index];
        });

        if (_DEBUG) for(var name in __META.properties) {
            if (__META.properties.hasOwnProperty(name)) {
                instance[name] = null;
            }
        }

        ctor.apply(instance, args);

        _DEBUG && Object.seal(instance);
        _DEBUG && Object.freeze(publicInstance);

        return publicInstance;
    };

    function StaticScope() {}
    var staticScopeInstance = new StaticScope();
    _DEBUG && Object.freeze(staticScopeInstance);

    var refId = Math.floor(Math.random() * 1000)+ 10000;

    ria.__API.compile = function(clazz) {
        for(var k in clazz) if (clazz.hasOwnProperty(k)) {
            var name_ = k;
            var f_ = clazz[name_];

            // TODO: skip all ctors
            if (typeof f_ === 'function' && ria.__API.isDelegate(f_)) {
                if (!_RELEASE && f_.__META) {
                    clazz[name_] = ria.__API.getPipelineMethodCallProxyFor(f_, f_.__META, staticScopeInstance);
                } else {
                    clazz[name_] = f_.bind(staticScopeInstance);
                }
            }
        }

        var __META = clazz.__META,
            proto = clazz.prototype,
            __pre = __META.__precalc = [];

        outer: for (var name_ in proto) {
            var f_ = proto[name_];
            if (typeof f_ == "function") {
                if (f_ == __META.defCtor.impl) {
                    continue outer;
                }

                for(var n_ in __META.ctors) {
                    if (f_ == __META.ctors[n_].impl)
                        continue outer;
                }

                if (name_ == 'constructor')
                    continue outer;

                //if (f_.__META instanceof ria.__API.MethodDescriptor)
                __pre.push(name_, f_);
            }
        }

        //console.info(clazz, __pre);

        clazz.__REF_ID = (refId++).toString(36);

        _DEBUG && Object.freeze(clazz);
    };

    ria.__API.extendsBase = function ext(child, base) {
        return child === base || (child != undefined && ext(child.__META.base, base));
    };

    ria.__API.isClassConstructor = function(type) {
        return type && (type.__META instanceof ClassDescriptor);
    };

    ria.__API.Class = (function () {
        function ClassBase() { return ria.__API.init(this, ClassBase, ClassBase.prototype.$, arguments); }
        ria.__API.clazz(ClassBase, 'Class', null, [], []);

        ria.__API.ctor('$', ClassBase, ClassBase.prototype.$ = function () {
            if (!this.__hashCode) {
                var hc = Math.random().toString(36);
                if (_DEBUG) {
                    Object.defineProperty(this, '__hashCode', {writable: false, configurable: false, value: hc});
                } else {
                    this.__hashCode = hc;
                }
            }
        }, [], [], []);

        ria.__API.method(ClassBase, ClassBase.prototype.getClass = function () {
            return ria.__API.getConstructorOf(this);
        }, 'getClass', Function, [], [], []);

        ria.__API.method(ClassBase, ClassBase.prototype.getHashCode = function () {
            return this.__hashCode;
        }, 'getHashCode', String, [], [], []);

        ria.__API.method(ClassBase, ClassBase.prototype.equals = function (other) {
            return other && this.getHashCode() === other.getHashCode();
        }, 'equals', Boolean, [ClassBase], ['other'], []);

        ria.__API.method(ClassBase, ClassBase.prototype.getSpecsOf = function (name) {
            return this.__SPECS[name];
        }, 'getSpecsOf', null, [String], ['name'], []);

        ria.__API.compile(ClassBase);
        return ClassBase;
    })();
})();