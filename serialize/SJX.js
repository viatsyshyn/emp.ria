NAMESPACE('ria.serialize', function () {

    var me = ria.serialize.SJX = {
        fromValue: function (raw, Type) {
            Assert(Type === Boolean || Type === String || Type === Number || ria.__API.isIdentifier(Type) || ria.__API.isEnum(Type));

            if (raw == undefined || raw == null)
                return null;

            if (Type === Boolean) {
                var intVal = Number(raw);
                return raw === 'true' || raw === 'on' || raw === true || !isNaN(intVal) && intVal > 0;
            }

            return Type(raw);
        },

        fromArrayOfValues: function (raw, cvt) {
            Assert(!cvt || typeof cvt == 'function');
            if (raw == undefined || raw == null)
                return null;

            Assert(Array.isArray(raw));
            return cvt ? raw.map(cvt) : raw;
        },

        fromDeserializable: function (raw, Type) {
            var specs = [];
            if (ria.__API.isSpecification(Type)) {
                specs = Type.specs;
                Type = Type.type;
            }

            Assert(ria.__API.isClassConstructor(Type) && ria.__API.implements(Type, ria.serialize.IDeserializable));

            if (raw == undefined || raw == null || !raw && Type == chlk.models.common.ChlkDate)
                return null;

            var obj = Type.apply(_GLOBAL, specs);
            obj.deserialize(raw);
            return obj;
        },

        fromArrayOfDeserializables: function (raw, Type) {
            Assert(ria.__API.isClassConstructor(Type) || ria.__API.implements(Type, ria.serialize.IDeserializable));

            if (raw == undefined || raw == null)
                return null;

            Assert(Array.isArray(raw));
            return raw.map(function (_) { return me.fromDeserializable(_, Type); });
        }
    };
});