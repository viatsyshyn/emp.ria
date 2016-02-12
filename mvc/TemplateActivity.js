REQUIRE('ria.mvc.DomActivity');

REQUIRE('ria.templates.Template');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.TemplateBind */
    ANNOTATION(
        [[ClassOf(ria.templates.Template)]],
        function TemplateBind(tpl) {});

    /** @class ria.mvc.PartialUpdateRuleActions */
    ENUM('PartialUpdateRuleActions', {
        Prepend: 'prepend',
        Replace: 'replace',
        Append: 'append'
    });



    /** @class ria.mvc.PartialUpdateRule */
    ANNOTATION(
        [[ClassOf(ria.templates.Template), String, String, ria.mvc.PartialUpdateRuleActions]],
        function PartialUpdateRule(tpl, msg_, selector_, action_) {});

    /** @class ria.mvc.TemplateActivity */
    CLASS(
        'TemplateActivity', EXTENDS(ria.mvc.DomActivity), [

            [[ria.reflection.ReflectionClass]],
            OVERRIDE, VOID, function processAnnotations_(ref) {
                BASE(ref);

                if (!ref.isAnnotatedWith(ria.mvc.TemplateBind))
                    throw new ria.mvc.MvcException('ria.mvc.TemplateActivity expects annotation ria.mvc.TemplateBind');

                var tpls = [].concat.apply([], ref.findAnnotation(ria.mvc.TemplateBind).map(function (_) {
                    var tpl = _.tpl;
                    if (!Array.isArray(tpl))
                        tpl = [tpl];

                    return tpl;
                }));

                if (tpls.some(function (_) { return _ === undefined; }))
                    throw new ria.mvc.MvcException(ref.getName() + " is annotated with ria.mvc.TemplateBind"
                        + ', but some templates classes appears to be not loaded: ['
                        + tpls.map(function (_) { return ria.__API.getIdentifierOfType(_); }) + ']');

                this._templateClasses = tpls.map(function (tpl) {
                    var tplRef = new ria.reflection.ReflectionClass(tpl);
                    if (!tplRef.extendsClass(ria.templates.Template))
                        throw new ria.mvc.MvcException(ref.getName() + " is annotated with ria.mvc.TemplateBind"
                            + ', but templates ' + tplRef.getName() + ' is not descedant of ria.templates.Template');

                    return tplRef.instantiate();
                });

                var partialUpdateWithMethods = ref.getMethodsReflector()
                    .filter(function (_) { return _.isAnnotatedWith(ria.mvc.PartialUpdateRule)})
                    .map(function(_) {
                        var annotation = _.findAnnotation(ria.mvc.PartialUpdateRule).pop();
                        var tplRef = annotation.tpl === null ? null : new ria.reflection.ReflectionClass(annotation.tpl);
                        return {
                            tpl: tplRef ? tplRef.instantiate() : null,
                            msg: annotation.msg_ || null,
                            methodRef: _
                        }
                    });

                this._partialUpdateRules = ref.findAnnotation(ria.mvc.PartialUpdateRule)
                    .map(function (_) {
                        if (_.tpl === undefined)
                            throw new ria.mvc.MvcException(ref.getName() + " is annotated with ria.mvc.PartialUpdateRule"
                                + ', but some templates classes appears to be not loaded.');

                        var tplRef = new ria.reflection.ReflectionClass(_.tpl);
                        if (!tplRef.extendsClass(ria.templates.Template))
                            throw new ria.mvc.MvcException(ref.getName() + " is annotated with ria.mvc.PartialUpdateRule"
                                + ', but templates ' + tplRef.getName() + ' is not descedant of ria.templates.Template');

                        return {
                            tpl: tplRef.instantiate(),
                            msg: _.msg_ || null,
                            selector: _.selector_ || null,
                            action: _.action_ || ria.mvc.PartialUpdateRuleActions.Replace
                        };
                    }).concat(partialUpdateWithMethods);

                if (this._partialUpdateRules.length < 1) {
                    var rules = this._partialUpdateRules;
                    this._templateClasses.forEach(function (tpl) {
                        rules.push({
                            tpl: tpl,
                            msg: null,
                            selector: null,
                            action: ria.mvc.PartialUpdateRuleActions.Replace
                        })
                    })
                }
            },

            OVERRIDE, ria.dom.Dom, function onDomCreate_() {
                return new ria.dom.Dom().fromHTML('<div></div>');
            },

            ria.templates.Template, function doFindTemplateForModel_(model) {
                var matches = this._templateClasses.filter(function (_) {
                    return model instanceof _.getModelClass();
                });

                if (matches.length == 0)
                    throw new ria.mvc.MvcException('Found no template that can render ' + ria.__API.getIdentifierOfValue(model));

                if (matches.length > 1)
                    throw new ria.mvc.MvcException('Found multiple templates that can render ' + ria.__API.getIdentifierOfValue(model)
                        + ', matches ' + matches.map(function (_) { return ria.__API.getIdentifierOfValue(_) }));

                return matches.pop();
            },

            [[ria.templates.Template, Object, String]],
            VOID, function onPrepareTemplate_(tpl, model, msg_) {
                tpl.setSession(this.session);
            },

            OVERRIDE, VOID, function onRender_(model) {
                BASE(model);

                var tpl = this.doFindTemplateForModel_(model);
                this.onPrepareTemplate_(tpl, model);
                tpl.assign(model);
                tpl.renderTo(this.dom.empty());
            },

            Object, function doFindTemplateForPartialModel_(model, msg_) {
                var matches = this._partialUpdateRules.filter(function (_) {
                    if (_.msg !== null && _.msg !== msg_)
                        return false;

                    if (!_.tpl)
                        return true;

                    var modelClass = _.tpl.getModelClass();

                    if (ria.__API.isArrayOfDescriptor(modelClass))
                        return Array.isArray(model);

                    if (ria.__API.isClassConstructor(modelClass))
                        return model instanceof modelClass;

                    return false;
                });

                if (matches.length > 1) {
                    var matches_ = matches.filter(function (_) { return _.msg === msg_; });
                    if (matches_.length > 0)
                        matches = matches_;
                }

                if (matches.length == 0)
                    throw new ria.mvc.MvcException('Found no template that can render ' + ria.__API.getIdentifierOfValue(model) + ' with message ' + msg_);

                if (matches.length > 1)
                    throw new ria.mvc.MvcException('Found multiple templates that can render ' + ria.__API.getIdentifierOfValue(model) + ' with message ' + msg_
                        + ', matches ' + matches.map(function (_) { return ria.__API.getIdentifierOfValue(_) }));

                return matches.pop();
            },

            OVERRIDE, VOID, function onPartialRender_(model, msg_) {
                BASE(model, msg_);

                if (model == null && msg_ == null) {
                    Assert(false, 'Model and msg are both null');
                    return ;
                }

                var rule = this.doFindTemplateForPartialModel_(model, msg_);
                var tpl = rule.tpl;
                tpl && this.onPrepareTemplate_(tpl, model, msg_);
                tpl && tpl.assign(model);
                if(rule.methodRef){
                    rule.methodRef.invokeOn(this, [tpl, model, msg_]);
                }else{
                    var dom = new ria.dom.Dom().fromHTML(tpl.render());

                    var target = this.dom;
                    if (rule.selector)
                        target = target.find(rule.selector);

                    if (target.count() > 0) {
                        switch (rule.action) {
                            case ria.mvc.PartialUpdateRuleActions.Prepend: dom.prependTo(target); break;
                            case ria.mvc.PartialUpdateRuleActions.Append: dom.appendTo(target); break;
                            default: dom.appendTo(target.empty());
                        }
                    }
                }
            }
        ]);
});
