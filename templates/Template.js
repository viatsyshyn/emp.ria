REQUIRE('ria.templates.Exception');
REQUIRE('ria.templates.ConverterFactories');
REQUIRE('ria.dom.Dom');

REQUIRE('ria.reflection.ReflectionClass');

/** @namespace ria.templates */
NAMESPACE('ria.templates', function () {
    "use strict";

    function appendTo(content, to) {
        if (to.count() < 0)
            return ;

        var dom = new ria.dom.Dom();
        dom.fromHTML(content).appendTo(to);
    }

    /**
     * @class ria.templates.ModelBind
     */
    ANNOTATION(
        [[ClassOf(Class)]],
        function ModelBind(model) {});

    /**
     * @class ria.templates.ModelPropertyBind
     */
    ANNOTATION(
        [[String, ImplementerOf(ria.templates.IConverter)]],
        function ModelPropertyBind(name_, converter_) {});

    /**
     * @class ria.templates.TemplateBind
     * @param {String} tpl
     */
    ANNOTATION(
        [[String]],
        function TemplateBind(tpl) {});

    /** @class ria.templates.Template */
    CLASS(ABSTRACT,
        'Template', [
            Number, 'collectionIndex',
            Array, 'collection',

            function $() {
                BASE();
                this._modelClass = null;
                this._bindings = [];
                this._bundle = '';
                this._tpl = null;
                this._model = null;
                this.bind_();
            },

            VOID, function bind_() {
                var self = ria.reflection.ReflectionClass(this.getClass());

                // Bind template
                if (!self.isAnnotatedWith(ria.templates.TemplateBind))
                    throw new ria.templates.Exception('Template class is not bound to template. Please use '
                        + ria.__API.getIdentifierOfType(ria.templates.TemplateBind));

                this._tpl = self.findAnnotation(ria.templates.TemplateBind).pop().tpl;

                // Bind model
                if (!self.isAnnotatedWith(ria.templates.ModelBind))
                    throw new ria.templates.Exception('Template class is not bound to model. Please use '
                        + ria.__API.getIdentifierOfType(ria.templates.ModelBind));

                this._modelClass = self.findAnnotation(ria.templates.ModelBind).pop().model;
                if (this._modelClass === undefined)
                    throw new ria.templates.Exception('Template class is bound to model. But model not loaded');

                if (!ria.__API.isClassConstructor(this._modelClass) && !ria.__API.isSpecification(this._modelClass))
                    return ;

                var model = ria.reflection.ReflectionClass(this._modelClass);

                var selfProperties = self.getPropertiesReflector(),
                    bindings = this._bindings;

                selfProperties
                    .filter(function (_) { return _.isAnnotatedWith(ria.templates.ModelPropertyBind); })
                    .forEach(function (property) {
                        var modelBind = property.findAnnotation(ria.templates.ModelPropertyBind).pop();
                        var modelPropertyName = modelBind.name_ || property.getShortName();
                        var modelProperty = model.getPropertyReflector(modelPropertyName);
                        if (modelProperty == null)
                            throw ria.templates.Exception('Property "' + modelPropertyName + '" not found in model ' + model.getName());

                        bindings.push({
                            sourceProp: modelProperty,
                            destProp: property,
                            converter: modelBind.converter_
                        });
                    });
            },

            ClassOf(Class), function getModelClass() {
                if (ria.__API.isSpecification(this._modelClass))
                    return this._modelClass.type;

                return this._modelClass;
            },

            VOID, function assign(model) {

                try {
                    VALIDATE_ARG('model', this._modelClass, model);
                } catch (e) {
                    throw ria.templates.Exception('Expected instance of '
                        + ria.__API.getIdentifierOfType(this._modelClass) + ' but got '
                        + ria.__API.getIdentifierOfValue(model), e);
                }

                this._model = model;

                var convertWith = this.convertWith,
                    scope = this;

                this._bindings.forEach(function (_) {
                    var value = _.sourceProp.invokeGetterOn(model);
                    if (_.converter) {
                        value = convertWith(value, _.converter);
                    }
                    try{
                        _.destProp.invokeSetterOn(scope, value);
                    }
                    catch(e){
                        throw new ria.templates.Exception("Error assigning property " + _.destProp.getName(), e);
                    }

                });
            },

            Object, function getModel() {
                return this._model;
            },

            VOID, function options(options) {

                if ('function' == typeof options.block) {
                    this.setBlock(options.block);
                }

                delete options.block;

                if ('undefined' !== typeof options.collection) {
                    this.setCollection(options.collection);
                }
                delete options.collection;

                if ('number' === typeof options.collectionIndex) {
                    this.setCollectionIndex(options.collectionIndex);
                }
                delete options.collectionIndex;

                var ref = ria.reflection.ReflectionClass(this.getClass()), scope = this;
                var handled = {};
                options = ria.__API.clone(options);
                ref.getPropertiesReflector()
                    .filter(function (_) { return !_.isAnnotatedWith(ria.templates.ModelBind); })
                    .forEach(function (property) {
                        var key = property.getShortName();
                        if (options.hasOwnProperty(key)) {
                            property.invokeSetterOn(scope, options[key]);
                            delete options[key];
                        }
                    });

                Object.getOwnPropertyNames(options).forEach(function (k) {
                    throw new ria.templates.Exception('Unknown property ' + k + ' in template ' + ref.getName());
                });
            },

            ABSTRACT, String, function render() {},

            VOID, function renderTo(to) {
                appendTo(this.render(), to);
            },

            VOID, function renderBuffer() {
                this._bundle += this.render();
            },

            String, function flushBuffer() {
                var buffer = this._bundle;
                this._bundle = '';
                return buffer;
            },

            VOID, function flushBufferTo(to) {
                appendTo(this.flushBuffer(), to);
            },

            SELF, function getInstanceOfTemplate_(tplClass, options_) {
                var tpl = new tplClass;

                if (!(tpl instanceof SELF))
                    throw new Exception('Can render model only with ' + ria.__API.getIdentifierOfType(SELF));

                options_ && tpl.options(options_);

                return tpl;
            },

            [[Object, ClassOf(SELF), Object]],
            String, function renderWith(data, tplClass, options_) {
                var tpl = this.getInstanceOfTemplate_(tplClass, options_ || {});

                if (!Array.isArray(data)) {
                    data = [data];
                } else {
                    tpl.setCollection(data);
                }

                data.forEach(function (_, i) {
                    tpl.assign(_);
                    tpl.setCollectionIndex(i);
                    tpl.renderBuffer();
                });

                return tpl.flushBuffer();
            },

            [[ImplementerOf(ria.templates.IConverter)]],
            Object, function getConverter(clazz) {
                return ria.templates.ConverterFactories().create(clazz);
            },

            [[Object, ImplementerOf(ria.templates.IConverter)]],
            Object, function convertWith(value, clazz) {
                return this.getConverter(clazz).convert(value);
            },

            Object, function getContext_() {
                return this;
            }
        ]);
});