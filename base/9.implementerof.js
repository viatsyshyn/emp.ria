(function () {

    function ImplementerOfDescriptor(clazz) {
        this.ifc = clazz;
    }

    /**
     * @param ds
     * @returns {boolean}
     */
    ImplementerOfDescriptor.isImplementerOfDescriptor = function (ds) {
        return ds instanceof ImplementerOfDescriptor;
    };

    ImplementerOfDescriptor.prototype = {
        toString: function () { return 'ImplementerOf<' + ria.__API.getIdentifierOfType(this.ifc) + '>'; },
        valueOf: function () { return this.ifc; }
    };

    _DEBUG && Object.freeze(ImplementerOfDescriptor);

    ria.__API.ImplementerOfDescriptor = ImplementerOfDescriptor;

    function ImplementerOf(ifc) {
        if (ifc == undefined)
            throw Error('Expected interface in ImplementerOf, but got undefined');

        if (!ria.__API.isInterface(ifc))
            throw Error('Expected interface in ImplementerOf, but got ' + ria.__API.getIdentifierOfType(ifc));

        return new ImplementerOfDescriptor(ifc);
    }

    ria.__API.ImplementerOf = ImplementerOf;
    ria.__API.isImplementerOfDescriptor = ImplementerOfDescriptor.isImplementerOfDescriptor;
})();
