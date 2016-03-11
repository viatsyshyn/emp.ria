/** @namespace ria.__SYNTAX */
ria.__SYNTAX = ria.__SYNTAX || {};

(function (global) {
    "use strict";

    var IS_OPTIONAL = /^.+_$/;

    ria.__SYNTAX.toRef = ria.__SYNTAX.toAst = function (x) {
        return new Function ('return ' + x)();
    };

    function isFactoryCtor(name) {
        return name !== '$$' && /^\$.*/i.test(name);
    }

    function isStaticMethod(name) {
        return name.toUpperCase() == name && /[_a-z].*/i.test(name);
    }

    function getDefaultGetter(property, isOverride) {
        if (isOverride)
            return new ria.__SYNTAX.Tokenizer.FunctionToken(ria.__SYNTAX.toAst(function g() { return BASE(); }.toString().replace('name', property)));

        return new ria.__SYNTAX.Tokenizer.FunctionToken(ria.__SYNTAX.toAst(function g() { return this.name; }.toString().replace('name', property)));
    }

    function getDefaultSetter(property, isOverride) {
        if (isOverride)
            return new ria.__SYNTAX.Tokenizer.FunctionToken(ria.__SYNTAX.toAst(function s(value) { return BASE(value); }.toString().replace('name', property)));

        return new ria.__SYNTAX.Tokenizer.FunctionToken(ria.__SYNTAX.toAst(function s(value) { this.name = value; }.toString().replace('name', property)));
    }

    function getDefaultCtor() {
        return new ria.__SYNTAX.Tokenizer.FunctionToken(ria.__SYNTAX.toAst(function $() { BASE(); }.toString()));
    }

    ria.__SYNTAX.resolveNameFromToken = function (x) {
        return x.value.__META.name;
    };

    /**
     * @param {ClassDescriptor} def
     * @param {String} name
     * @return {MethodDescriptor}
     */
    function findParentMethodFixed(def, name){
        var base = def.base && ria.__SYNTAX.Registry.find(ria.__SYNTAX.resolveNameFromToken(def.base));
        return base && (
            base.methods.filter(function(method){ return method.name == name }).pop()
            || findParentMethodFixed(base, name));
    }

    /**
     * @param {ClassDescriptor} def
     * @param {String} name
     * @return {PropertyDescriptor}
     */
    function findParentPropertyFixed(def, name){
        var base = def.base && ria.__SYNTAX.Registry.find(ria.__SYNTAX.resolveNameFromToken(def.base));
        return base &&
            (base.properties.filter(function(property){ return property.name == name }).pop()
            || findParentPropertyFixed(base, name));
    }

    /**
     * @param {ClassDescriptor} def
     * @param {String} name
     * @return {Object}
     */
    function findParentPropertyByGetterOrSetterFixed(def, name){
        var base = def.base && ria.__SYNTAX.Registry.find(ria.__SYNTAX.resolveNameFromToken(def.base));
        return base &&
            (base.properties.filter(function (_) { return _.getSetterName() == name || _.getGetterName() == name;}).pop()
            || findParentPropertyByGetterOrSetterFixed(base, name));
    }

    ria.__SYNTAX.precalcClassOptionalsAndBaseRefs = function (def, baseClass) {
        // validate if base is descendant on Class
        def.base = def.base === null ? new ria.__SYNTAX.Tokenizer.RefToken(baseClass) : def.base;

        var baseSyntaxMeta = ria.__SYNTAX.Registry.find(ria.__SYNTAX.resolveNameFromToken(def.base));

        // add omitted default constructor
        var classCtorDef = def.methods.filter(function (_) {return _.name === '$'; }).pop();
        var baseCtorDef = baseSyntaxMeta ? baseSyntaxMeta.methods.filter(function (_) {return _.name === '$'; }).pop() : null;
        if (!classCtorDef) {
            if (baseCtorDef && baseCtorDef.argsNames.filter(function(_) { return !IS_OPTIONAL.test(_)}).length > 0) {
                throw Error('Can NOT create default constructor, base requires more then 0 args');
            }

            classCtorDef = new ria.__SYNTAX.MethodDescriptor('$', [], [], null, {}, getDefaultCtor(), []);
            def.methods.unshift(classCtorDef);
        }

        // defined override properties
        def.methods
            .filter(function (_) { return !isStaticMethod(_.name); })
            .map(function (method) {
                return findParentPropertyByGetterOrSetterFixed(def, method.name);
            })
            .filter(function (_) { return _; })
            .reduce(function (list, node) {
                if (list.indexOf(node) < 0)
                    list.push(node);

                return list;
            }, [])
            .forEach(function (baseProperty) {
                def.properties.push(new ria.__SYNTAX.PropertyDescriptor(
                    baseProperty.name,
                    baseProperty.type,
                    baseProperty.annotations,
                    baseProperty.flags,
                    true));
            });

        // add omitted getter/setter of properties
        def.properties
            .forEach(function (property) {
                var name = property.name;
                property.type = property.type || new ria.__SYNTAX.Tokenizer.RefToken(ria.__SYNTAX.toRef('Object'));

                ria.__SYNTAX.validateVarName(name);
                var getterName = property.getGetterName();
                var flags = ria.__API.clone(property.flags);
                flags.isOverride = property.isOverride;
                var getterDef = def.methods.filter(function (_) {return _.name === getterName; }).pop();
                if (!getterDef) {
                    getterDef = new ria.__SYNTAX.MethodDescriptor(
                        getterName,
                        [],
                        [],
                        property.type,
                        flags,
                        getDefaultGetter(name, property.isOverride),
                        []);
                    def.methods.push(getterDef);
                }

                if (!property.flags.isReadonly) {
                    var setterName = property.getSetterName();
                    var setterDef = def.methods.filter(function (_) {return _.name === setterName; }).pop();
                    if (!setterDef) {
                        setterDef = new ria.__SYNTAX.MethodDescriptor(
                            setterName,
                            ['value'],
                            [property.type],
                            new ria.__SYNTAX.Tokenizer.VoidToken(),
                            flags,
                            getDefaultSetter(name, property.isOverride),
                            []);
                        def.methods.push(setterDef);
                    }
                }

                property.__GETTER_DEF = getterDef;
                property.__SETTER_DEF = setterDef;
            });

        // TODO: ensure optional type hints
        /*def.methods
         .forEach(function (method) {

         });*/

        // find BASE for each method (including ctor, getters & setters)
        def.methods
            .forEach(function (method) {
                method.__BASE_META = findParentMethodFixed(def, method.name);
                method.__GENERIC_TYPES = [];
                method.__GENERIC_SPECS = [];
            });
    };

    function checkXxxOfIsSELF(token, descriptor) {
        return token.value instanceof descriptor
            && token.value.clazz == ria.__SYNTAX.Modifiers.SELF;
    }

    function processSelf(token, SELF) {
        if (Array.isArray(token))
            return token.map(function (_) { return processSelf(_, SELF); });

        if (!token)
            return token;

        if (token instanceof ria.__SYNTAX.Tokenizer.SelfToken)
            return new ria.__SYNTAX.Tokenizer.RefToken(SELF);

        if (checkXxxOfIsSELF(token, ria.__API.ArrayOfDescriptor))
            return new ria.__SYNTAX.Tokenizer.RefToken(ria.__API.ArrayOf(SELF));

        if (checkXxxOfIsSELF(token, ria.__API.ClassOfDescriptor))
            return new ria.__SYNTAX.Tokenizer.RefToken(ria.__API.ClassOf(SELF));

        if (checkXxxOfIsSELF(token, ria.__API.ClassOfDescriptor))
            return new ria.__SYNTAX.Tokenizer.RefToken(ria.__API.ClassOf(SELF));

        return token;
    }

    /* VALIDATE */

    function isSameFlags(def1, def2){
        for(var flag in def1.flags)  {
            if (flag == 'isReadonly') continue;
            if (flag == 'isOverride') continue;
            if (def1.flags.hasOwnProperty(flag) && (!!def1.flags[flag] != !!def2.flags[flag]))
                return false;
        }
        return true;
    }

    function validateClassCtor(def, ctor, FakeSelf) {
        if (!ctor.body.hasBaseCall()) {
            throw Error('Class constructor MUST call base class constructor');
        }
    }

    function getTypeFromToken(token, FakeSelf, def) {
        if (token === undefined || token === null)
            return def || null;

        if (token instanceof ria.__SYNTAX.Tokenizer.RefToken)
            return token.raw;

        if (token instanceof ria.__SYNTAX.Tokenizer.SelfToken)
            return FakeSelf;

        if (token instanceof ria.__SYNTAX.Tokenizer.VoidToken)
            return undefined;

        // In case of raw types: Date, Event, RegEx
        if (token instanceof ria.__SYNTAX.Tokenizer.FunctionToken)
            return token.value;

        ria.__SYNTAX.Assert(false, 'This should never assert this');
        return undefined;
    }

    function validateMethodSignatureOverride(method, parentMethod, FakeSelf, genericTypes, genericSpecs) {
        var meta = {
            name: parentMethod.name,
            retType: getTypeFromToken(parentMethod.retType, null, null),
            argsNames: parentMethod.argsNames,
            argsTypes: parentMethod.argsTypes.map(function (_) { return getTypeFromToken(_, null, Object) })
        };

        validateMethodSignatureImplementation(method, meta, FakeSelf, genericTypes, genericSpecs);
    }

    function validateMethodSignatureImplementation(method, ifcMethodMeta, FakeSelf, genericTypes, genericSpecs) {
        //check if method accepts at least as much args as may be passed to base method
        if (method.argsNames.length < ifcMethodMeta.argsNames.length)
            throw Error('Method accepts less arguments then base method. Method: "' + method.name + '"');

        //check if method requires no more args than may be passed to base method
        method.argsNames.forEach(function (name, index) {
            if (!IS_OPTIONAL.test(name) && (IS_OPTIONAL.test(ifcMethodMeta.argsNames[index]) || ifcMethodMeta.argsNames[index] == undefined)) {
                throw Error('Method requires argument "' + name + '" that base does not have or optional. Method: "' + method.name + '"');
            }
        });

        //validate method return
        var mrtv = getTypeFromToken(method.retType, FakeSelf, null),
            brtv = ria.__API.resolveGenericType(ifcMethodMeta.retType, genericTypes, genericSpecs);
        if (mrtv !== brtv && (mrtv === null || mrtv === undefined || !ria.__SYNTAX.checkTypeHint(mrtv, brtv))) {
            throw Error('Method "' + method.name + '" returns ' + ria.__API.getIdentifierOfType(mrtv)
                + ', but base returns ' + ria.__API.getIdentifierOfType(brtv));
        }

        //validate method args types
        method.argsNames.forEach(function (name, index) {
            if (index >= ifcMethodMeta.argsNames.length)
                return ;

            var matv = getTypeFromToken(method.argsTypes[index], FakeSelf, Object),
                batv = ria.__API.resolveGenericType(ifcMethodMeta.argsTypes[index] || Object, genericTypes, genericSpecs);

            if (!ria.__SYNTAX.checkTypeHint(batv, matv)) {
                throw Error('Method "' + method.name + '" accepts ' + ria.__API.getIdentifierOfType(matv)
                    + ' for argument ' + name + ', but base accepts ' + ria.__API.getIdentifierOfType(batv));
            }
        });
    }

    function validateMethodDeclaration(def, method, FakeSelf, parentGenericTypes, parentGenericSpecs) {
        var parentMethod = method.__BASE_META;

        if (method.flags.isUnSafe) {
            throw Error('Mathod cannot be marked with UNSAFE. Method: "' + method.name + '"');
        }

        if (method.flags.isOverride && isStaticMethod(method.name)) {
            throw Error('Override on static method are not supported. Method: "' + method.name + '"');
        }

        if (method.flags.isOverride && !parentMethod) {
            throw Error('There is no ' + method.name + ' method in base classes of ' + def.name + ' class');
        }

        if (!method.flags.isOverride && parentMethod) {
            throw Error('Method ' + method.name + ' of ' + def.name + ' should be marked with OVERRIDE as one base classes has same method');
        }

        if (method.flags.isAbstract && parentMethod) {
            throw Error('Method ' + method.name + ' can\'t be abstract, because there is method with the same name in one of the base classes');
        }

        if (parentMethod && parentMethod.flags.isFinal) {
            throw Error('Final method ' + method.name + ' can\'t be overridden in ' + def.name + ' class');
        }

        if (ria.__SYNTAX.isProtected(method.name) && method.annotations.length) {
            throw Error('Annotations are forbidden for protected methods. Method: "' + method.name + '"');
        }

        if (method.flags.isOverride && parentMethod) {
            validateMethodSignatureOverride(method, parentMethod, FakeSelf, parentGenericTypes, parentGenericSpecs);
        }

        if (method.body.hasBaseCall() && !method.flags.isOverride) {
            throw Error('Base call are forbidden for non overriden methods. Method: "' + method.name + '"');
        }

        if (ria.__SYNTAX.isProtected(method.name) && isStaticMethod(method.name)) {
            throw Error('Only public static method are supported. Method: "' + method.name + '"');
        }

        if (isStaticMethod(method.name) && method.annotations.length) {
            throw Error('Annotations are forbidden for static methods. Method: "' + method.name + '"');
        }
    }

    function validatePropertyDeclaration(property, def, processedMethods, FakeSelf) {
        if (isStaticMethod(property.name))
            throw Error('Static properties are not supported');

        var getterName = property.getGetterName();
        var setterName = property.getSetterName();

        var getterDef = property.__GETTER_DEF;
        if (!isSameFlags(property, getterDef))
            throw Error('The flags of getter ' + getterName + ' should be the same with property flags');

        var setterDef = property.__SETTER_DEF;
        if (property.flags.isReadonly) {
            if (setterDef) throw Error('There is no ability to add setter to READONLY property ' + property.name + ' in ' + def.name + ' class');
        } else if (!isSameFlags(property, setterDef)) {
            throw Error('The flags of setter ' + setterName + ' should be the same with property flags');
        }

        if (property.flags.isUnSafe) {
            throw Error('Property cannot be marked with UNSAFE. Property: "' + property.name + '"');
        }

        processedMethods.push(getterName);
        processedMethods.push(setterName);
    }

    function validateBaseClassMethodDeclaration(def, baseMethod, FakeSelf) {
        var childMethod = def.methods.filter(function (method) { return method.name == baseMethod.name; }).pop();
        if (baseMethod.flags.isFinal) {
            if (childMethod)
                throw Error('There is no ability to override final method ' + childMethod.name + ' in ' + def.name + ' class');

        } else if (baseMethod.flags.isAbstract) {
            if (!childMethod)
                throw Error('The abstract method ' + baseMethod.name + ' have to be overridden in ' + def.name + ' class');

            if (!childMethod.flags.isOverride)
                throw Error('The overridden method ' + childMethod.name + ' have to be marked as OVERRIDE in ' + def.name + ' class');

        } else {
            if (childMethod && !childMethod.flags.isOverride)
                throw Error('The overridden method ' + childMethod.name + ' have to be marked as OVERRIDE in ' + def.name + ' class');
        }
    }

    function validateBaseClassPropertyDeclaration(baseProperty, childGetter, childSetter, def, FakeSelf) {
        if (baseProperty.flags.isFinal) {
            if (childGetter || childSetter)
                throw Error('There is no ability to override getter or setter of final property '
                    + baseProperty.name + ' in ' + def.name + ' class');

        } else if (baseProperty.flags.isAbstract) {
            if (!childGetter || !childSetter)
                throw Error('The setter and getter of abstract property ' + baseProperty.name
                    + ' have to be overridden in ' + def.name + ' class');

            if (!childGetter.flags.isOverride || !childSetter.flags.isOverride)
                throw Error('The overridden setter and getter of property' + baseProperty.name
                    + ' have to be marked as OVERRIDE in ' + def.name + ' class');

        } else {
            if (childGetter && !childGetter.flags.isOverride || childSetter && !childSetter.flags.isOverride)
                throw Error('The overridden getter or setter of property ' + baseProperty.name
                    + ' have to be marked as OVERRIDE in ' + def.name + ' class');
        }
    }

    function isDescendantOf(token, rootClassMeta) {
        var meta = ria.__SYNTAX.Registry.find(ria.__SYNTAX.resolveNameFromToken(token));
        return meta === rootClassMeta || meta.base && isDescendantOf(meta.base, rootClassMeta);
    }

    ria.__SYNTAX.validateClassDecl = function (def, rootClassName) {

        if(!isDescendantOf(def.base, ria.__SYNTAX.Registry.find(rootClassName)))
            throw Error('Base class must be descendant of ' + rootClassName);

        ria.__SYNTAX.validateVarName(def.name);

        // validate class flags
        if(def.flags.isOverride)
            throw Error('Modifier OVERRIDE is not supported in classes');

        if(def.flags.isReadonly)
            throw Error('Modifier READONLY is not supported in classes');

        if(def.flags.isAbstract && def.flags.isFinal)
            throw Error('Class can not be ABSTRACT and FINAL simultaneously');

        // validate no duplicate members
        def.methods
            .forEach(function (_) {
                var name = _.name;
                ria.__SYNTAX.validateVarName(name);

                if (def.methods.filter(function (_) { return _.name === name}).length > 1)
                    throw Error('Duplicate method declaration "' + name + '"');
            });

        // validate no duplicate properties
        def.properties
            .forEach(function (_) {
                var name = _.name;
                if (def.properties.filter(function (_) { return _.name === name}).length > 1)
                    throw Error('Duplicate property declaration "' + name + '"');

                if (def.methods.filter(function (_) { return _.name === name}).length > 0)
                    throw Error('Method and property has same name "' + name + '"');
            });

        function FakeSelf() {}
        FakeSelf.__META = new ria.__API.ClassDescriptor(def.name, def.base.raw, def.ifcs.values, [], def.flags.isAbstract || false);
        ria.__API.extend(FakeSelf, def.base.raw);

        var processedMethods = [];
        var baseSyntaxMeta = ria.__SYNTAX.Registry.find(ria.__SYNTAX.resolveNameFromToken(def.base));

        if (baseSyntaxMeta.flags.isFinal)
            throw Error('Can NOT extend final class ' + ria.__SYNTAX.resolveNameFromToken(def.base));

        var parentGenericTypes = baseSyntaxMeta.genericTypes;
        var parentGenericSpecs = def.base.specs;

        // validate ctor declaration
        def.methods
            .filter(function (_) { return isFactoryCtor(_.name); })
            .forEach(function (ctorDef) {
                validateClassCtor(def, ctorDef, FakeSelf);
                processedMethods.push(ctorDef.name);
            });

        // validate methods overrides
        baseSyntaxMeta.methods.forEach(function(baseMethod) {
            if (isFactoryCtor(baseMethod.name))
                return;

            validateBaseClassMethodDeclaration(def, baseMethod, FakeSelf, parentGenericTypes, parentGenericSpecs);
        });

        // validate methods
        def.methods
            .forEach(
            /**
             * @param {MethodDescriptor} method
             */
                function (method) {
                // skip processed methods
                if (processedMethods.indexOf(method.name) >= 0)
                    return;

                validateMethodDeclaration(def, method, FakeSelf, parentGenericTypes, parentGenericSpecs);
            });

        // validate properties overrides
        baseSyntaxMeta.properties.forEach(function(baseProperty){
            var childGetter = def.methods.filter(function(method){ return method.name == baseProperty.getGetterName() }).pop(),
                childSetter = def.methods.filter(function(method){ return method.name == baseProperty.getSetterName() }).pop();

            validateBaseClassPropertyDeclaration(baseProperty, childGetter, childSetter, def, FakeSelf, parentGenericTypes, parentGenericSpecs);
        });

        // validate properties
        def.properties.forEach(
            /**
             * @param {PropertyDescriptor} property
             */
                function (property) {
                if (property.isOverride)
                    return;

                if(findParentPropertyFixed(def, property.name))
                    throw Error('There is defined property ' + property.name + ' in one of the base classes');

                validatePropertyDeclaration(property, def, processedMethods, FakeSelf, parentGenericTypes, parentGenericSpecs);
            });

        // validate interface method implementations
        def.ifcs.values.forEach(function(ifc) {
            var genericSpecs = [];
            if (ria.__API.isSpecification(ifc)) {
                genericSpecs = ifc.specs;
                ifc = ifc.type;
            }

            var genericTypes = ifc.__META.genericTypes;

            var methods = ifc.__META.methods;
            for(var name in methods) if (methods.hasOwnProperty(name)) {
                var methodDef = def.methods.filter(function (_) { return _.name == name }).pop();
                if (!methodDef)
                    throw Error('Method "' + name + '" of interface ' + ria.__API.getIdentifierOfType(ifc) + ' not implemented');

                validateMethodSignatureImplementation(methodDef, methods[name], FakeSelf, genericTypes, genericSpecs);
            }
        });
    };

    /* COMPILE */

    /**
     *
     * @param {Function} body
     * @param SELF
     * @param [method]
     * @returns {Function}
     */
    function addSelfAndBaseBody(body, SELF, method) {
        body.__SELF = SELF;
        if (method && method.__BASE_META) {
            body.__BASE_BODY = method.__BASE_META.body.value;
        }

        return body;
    }

    function compileMethodDeclaration(def, method, ClassProxy) {
        method.retType = processSelf(method.retType, ClassProxy);
        method.argsTypes = processSelf(method.argsTypes, ClassProxy);

        var impl;
        if (isStaticMethod(method.name)) {
            impl = ClassProxy[method.name] = addSelfAndBaseBody(method.body.value, ClassProxy);
            impl.__META = new ria.__API.MethodDescriptor(
                ClassProxy.__META.name + '.' + method.name,
                method.retType ? method.retType.value : null,
                method.argsTypes.map(function (_) { return _.value }),
                method.argsNames);
            _DEBUG && Object.freeze(impl);
        } else {
            impl = ClassProxy.prototype[method.name] = addSelfAndBaseBody(method.body.value, ClassProxy, method);
            ria.__API.method(
                ClassProxy,
                impl,
                method.name,
                method.retType ? method.retType.value : null,
                method.argsTypes.map(function (_) { return _.value }),
                method.argsNames,
                method.annotations.map(function(_) { return _.value }));
        }
    }

    function compilePropertyDeclaration(property, ClassProxy, processedMethods) {
        var getterName = property.getGetterName();
        var setterName = property.getSetterName();

        var getterDef = property.__GETTER_DEF;
        var setterDef = property.__SETTER_DEF;

        processedMethods.push(getterName);
        processedMethods.push(setterName);

        property.type = processSelf(property.type, ClassProxy);

        var getter = ClassProxy.prototype[getterName] = addSelfAndBaseBody(getterDef.body.value, ClassProxy, getterDef);

        if (!property.flags.isReadonly) {
            var setter = ClassProxy.prototype[setterName] = addSelfAndBaseBody(setterDef.body.value, ClassProxy, setterDef);
        }

        ria.__API.property(
            ClassProxy,
            property.name,
            property.type.value,
            property.annotations.map(function (_) { return _.value }),
            getter,
            setter || null);
    }

    function compileCtorsDeclaration(def, ClassProxy, processedMethods) {
        var ctorDefs = def.methods
            .filter(function (_) { return processedMethods.indexOf(_.name) < 0; })
            .filter(function (_) { return isFactoryCtor(_.name) });


        ctorDefs.forEach(function (ctorDef) {
            var name = ctorDef.name;
            processedMethods.push(name);

            ctorDef.argsTypes = processSelf(ctorDef.argsTypes, ClassProxy);

            var impl = ClassProxy.prototype[name] = ctorDef.body.value;
            impl.__BASE_BODY = def.base.value.__META.defCtor.impl;
            impl.__SELF = ClassProxy;
            ria.__API.ctor(
                name,
                ClassProxy,
                impl,
                ctorDef.argsTypes.map(function (_) { return _.value }),
                ctorDef.argsNames,
                ctorDef.annotations.map(function(item){
                    return item.value
                })
            );
        });
    }

    /**
     * @param {String} name
     * @param {ClassDescriptor} def
     * @return {Function}
     */
    ria.__SYNTAX.compileClass = function (name, def) {

        var className = name;
        var processedMethods = [];

        var $$Def = def.methods.filter(function (_1) { return _1.name == '$$'}).pop();
        var $$ = $$Def ? $$Def.body.value : def.flags.isUnSafe ? ria.__API.initUnSafe : ria.__API.init;
        processedMethods.push('$$');

        var ClassProxy = function ClassProxy() {
            var _old_SELF = global.SELF;
            try {
                global.SELF = ClassProxy;
                return $$.call(undefined, this, ClassProxy, ClassProxy.prototype.$, arguments);
            } catch (e) {
                throw new Exception('Error instantiating class ' + className, e);
            } finally {
                global.SELF = _old_SELF;
            }
        };

        if (_DEBUG) {
            ClassProxy = new Function("global, className, Exception, $$",
                "return " + ClassProxy.toString().replace(/ClassProxy/g, ria.__SYNTAX.toSingleVarName(className))
            )(global, className, Exception, $$);
        }

        ria.__API.clazz(ClassProxy, name,
            def.base.value,
            def.ifcs.values,//.map(function (_) { return _.value }),
            def.annotations.map(function (_) { return _.value }),
            def.flags.isAbstract,
            def.genericTypes,
            def.base.specs || []);

        def.properties.forEach(
            /**
             * @param {PropertyDescriptor} property
             */
            function (property) {
                compilePropertyDeclaration(property, ClassProxy, processedMethods);
            });

        compileCtorsDeclaration(def, ClassProxy, processedMethods);

        def.methods
            .filter(function (_) { return isFactoryCtor(_.name) && _.name !== '$'; })
            .forEach(function (ctorDef) {
                var name = ctorDef.name;
                ClassProxy[name] = function NamedConstructorProxy() {
                    var _old_SELF = global.SELF;
                    try {
                        global.SELF = ClassProxy;
                        return $$.call(undefined, this, ClassProxy, ClassProxy.prototype[name], arguments);
                    } catch (e) {
                        throw new Exception('Error instantiating class ' + className, e);
                    } finally {
                        global.SELF = _old_SELF;
                    }
                };
            });

        def.methods
            .forEach(
            /**
             * @param {MethodDescriptor} method
             */
            function (method) {
                // skip processed methods
                if (processedMethods.indexOf(method.name) >= 0)
                    return;

                compileMethodDeclaration(def, method, ClassProxy);
            });

        ClassProxy.OF = ria.__API.OF;

        ria.__API.compile(ClassProxy);

        ria.__SYNTAX.Registry.registry(name, def);

        return ClassProxy;
    };

    ria.__SYNTAX.CLASS = function () {
        var def = ria.__SYNTAX.parseClassDef(new ria.__SYNTAX.Tokenizer([].slice.call(arguments)));
        ria.__SYNTAX.precalcClassOptionalsAndBaseRefs(def, ria.__API.Class);
        ria.__SYNTAX.validateClassDecl(def, 'Class');
        var name = ria.__SYNTAX.getFullName(def.name);
        var clazz = ria.__SYNTAX.compileClass(name, def);
        ria.__SYNTAX.isProtected(name) || ria.__SYNTAX.define(name, clazz);
        return clazz;
    };

    function BaseIsUndefined() { throw Error('BASE is supported only on method with OVERRIDE'); }

    if (_DEBUG) {
        ria.__API.addPipelineMethodCallStage('CallInit',
            function (body, meta, scope, callSession, genericTypes, genericSpecs) {
                callSession.__OLD_SELF = global.SELF;
                global.SELF = body.__SELF;

                callSession.__OLD_BASE = global.BASE;
                var base = body.__BASE_BODY;
                global.BASE = base
                    ? ria.__API.getPipelineMethodCallProxyFor(base, base.__META, scope, genericTypes, genericSpecs)
                    : BaseIsUndefined;

                (genericTypes || []).forEach(function (type, index) {
                    callSession['__OLD_' + type.name] = global[type.name];
                    global[type.name] = genericSpecs[index];
                });
            });

        ria.__API.addPipelineMethodCallStage('CallFinally',
            function (body, meta, scope, callSession, genericTypes, genericSpecs) {
                (genericTypes || []).forEach(function (type, index) {
                    global[type.name] = callSession['__OLD_' + type.name];
                    delete callSession['__OLD_' + type.name];
                });

                global.SELF = callSession.__OLD_SELF;
                delete callSession.__OLD_SELF;

                global.BASE = callSession.__OLD_BASE;
                delete callSession.__OLD_BASE;
            });
    }
})(this);
