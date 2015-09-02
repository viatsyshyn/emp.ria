(function() {
    var __ASSETS = {};
    var _DEBUG;
    (function() {
        (ria = ria || this.ria || {}).__CFG = ria.__CFG || [].slice.call(document.getElementsByTagName("script")).map(function(_) {
            return _.innerText || _.innerHTML;
        }).filter(function(text) {
            return text.match(/ria\.__CFG\s+=\s+\{/);
        }).map(function(text) {
            return JSON.parse(text.split("=").pop());
        }).pop();
    })();
    function ASSET(id) {
        return __ASSETS[id];
    }
    var ria = ria || {};
    ria.__API = ria.__API || {};
    (function() {
        "use strict";
        ria.__API.getPrototypeOf = function(v) {
            return Object.getPrototypeOf(v) || v.prototype || v.__proto__;
        };
        ria.__API.getConstructorOf = function(v) {
            return ria.__API.getPrototypeOf(v).constructor;
        };
        ria.__API.inheritFrom = function(superClass) {
            function InheritanceProxyClass() {}
            InheritanceProxyClass.prototype = superClass.prototype;
            return new InheritanceProxyClass();
        };
        ria.__API.extend = function(subClass, superClass) {
            subClass.prototype = ria.__API.inheritFrom(superClass);
            subClass.prototype.constructor = subClass;
            subClass.super_ = superClass.prototype;
        };
        ria.__API.extendWithDefault = function(first, second) {
            for (var prop in second) {
                if (!first.hasOwnProperty(prop)) first[prop] = second[prop];
            }
            return first;
        };
        ria.__API.getInstanceOf = function(ctor, name_) {
            var f = function InstanceOfProxy() {
                this.constructor = ctor;
            };
            if (ria.__CFG.prettyStackTraces) f = new Function("ctor", "return " + f.toString().replace("InstanceOfProxy", name_))(ctor);
            f.prototype = ctor.prototype;
            return new f();
        };
        ria.__API.getIdentifierOfType = function getType(type, genericTypes, genericSpecs) {
            if (type === undefined) return "void";
            if (type === null) return "*";
            if (type === Function) return "Function";
            if (type === Number) return "Number";
            if (type === Boolean) return "Boolean";
            if (type === String) return "String";
            if (type === RegExp) return "RegExp";
            if (type === Date) return "Date";
            if (type === Array) return "Array";
            if (type === Object) return "Object";
            if (ria.__API.isSpecification(type)) {
                return getType(type.type, genericTypes || [], genericSpecs || []) + ".OF(" + type.specs.map(function(type) {
                    return getType(resolveGenericType(type, genericTypes || [], genericSpecs || []), genericTypes || [], genericSpecs || []);
                }).join(", ") + ")";
            }
            if (ria.__API.isArrayOfDescriptor(type) || ria.__API.isClassOfDescriptor(type) || ria.__API.isImplementerOfDescriptor(type)) return type.toString();
            if (type.__META) return type.__META.name;
            return type.name || "UnknownType";
        };
        ria.__API.getIdentifierOfValue = function(value) {
            if (value === undefined || value === null) return "void";
            if (typeof value === "number") return "Number";
            if (typeof value === "boolean") return "Boolean";
            if (typeof value === "string") return "String";
            if (typeof value === "regexp") return "RegExp";
            if (typeof value === "date") return "Date";
            if (typeof value === "function") return "Function";
            if (Array.isArray(value)) return "Array";
            if (ria.__API.getConstructorOf(value).__META) {
                var meta = ria.__API.getConstructorOf(value).__META;
                var name = meta.name;
                if (meta.genericTypes.length) {
                    name += ".OF(" + meta.genericTypes.map(function(type) {
                        return ria.__API.getIdentifierOfType(value.getSpecsOf(type.name));
                    }) + ")";
                }
                return name;
            }
            if (value instanceof Object) {
                var ctor = ria.__API.getConstructorOf(value);
                if (ctor) return ctor.name || "Constructor";
            }
            return "Object";
        };
        ria.__API.clone = function clone(obj) {
            switch (typeof obj) {
              case "number":
              case "string":
              case "boolean":
              case "regexp":
                return obj;

              default:
                if (Array.isArray(obj) || obj.length === +obj.length) return [].slice.call(obj);
                if ("function" == typeof obj.clone) return obj.clone();
                if (ria.__API.getConstructorOf(obj) !== Object) throw Error("Can not clone instance of " + ria.__API.getIdentifierOfValue(obj));
                var result = {};
                Object.keys(obj).forEach(function(_) {
                    result[_] = obj[_];
                });
                return result;
            }
        };
        ria.__API.defer = function defer(scope, method, args_, delay_) {
            setTimeout(function() {
                method.apply(scope, args_ || []);
            }, delay_ || 1);
        };
        function GeneralizedType(name, specs) {
            this.name = name;
            this.specs = specs;
        }
        ria.__API.GeneralizedType = GeneralizedType;
        ria.__API.getGeneralizedType = function(name, specs) {
            return new GeneralizedType(name, specs);
        };
        ria.__API.isGeneralizedType = function(type) {
            return type instanceof GeneralizedType;
        };
        function SpecifyDescriptor(type, specs) {
            this.type = type;
            this.specs = (specs || []).slice();
        }
        ria.__API.SpecifyDescriptor = SpecifyDescriptor;
        ria.__API.specify = function(type, specs) {
            return new SpecifyDescriptor(type, specs);
        };
        ria.__API.OF = function OF() {
            var specs = ria.__API.clone(arguments), clazz = this, baseSpecs = clazz.__META.baseSpecs || [], genericTypes = clazz.__META.genericTypes.slice(baseSpecs.length);
            try {
                _DEBUG && genericTypes.forEach(function(type, index) {
                    var spec = specs[index];
                    var typeSpecs = type.specs.slice();
                    if (ria.__API.isGeneralizedType(spec)) {
                        var specSpecs = spec.specs.slice();
                        if (ria.__API.isClassOfDescriptor(typeSpecs[0])) {
                            if (!ria.__API.isClassOfDescriptor(specSpecs[0])) throw Error("Generic type " + type.name + " restricts to " + ria.__API.getIdentifierOfType(typeSpecs[0]));
                            try {
                                ria.__SYNTAX.checkArg(type.name, typeSpecs[0], specSpecs[0]);
                            } catch (e) {
                                throw ria.__API.Exception("Generic type " + type.name + " restricts to " + ria.__API.getIdentifierOfType(typeSpecs[0]) + ", but got " + ria.__API.getIdentifierOfType(specSpecs[0]), e);
                            }
                            typeSpecs.shift();
                            specSpecs.shift();
                        }
                        var typeIfcSpecs = typeSpecs.map(function(_) {
                            return _.valueOf();
                        });
                        var specIfcSpecs = specSpecs.map(function(_) {
                            return _.valueOf();
                        });
                        if (!typeIfcSpecs.every(function(_) {
                            return specIfcSpecs.indexOf(_) >= 0;
                        })) throw Error("Generic type " + type.name + " restricts to " + typeIfcSpecs.map(function(_) {
                            return ria.__API.getIdentifierOfType(_);
                        }).join(",") + ", but got " + specIfcSpecs.map(function(_) {
                            return ria.__API.getIdentifierOfType(_);
                        }).join(","));
                    } else {
                        typeSpecs.forEach(function(restriction) {
                            ria.__SYNTAX.checkArg(type.name, restriction, spec);
                        });
                    }
                });
            } catch (e) {
                throw new ria.__API.Exception("Specification of " + ria.__API.getIdentifierOfType(clazz) + " failed.", e);
            }
            return new ria.__API.specify(clazz, specs);
        };
        ria.__API.isSpecification = function(type) {
            return type instanceof SpecifyDescriptor;
        };
        function resolveGenericType(type, generics, specs) {
            if (ria.__API.isGeneralizedType(type)) {
                var index = generics.indexOf(type);
                if (index >= 0) return specs[index] || Object;
            }
            return type;
        }
        ria.__API.resolveGenericType = resolveGenericType;
    })();
    (function() {
        "use strict";
        var pmcStages = {
            callInit_: [],
            OnCallInit: function(body, meta, scope, callSession, genericTypes, specs) {
                this.callInit_.forEach(function(_) {
                    _(body, meta, scope, callSession, genericTypes, specs);
                });
            },
            beforeCall_: [],
            OnBeforeCall: function(body, meta, scope, args, callSession, genericTypes, specs) {
                this.beforeCall_.forEach(function(_) {
                    _(body, meta, scope, args, callSession, genericTypes, specs);
                });
            },
            afterCall_: [],
            OnAfterCall: function(body, meta, scope, args, result, callSession, genericTypes, specs) {
                this.afterCall_.forEach(function(_) {
                    result = _(body, meta, scope, args, result, callSession, genericTypes, specs);
                });
                return result;
            },
            callFinally_: [],
            OnCallFinally: function(body, meta, scope, callSession, genericTypes, specs) {
                this.callFinally_.forEach(function(_) {
                    _(body, meta, scope, callSession, genericTypes, specs);
                });
            }
        };
        function PipelineMethodCall(body, meta, scope, args, genericTypes, specs) {
            var callSession = {};
            pmcStages.OnCallInit(body, meta, scope, callSession, genericTypes, specs);
            try {
                pmcStages.OnBeforeCall(body, meta, scope, args, callSession, genericTypes, specs);
                var result = body.apply(scope, args);
                return pmcStages.OnAfterCall(body, meta, scope, args, result, callSession, genericTypes, specs);
            } finally {
                pmcStages.OnCallFinally(body, meta, scope, callSession, genericTypes, specs);
            }
        }
        ria.__API.addPipelineMethodCallStage = function(stage, worker) {
            switch (stage) {
              case "CallInit":
                pmcStages.callInit_.push(worker);
                break;

              case "BeforeCall":
                pmcStages.beforeCall_.push(worker);
                break;

              case "AfterCall":
                pmcStages.afterCall_.push(worker);
                break;

              case "CallFinally":
                pmcStages.callFinally_.push(worker);
                break;
            }
        };
        ria.__API.getPipelineMethodCallProxyFor = function(body, meta, scope, genericTypes, specs) {
            var f_ = function PipelineMethodCallProxy() {
                return PipelineMethodCall(body, meta, scope, [].slice.call(arguments), genericTypes, specs);
            };
            f_.__META = meta;
            Object.defineProperty(f_, "__META", {
                writable: false,
                configurable: false,
                enumerable: false
            });
            return f_;
        };
    })();
    (function() {
        function getStackTrace(e) {
            var callstack = [];
            var lines, i, len;
            if (e.stack) {
                lines = e.stack.split("\n");
                for (i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                        callstack.push(lines[i]);
                    }
                }
                callstack.shift();
                return callstack;
            }
            if (window.opera && e.message) {
                lines = e.message.split("\n");
                for (i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                        var entry = lines[i];
                        if (lines[i + 1]) {
                            entry += " at " + lines[i + 1];
                            i++;
                        }
                        callstack.push(entry);
                    }
                }
                callstack.shift();
                return callstack;
            }
            if (arguments.callee) {
                var currentFunction = arguments.callee.caller;
                while (currentFunction) {
                    var fn = currentFunction.toString();
                    var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf("")) || "anonymous";
                    callstack.push(fname);
                    currentFunction = currentFunction.caller;
                }
            }
            return callstack;
        }
        function getPrintStackTraceWrapper() {
            "use strict";
            return function(e) {
                return window.printStackTrace({
                    e: e,
                    guess: ria.__CFG.prettyStackTraces
                });
            };
        }
        ria.__API.getStackTrace = window.printStackTrace ? getPrintStackTraceWrapper() : getStackTrace;
    })();
    (function() {
        "use strict";
        function AnnotationDescriptor(name, argsTypes, argsNames) {
            this.name = name;
            this.argsNames = argsNames;
            this.argsTypes = argsTypes;
            this.ret = null;
            _DEBUG && Object.freeze(this);
        }
        ria.__API.AnnotationDescriptor = AnnotationDescriptor;
        function AnnotationInstance(args, meta) {
            for (var k in args) if (args.hasOwnProperty(k)) {
                this[k] = args[k];
            }
            this.__META = meta;
            _DEBUG && Object.freeze(this);
        }
        ria.__API.annotation = function(name, argsTypes_, argsNames_) {
            function AnnotationProxy() {
                var args = [].slice.call(arguments);
                var o = {};
                for (var index = 0; index < argsNames_.length; index++) {
                    o[argsNames_[index]] = args[index];
                }
                return new AnnotationInstance(o, AnnotationProxy.__META);
            }
            AnnotationProxy.__META = new AnnotationDescriptor(name, argsTypes_, argsNames_);
            var fn_ = AnnotationProxy;
            fn_ = ria.__CFG.enablePipelineMethodCall ? ria.__API.getPipelineMethodCallProxyFor(fn_, fn_.__META, null) : fn_;
            _DEBUG && Object.freeze(fn_);
            return fn_;
        };
        ria.__API.isAnnotation = function(value) {
            if (typeof value === "function") {
                return value.__META instanceof AnnotationDescriptor;
            }
            return value instanceof AnnotationInstance;
        };
    })();
    (function() {
        "use strict";
        function MethodDescriptor(name, ret, argsTypes, argsNames, genericTypes) {
            this.name = name;
            this.ret = ret;
            this.argsTypes = argsTypes;
            this.argsNames = argsNames;
            this.genericTypes = genericTypes;
            _DEBUG && Object.freeze(this);
        }
        MethodDescriptor.prototype.isProtected = function() {
            return /^.+_$/.test(this.name);
        };
        ria.__API.MethodDescriptor = MethodDescriptor;
        ria.__API.delegate = function(name, ret_, argsTypes_, argsNames_, genericTypes_) {
            function DelegateProxy(fn) {
                var genericTypesCount = genericTypes_ ? genericTypes_.length : 0;
                var args = ria.__API.clone(arguments);
                var specs = args.slice(0, genericTypesCount);
                fn = args[genericTypesCount];
                if (typeof fn === "function") return ria.__CFG.enablePipelineMethodCall ? ria.__API.getPipelineMethodCallProxyFor(fn, DelegateProxy.__META, null, genericTypes_, specs) : fn;
                throw ria.__API.Exception("Expected delegate specs and function");
            }
            DelegateProxy.__META = new MethodDescriptor(name, ret_, argsTypes_, argsNames_, genericTypes_);
            return DelegateProxy;
        };
        ria.__API.isDelegate = function(delegate) {
            return delegate && delegate.__META instanceof MethodDescriptor;
        };
    })();
    (function() {
        "use strict";
        function EnumDescriptor(enumClass, name) {
            this.enumClass = enumClass;
            this.name = name;
        }
        ria.__API.EnumDescriptor = EnumDescriptor;
        ria.__API.enum = function(enumClass, name) {
            enumClass.__META = new EnumDescriptor(enumClass, name);
        };
        ria.__API.isEnum = function(value) {
            return value && value.__META ? value.__META instanceof EnumDescriptor : false;
        };
    })();
    (function() {
        "use strict";
        function IdentifierDescriptor(identifierClass, name) {
            this.identifierClass = identifierClass;
            this.name = name;
            _DEBUG && Object.freeze(this);
        }
        ria.__API.IdentifierDescriptor = IdentifierDescriptor;
        ria.__API.identifier = function(identifierClass, name) {
            identifierClass.__META = new IdentifierDescriptor(identifierClass, name);
        };
        ria.__API.isIdentifier = function(value) {
            return value && value.__META instanceof IdentifierDescriptor;
        };
    })();
    (function() {
        "use strict";
        function InterfaceDescriptor(name, methods, genericTypes) {
            this.name = name;
            this.genericTypes = genericTypes;
            this.methods = {};
            methods.forEach(function(method) {
                this.methods[method[0]] = {
                    retType: method[1],
                    argsNames: method[3],
                    argsTypes: method[2]
                };
            }.bind(this));
        }
        ria.__API.InterfaceDescriptor = InterfaceDescriptor;
        var ifcRegister = {};
        ria.__API.getInterfaceByName = function(name) {
            return ifcRegister[name];
        };
        ria.__API.ifc = function(ifc, name, methods, genericTypes) {
            ifcRegister[name] = ifc;
            ifc.__META = new InterfaceDescriptor(name, methods, genericTypes);
            return ifc;
        };
        ria.__API.Interface = new function InterfaceBase() {}();
        ria.__API.isInterface = function(ifc) {
            return ifc && ifc.__META instanceof InterfaceDescriptor;
        };
        ria.__API.implements = function(value, ifc, genericTypes, genericSpecs) {
            return (value.__META || ria.__API.getConstructorOf(value).__META).ifcs.some(function(impl) {
                if (ria.__API.isSpecification(impl)) {
                    if (!ria.__API.isSpecification(ifc)) {
                        return impl.type == ifc;
                    }
                    return ifc.specs.every(function(_, index) {
                        var implType = impl.specs[index];
                        if (ria.__API.isGeneralizedType(implType)) {
                            implType = value instanceof ria.__API.Class ? value.getSpecsOf(implType.name) : ria.__API.resolveGenericType(implType, genericTypes || [], genericSpecs || []);
                        }
                        return implType == ria.__API.resolveGenericType(_, genericTypes || [], genericSpecs || []);
                    });
                }
                if (ria.__API.isSpecification(ifc)) return ifc.type == impl;
                return ifc == impl;
            });
        };
    })();
    (function() {
        "use strict";
        function TypeOf(type) {}
        function ClassDescriptor(name, base, ifcs, anns, isAbstract, genericTypes, baseSpecs) {
            this.name = name;
            this.base = base;
            this.ifcs = [].concat.call(base ? base.__META.ifcs : []).concat(ifcs);
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
                gt = base.__META.genericTypes.filter(function(bt) {
                    return (genericTypes || []).every(function(_) {
                        return _.name != bt.name;
                    });
                });
            }
            this.genericTypes = gt.concat(genericTypes);
            this.baseSpecs = bs.concat((baseSpecs || []).filter(function(_) {
                return !ria.__API.isGeneralizedType(_);
            }));
        }
        ClassDescriptor.prototype.addProperty = function(name, ret, anns, getter, setter) {
            this.properties[name] = {
                retType: ret,
                annotations: anns,
                getter: getter,
                setter: setter
            };
        };
        ClassDescriptor.prototype.addMethod = function(impl, name, ret, argsTypes, argsNames, anns) {
            this.methods[name] = {
                impl: impl,
                retType: ret,
                argsNames: argsNames,
                argsTypes: argsTypes,
                annotations: anns
            };
        };
        ClassDescriptor.prototype.addCtor = function(name, impl, argsTypes, argsNames, anns) {
            var def = {
                name: name,
                impl: impl,
                argsNames: argsNames,
                argsTypes: argsTypes,
                annotations: anns
            };
            if (name == "$") this.defCtor = def;
            this.ctors[def.name] = def;
        };
        ClassDescriptor.prototype.addChild = function(clazz) {
            if (!ria.__API.isClassConstructor(clazz)) throw Error("Child should be a CLASS");
            if (clazz.__META.base.__META != this) throw Error("Child should extend me.");
            this.children.push(clazz);
        };
        ria.__API.ClassDescriptor = ClassDescriptor;
        var clazzRegister = {};
        ria.__API.getClassByName = function(name) {
            return clazzRegister[name];
        };
        ria.__API.clazz = function(clazz, name, base_, ifcs_, anns_, isAbstract_, genericTypes_, baseSpecs_) {
            clazzRegister[name] = clazz;
            clazz.__META = new ClassDescriptor(name, base_, ifcs_, anns_, isAbstract_ || false, genericTypes_ || [], baseSpecs_ || []);
            if (base_) {
                ria.__API.extend(clazz, base_);
                base_.__META.addChild(clazz);
            }
        };
        ria.__API.property = function(clazz, name, propType_, anns_, getter, setter) {
            getter.__META = new ria.__API.MethodDescriptor("", propType_, [], []);
            if (setter) {
                setter.__META = new ria.__API.MethodDescriptor("", undefined, [ propType_ ], [ "value" ]);
            }
            clazz.__META.addProperty(name, propType_, anns_, getter, setter);
        };
        ria.__API.method = function(clazz, impl, name, ret_, argsTypes_, argsNames_, anns_) {
            clazz.__META.addMethod(impl, name, ret_, argsTypes_, argsNames_, anns_);
            impl.__META = new ria.__API.MethodDescriptor(name, ret_, argsTypes_, argsNames_);
            _DEBUG && Object.freeze(impl);
        };
        ria.__API.ctor = function(name, clazz, impl, argsTypes_, argsNames_, anns_) {
            clazz.__META.addCtor(name, impl, argsTypes_, argsNames_, anns_);
            impl.__META = new ria.__API.MethodDescriptor(name, undefined, argsTypes_, argsNames_);
            _DEBUG && Object.freeze(impl);
        };
        function ProtectedMethodProxy() {
            throw Error("Can NOT call protected methods");
        }
        ria.__API.init = function(instance, clazz, ctor, args) {
            args = ria.__API.clone(args);
            if (clazz.__META.isAbstract) throw Error("Can NOT instantiate asbtract class " + clazz.__META.name);
            if (!(instance instanceof clazz)) instance = ria.__API.getInstanceOf(clazz, clazz.__META.name.split(".").pop());
            var genericTypes = clazz.__META.genericTypes || [], genericTypesLength = genericTypes.length - clazz.__META.baseSpecs.length, genericSpecs = clazz.__META.baseSpecs.concat(args.slice(0, genericTypesLength));
            args = args.slice(genericTypesLength);
            if (_DEBUG) {
                ria.__API.OF.apply(clazz, genericSpecs);
            }
            var publicInstance = instance;
            if (_DEBUG) {
                instance = ria.__API.getInstanceOf(clazz, clazz.__META.name.split(".").pop());
                publicInstance.__PROTECTED = instance;
            }
            for (var k in instance) {
                var name_ = k;
                var f_ = instance[name_];
                if (typeof f_ === "function" && !/^\$.*/.test(name_) && name_ !== "constructor") {
                    instance[name_] = f_.bind(instance);
                    if (ria.__CFG.enablePipelineMethodCall && f_.__META) {
                        var fn = ria.__API.getPipelineMethodCallProxyFor(f_, f_.__META, instance, genericTypes, genericSpecs);
                        if (_DEBUG) {
                            Object.defineProperty(instance, name_, {
                                writable: false,
                                configurable: false,
                                value: fn
                            });
                            if (f_.__META.isProtected()) fn = ProtectedMethodProxy;
                        }
                        publicInstance[name_] = fn;
                        _DEBUG && Object.defineProperty(publicInstance, name_, {
                            writable: false,
                            configurable: false,
                            value: fn
                        });
                    }
                }
                if (_DEBUG && /^\$.*/.test(name_)) {
                    instance[name_] = publicInstance[name_] = undefined;
                }
            }
            if (ria.__CFG.enablePipelineMethodCall && ctor.__META) {
                ctor = ria.__API.getPipelineMethodCallProxyFor(ctor, ctor.__META, instance, genericTypes, genericSpecs);
            }
            instance.__SPECS = {};
            genericTypes.forEach(function(_, index) {
                instance.__SPECS[_.name] = genericSpecs[index];
            });
            if (_DEBUG) for (var name in clazz.__META.properties) {
                if (clazz.__META.properties.hasOwnProperty(name)) {
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
        Object.freeze(staticScopeInstance);
        ria.__API.compile = function(clazz) {
            for (var k in clazz) if (clazz.hasOwnProperty(k)) {
                var name_ = k;
                var f_ = clazz[name_];
                if (typeof f_ === "function" && ria.__API.isDelegate(f_)) {
                    if (ria.__CFG.enablePipelineMethodCall && f_.__META) {
                        clazz[name_] = ria.__API.getPipelineMethodCallProxyFor(f_, f_.__META, staticScopeInstance);
                    } else {
                        clazz[name_] = f_.bind(staticScopeInstance);
                    }
                }
            }
            _DEBUG && Object.freeze(clazz);
        };
        ria.__API.extends = function ext(child, base) {
            return child === base || child != undefined && ext(child.__META.base, base);
        };
        ria.__API.isClassConstructor = function(type) {
            return type && type.__META instanceof ClassDescriptor;
        };
        ria.__API.Class = function() {
            function ClassBase() {
                return ria.__API.init(this, ClassBase, ClassBase.prototype.$, arguments);
            }
            ria.__API.clazz(ClassBase, "Class", null, [], []);
            ClassBase.prototype.$ = function() {
                this.__hashCode = Math.random().toString(36);
                _DEBUG && Object.defineProperty(this, "hashCode", {
                    writable: false,
                    configurable: false
                });
            };
            ria.__API.ctor("$", ClassBase, ClassBase.prototype.$, [], [], []);
            ClassBase.prototype.getClass = function() {
                return ria.__API.getConstructorOf(this);
            };
            ria.__API.method(ClassBase, ClassBase.prototype.getClass, "getClass", Function, [], [], []);
            ClassBase.prototype.getHashCode = function() {
                return this.__hashCode;
            };
            ria.__API.method(ClassBase, ClassBase.prototype.getHashCode, "getHashCode", String, [], [], []);
            ClassBase.prototype.equals = function(other) {
                return this.getHashCode() === other.getHashCode();
            };
            ria.__API.method(ClassBase, ClassBase.prototype.equals, "equals", Boolean, [ ClassBase ], [ "other" ], []);
            ClassBase.prototype.getSpecsOf = function(name) {
                return this.__SPECS[name];
            };
            ria.__API.method(ClassBase, ClassBase.prototype.getSpecsOf, "equals", null, [ String ], [ "name" ], []);
            ria.__API.compile(ClassBase);
            return ClassBase;
        }();
    })();
    (function() {
        function ArrayOfDescriptor(clazz) {
            this.clazz = clazz;
        }
        ArrayOfDescriptor.isArrayOfDescriptor = function(ds) {
            return ds instanceof ArrayOfDescriptor;
        };
        ArrayOfDescriptor.prototype = {
            toString: function() {
                return "Array<" + ria.__API.getIdentifierOfType(this.clazz) + ">";
            },
            valueOf: function() {
                return this.clazz;
            }
        };
        Object.freeze(ArrayOfDescriptor);
        ria.__API.ArrayOfDescriptor = ArrayOfDescriptor;
        function ArrayOf(clazz) {
            if (clazz == undefined) throw Error("Expected class or type, but gor undefined");
            return new ArrayOfDescriptor(clazz);
        }
        ria.__API.ArrayOf = ArrayOf;
        ria.__API.isArrayOfDescriptor = ArrayOfDescriptor.isArrayOfDescriptor;
    })();
    (function() {
        function ClassOfDescriptor(clazz) {
            this.clazz = clazz;
        }
        ClassOfDescriptor.isClassOfDescriptor = function(ds) {
            return ds instanceof ClassOfDescriptor;
        };
        ClassOfDescriptor.prototype = {
            toString: function() {
                return "ClassOf<" + ria.__API.getIdentifierOfType(this.clazz) + ">";
            },
            valueOf: function() {
                return this.clazz;
            }
        };
        Object.freeze(ClassOfDescriptor);
        ria.__API.ClassOfDescriptor = ClassOfDescriptor;
        function ClassOf(clazz) {
            if (clazz == undefined) throw Error("Expected class in ClassOf, but got undefined");
            if (!ria.__API.isClassConstructor(clazz) && clazz !== window.SELF) throw Error("Expected class in ClassOf, but got " + ria.__API.getIdentifierOfType(clazz));
            return new ClassOfDescriptor(clazz);
        }
        ria.__API.ClassOf = ClassOf;
        ria.__API.isClassOfDescriptor = ClassOfDescriptor.isClassOfDescriptor;
    })();
    (function() {
        ria.__API.Exception = function() {
            "use strict";
            function ExceptionBase() {
                return ria.__API.init(this, ExceptionBase, ExceptionBase.prototype.$, arguments);
            }
            ria.__API.clazz(ExceptionBase, "Exception", null, [], []);
            ExceptionBase.prototype.$ = function(msg, inner_) {
                this.msg = msg;
                this.stack = ria.__API.getStackTrace(Error(msg));
                this.inner_ = inner_;
            };
            ria.__API.ctor("$", ExceptionBase, ExceptionBase.prototype.$, [ String, [ Error, ExceptionBase ] ], [ "msg", "inner_" ], []);
            ExceptionBase.prototype.toString = function() {
                var msg = this.stack.join("\n  ").replace("Error:", ria.__API.getIdentifierOfValue(this) + ":");
                if (this.inner_) {
                    msg += "\nCaused by: ";
                    if (this.inner_ instanceof Error) {
                        msg += ria.__API.getStackTrace(this.inner_).join("\n  ");
                    } else {
                        msg += this.inner_.toString();
                    }
                }
                return msg;
            };
            ria.__API.method(ExceptionBase, ExceptionBase.prototype.toString, "toString", String, [], [], []);
            ExceptionBase.prototype.getMessage = function() {
                return this.msg;
            };
            ria.__API.method(ExceptionBase, ExceptionBase.prototype.getMessage, "getMessage", String, [], [], []);
            ExceptionBase.prototype.getStack = function() {
                return this.stack;
            };
            ria.__API.method(ExceptionBase, ExceptionBase.prototype.getStack, "getStack", Array, [], [], []);
            ria.__API.compile(ExceptionBase);
            return ExceptionBase;
        }();
    })();
    (function() {
        function ImplementerOfDescriptor(clazz) {
            this.ifc = clazz;
        }
        ImplementerOfDescriptor.isImplementerOfDescriptor = function(ds) {
            return ds instanceof ImplementerOfDescriptor;
        };
        ImplementerOfDescriptor.prototype = {
            toString: function() {
                return "ImplementerOf<" + ria.__API.getIdentifierOfType(this.ifc) + ">";
            },
            valueOf: function() {
                return this.ifc;
            }
        };
        Object.freeze(ImplementerOfDescriptor);
        ria.__API.ImplementerOfDescriptor = ImplementerOfDescriptor;
        function ImplementerOf(ifc) {
            if (ifc == undefined) throw Error("Expected interface in ImplementerOf, but got undefined");
            if (!ria.__API.isInterface(ifc)) throw Error("Expected interface in ImplementerOf, but got " + ria.__API.getIdentifierOfType(ifc));
            return new ImplementerOfDescriptor(ifc);
        }
        ria.__API.ImplementerOf = ImplementerOf;
        ria.__API.isImplementerOfDescriptor = ImplementerOfDescriptor.isImplementerOfDescriptor;
    })();
    (function(ria) {
        "use strict";
        TestCase("ExceptionTestCase").prototype = {
            tearDown: function() {
                if (ria.__SYNTAX) {
                    ria.__SYNTAX.Registry.cleanUp();
                    ria.__SYNTAX.registerSymbolsMeta();
                    window.SELF = ria.__SYNTAX.Modifiers.SELF;
                }
            },
            testBuildException: function() {
                var MyException = window.MyException = function() {
                    var $$ = ria.__API.init;
                    function ClassCtor() {
                        return $$(this, ClassCtor, _.$, [].slice.call(arguments));
                    }
                    ria.__API.clazz(ClassCtor, "window.MyException", ria.__API.Exception, [], [], false, [], []);
                    var _ = ClassCtor.prototype;
                    _.$ = function() {
                        ria.__API.Exception.prototype.$.call(this, "");
                    };
                    ria.__API.ctor("$", ClassCtor, _.$, [], []);
                    _.getMember = function() {
                        return this.member;
                    };
                    _.setMember = function(value) {
                        this.member = value;
                    };
                    _.member = null;
                    ria.__API.property(ClassCtor, "member", String, [], _.getMember, _.setMember);
                    _.method = function(_1) {
                        return "I think, this is error: " + _1;
                    };
                    ria.__API.method(ClassCtor, _.method, "method", String, [], [ "_1" ], [ String() ]);
                    ria.__API.compile(ClassCtor);
                    ClassCtor.OF = ria.__API.OF;
                    return ClassCtor;
                }();
                assertEquals("window.MyException", MyException.__META.name);
                assertNotUndefined(MyException);
                assertFunction(MyException);
            },
            testBaseException: function() {
                var BaseException = window.BaseException = function() {
                    var $$ = ria.__API.init;
                    function ClassCtor() {
                        return $$(this, ClassCtor, _.$, [].slice.call(arguments));
                    }
                    ria.__API.clazz(ClassCtor, "window.BaseException", ria.__API.Exception, [], [], false, [], []);
                    var _ = ClassCtor.prototype;
                    _.$ = function() {
                        ria.__API.Exception.prototype.$.call(this, "");
                    };
                    ria.__API.ctor("$", ClassCtor, _.$, [], []);
                    ria.__API.compile(ClassCtor);
                    ClassCtor.OF = ria.__API.OF;
                    return ClassCtor;
                }();
                var ChildException = window.ChildException = function() {
                    var $$ = ria.__API.init;
                    function ClassCtor() {
                        return $$(this, ClassCtor, _.$, [].slice.call(arguments));
                    }
                    ria.__API.clazz(ClassCtor, "window.ChildException", BaseException, [], [], false, [], []);
                    var _ = ClassCtor.prototype;
                    _.$ = function() {
                        BaseException.prototype.$.call(this);
                    };
                    ria.__API.ctor("$", ClassCtor, _.$, [], []);
                    ria.__API.compile(ClassCtor);
                    ClassCtor.OF = ria.__API.OF;
                    return ClassCtor;
                }();
                var instance = new ChildException();
                assertInstanceOf("Expected to be instance of its ctor.", ChildException, instance);
                assertInstanceOf("Expected to be instance of its parent.", BaseException, instance);
            },
            testBadExtending: function() {
                var BaseClass = window.BaseClass = function() {
                    var $$ = ria.__API.init;
                    function ClassCtor() {
                        return $$(this, ClassCtor, _.$, [].slice.call(arguments));
                    }
                    ria.__API.clazz(ClassCtor, "window.BaseClass", ria.__API.Class, [], [], false, [], []);
                    var _ = ClassCtor.prototype;
                    _.$ = function() {
                        ria.__API.Class.prototype.$.call(this);
                    };
                    ria.__API.ctor("$", ClassCtor, _.$, [], []);
                    ria.__API.compile(ClassCtor);
                    ClassCtor.OF = ria.__API.OF;
                    return ClassCtor;
                }();
                {};
            }
        };
    })(ria);
})();