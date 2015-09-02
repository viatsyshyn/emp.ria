REQUIRE('ria.mvc.IStateSerializer');

NAMESPACE('ria.mvc', function () {

    /** @class ria.mvc.StateSerializer */
    CLASS(
        'StateSerializer', IMPLEMENTS(ria.mvc.IStateSerializer), [

            String, 'separator',

            [[ria.mvc.State]],
            String, function serialize(state) {
                var params = state.getParams()
                    .slice()
                    .filter(function (_) { return _ !== null && _ !== undefined; });

                params.unshift(state.getController(), state.getAction());

                return params
                    .map(function (_) { return encodeURIComponent(_)})
                    .join(this.separator);
            },

            [[String]],
            ria.mvc.State, function deserialize(value) {
                var params = value.split(this.separator)
                    .map(function (_) { return decodeURIComponent(_)});

                var state = new ria.mvc.State();
                state.setController(params.shift() || null);
                state.setAction(params.shift() || null);
                state.setParams(params);
                return state;
            }
        ])
});
