REQUIRE('ria.mvc.Control');
REQUIRE('ria.dom.Dom');
REQUIRE('ria.mvc.DomEventBind');

REQUIRE('ria.reflection.ReflectionClass');

REQUIRE('ria.templates.Template');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /** @class ria.mvc.RenderToActions */
    ENUM('RenderToActions', {
        Prepend: 'prepend',
        Replace: 'replace',
        Append: 'append'
    });

    /** @class ria.mvc.DomControl */
    CLASS(
        'DomControl', EXTENDS(ria.mvc.Control), [
            function $() {
                BASE();
                this._dom = null;
                this._domEvents = [];

                this.bind_();
            },

            OVERRIDE, VOID, function onCreate_() {
                BASE();

                var dom = this._dom = new ria.dom.Dom();

                var instance = this;
                this._domEvents.forEach(function (_) {
                    dom.on(_.event, _.selector || null, _.wrapper || (_.wrapper = function (node, event) {
                        return _.methodRef.invokeOn(instance, ria.__API.clone(arguments));
                    }));
                })
            },

            VOID, function bind_() {
                var ref = new ria.reflection.ReflectionClass(this.getClass());

                this._domEvents = [].concat.apply([], ref.getMethodsReflector()
                    .filter(function (_) { return _.isAnnotatedWith(ria.mvc.DomEventBind)})
                    .map(function(_) {
                        if (_.getArguments().length < 2)
                            throw new ria.mvc.MvcException('Methods, annotated with ria.mvc.DomBindEvent, are expected to accept at least two arguments (node, event)');

                        return _.findAnnotation(ria.mvc.DomEventBind)
                            .map(function (annotation) {
                                return {
                                    event: annotation.event,
                                    selector: annotation.selector_,
                                    methodRef: _
                                }
                            });
                    }));
            },

            Object, function prepareAttributes_(attrs) {
                var id = attrs['id'] = attrs['id'] || ria.dom.Dom.GID();
                this.queueReanimation_(id);
                return attrs;
            },

            [[String]],
            function queueReanimation_(id) {
                this.context.getDefaultView().onActivityRefreshed(function (activity) {
                    this.onActivate_(ria.dom.Dom('#' + id));
                }.bind(this))
            },

            [[ria.dom.Dom]],
            VOID, function onActivate_(dom) {},


            [[Class, ClassOf(ria.templates.Template), ria.dom.Dom, Object, ria.mvc.RenderToActions]],
            VOID, function renderWith(model, Tpl, target, options_, action_) {
                var tpl = new Tpl;
                tpl.setSession(this.context.getSession());
                tpl.assign(model);
                tpl.options(options_ || {});

                var dom = ria.dom.Dom(tpl.render());

                switch (action_) {
                    case ria.mvc.RenderToActions.Prepend: dom.prependTo(target); break;
                    case ria.mvc.RenderToActions.Append: dom.appendTo(target); break;
                    default: dom.appendTo(target.empty());
                }

                this.content.getDefaultView().notifyControlRefreshed();
            }

      ]);
});
