NAMESPACE('app.model', function () {
    "use strict";

    /** @class app.model.NoteId*/
    IDENTIFIER('NoteId');

    /** @class app.model.Note*/
    CLASS(
        'Note', [
            app.model.NoteId, 'id',
            [ria.serialize.SerializeProperty('Title')],
            String, 'title',
            [ria.serialize.SerializeProperty('Description')],
            String, 'description',
            Date, 'date'
        ]);
});