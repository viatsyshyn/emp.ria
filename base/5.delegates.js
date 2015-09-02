(function () {
    "use strict";

    /**
     * @param {String} name
     * @param {*} ret
     * @param {Array} argsTypes
     * @param {String[]} argsNames
     * @constructor
     */
    function MethodDescriptor(name, ret, argsTypes, argsNames, genericTypes) {
        this.name = name;
        this.ret = ret;
        this.argsTypes = argsTypes;
        this.argsNames = argsNames;
        this.genericTypes = genericTypes;

        _DEBUG && Object.freeze(this);
    }

    MethodDescriptor.prototype.isProtected = function () {
        return /^.+_$/.test(this.name);
    };

    ria.__API.MethodDescriptor = MethodDescriptor;

    /**
     * @param {String} name
     * @param {*} [ret_]
     * @param {Array} [argsTypes_]
     * @param {String[]} [argsNames_]
     * @return {Function}
     */
    ria.__API.delegate = function (name, ret_, argsTypes_, argsNames_, genericTypes_) {
        function DelegateProxy(fn) {
            var genericTypesCount = genericTypes_ ? genericTypes_.length : 0;
            var args = ria.__API.clone(arguments);
            var specs = args.slice(0, genericTypesCount);
            fn = args[genericTypesCount];

            if (typeof fn === 'function')
                return !_RELEASE
                    ? ria.__API.getPipelineMethodCallProxyFor(fn, DelegateProxy.__META, null, genericTypes_, specs)
                    : fn;

            throw Exception('Expected delegate specs and function');
        }

        DelegateProxy.__META = new MethodDescriptor(name, ret_, argsTypes_, argsNames_, genericTypes_);

        return DelegateProxy;
    };

    /**
     * @param {Function} delegate
     * @return {Boolean}
     */
    ria.__API.isDelegate = function (delegate) {
        return delegate && (delegate.__META instanceof MethodDescriptor);
    };
})();