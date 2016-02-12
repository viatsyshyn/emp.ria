REQUIRE('ria.mvc.TemplateActivity');

REQUIRE('ria.dom.Dom');

REQUIRE('app.templates.Notes');

NAMESPACE('app.activities', function () {

    /** @class app.activities.Notes */
    CLASS(
        [ria.mvc.DomAppendTo('#body')],
        [ria.mvc.TemplateBind(app.templates.Notes)],
        [ria.mvc.PartialUpdateRule(app.templates.Notes)], // default
        [ria.mvc.PartialUpdateRule(app.templates.Note, 'append', '.notes', ria.mvc.PartialUpdateRuleActions.Append)],
        'Notes', EXTENDS(ria.mvc.TemplateActivity), [
            OVERRIDE, ria.dom.Dom, function onDomCreate_() {
                return BASE().fromHTML('<div>Loading...</div>');
            },

            [ria.mvc.DomEventBind('click', 'p')],
            [[ria.dom.Dom, ria.dom.Event]],
            Boolean, function handleClick(node, event) {
                alert('clicked');
            }
        ]);
});