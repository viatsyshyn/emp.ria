(function () {
    "use strict";

    /**
     * @param {String} name
     * @param {Array} methods
     * @constructor
     */
    function InterfaceDescriptor(name, methods, genericTypes) {
        this.name = name;
        this.genericTypes = genericTypes;
        this.methods = {};
        methods.forEach(function (method) {
            this.methods[method[0]] = {
                retType: method[1],
                argsNames: method[3],
                argsTypes: method[2]
            }
        }.bind(this));
    }

    ria.__API.InterfaceDescriptor = InterfaceDescriptor;

    var ifcRegister = {};

    /**
     * @param {String} name
     * @return {Function}
     */
    ria.__API.getInterfaceByName = function (name) {
        return ifcRegister[name];
    };

    /**
     * @param {Function} ifc
     * @param {String} name
     * @param {Array} methods
     * @returns Function
     */
    ria.__API.ifc = function(ifc, name, methods, genericTypes) {
        ifcRegister[name] = ifc;
        ifc.__META = new InterfaceDescriptor(name, methods, genericTypes);
        return ifc;
    };

    ria.__API.Interface = new (function InterfaceBase() {});

    ria.__API.isInterface = function (ifc) {
        return ifc && (ifc.__META instanceof InterfaceDescriptor);
    };

    ria.__API.implements = function (value, ifc, genericTypes, genericSpecs) {
        return (value.__META || ria.__API.getConstructorOf(value).__META).ifcs.some(function (impl) {
            if (ria.__API.isSpecification(impl)) {
                if (!ria.__API.isSpecification(ifc)) {
                    return impl.type == ifc;
                }

                return  ifc.specs.every(function (_, index) {
                    var implType = impl.specs[index];
                    if (ria.__API.isGeneralizedType(implType)) {
                        implType = (value instanceof ria.__API.Class)
                            ? value.getSpecsOf(implType.name)
                            : ria.__API.resolveGenericType(implType, genericTypes || [], genericSpecs || []);
                    }
                    return implType == ria.__API.resolveGenericType(_, genericTypes || [], genericSpecs || []);
                });
            }

            if (ria.__API.isSpecification(ifc))
                return ifc.type == impl;

            return ifc == impl;
        });
    };

})();
