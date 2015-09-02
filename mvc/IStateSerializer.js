REQUIRE('ria.mvc.State');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /**
     * @class ria.mvc.IStateSerializer
     */
    INTERFACE(
        'IStateSerializer', [
            String, 'separator',

            [[ria.mvc.State]],
            String, function serialize(state) {},

            [[String]],
            ria.mvc.State, function deserialize(value) {}
        ]);
});
