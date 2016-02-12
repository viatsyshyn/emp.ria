REQUIRE('app.model.Note');

NAMESPACE('app.model', function () {
    "use strict";

    /** @class app.model.Notes*/
    CLASS(
        'Notes', [
            ArrayOf(app.model.Note), 'items'
        ]);
});