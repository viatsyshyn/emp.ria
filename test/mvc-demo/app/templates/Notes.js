REQUIRE('app.templates.JadeTemplate');

REQUIRE('app.model.Notes');

REQUIRE('app.templates.Note');

NAMESPACE('app.templates', function () {

    /** @class app.templates.Notes */
    CLASS(
        [ria.templates.TemplateBind('~/assets/jade/activities/notes.jade')],
        [ria.templates.ModelBind(app.model.PaginatedList)],
        'Notes', EXTENDS(app.templates.JadeTemplate), [
            [ria.templates.ModelPropertyBind],
            ArrayOf(app.model.Note), 'items',

            [ria.templates.ModelPropertyBind],
            Number, 'count',
            [ria.templates.ModelPropertyBind],
            Number, 'pageSize',
            [ria.templates.ModelPropertyBind],
            Number, 'page'
        ])
});