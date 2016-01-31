REQUIRE('ria.mvc.LinkControl');

NAMESPACE('ria.controls', function () {
    "use strict";

    var H5F = _GLOBAL['H5F'] || null;

    var r20 = /%20/g,
        rbracket = /\[\]$/,
        rCRLF = /\r?\n/g,
        rreturn = /\r/g,
        rsubmitterTypes = /^(?:submit|button|image|reset)$/i,
        manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
        rsubmittable = /^(?:input|select|textarea|keygen)/i,
        toString = Object.prototype.toString;

    function isNodeName( elem, name ) {
        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
    }

    var valHooks = {
        option: function( elem ) {
            // attributes.value is undefined in Blackberry 4.7 but
            // uses .value. See #6932
            var val = elem.attributes.value;
            return !val || val.specified ? elem.value : elem.text;
        },

        select: function( elem ) {
            var value, option,
                options = elem.options,
                index = elem.selectedIndex,
                one = elem.type === "select-one" || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                i = index < 0 ?
                    max :
                    one ? index : 0;

            // Loop through all the selected options
            for ( ; i < max; i++ ) {
                option = options[ i ];

                // IE6-9 doesn't update selected after form reset (#2551)
                if ( ( option.selected || i === index ) &&
                    // Don't return options that are disabled or in a disabled optgroup
                    ( option.getAttribute("disabled") === null ) &&
                    ( !option.parentNode.disabled || !isNodeName( option.parentNode, "optgroup" ) ) ) {

                    // Get the specific value for the option
                    value = valueOfElement( option );

                    // We don't need an array for one selects
                    if ( one ) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push( value );
                }
            }

            return values;
        }
    };

    function valueOfElement( elem ) {
        var ret;
        var hooks = valHooks[ elem.type ] || valHooks[ elem.nodeName.toLowerCase() ];
        if ( hooks && (ret = hooks( elem, "value" )) !== undefined ) {
            return ret;
        }
        ret = elem.value;
        return typeof ret === "string" ?
            // handle most common string cases
            ret.replace(rreturn, "") :
            // handle cases where value is null/undef or number
            ret == null ? "" : ret;
    }

    var isArray = Array.isArray || function (obj) {
        return typeof obj === 'object' && toString.call(obj) === "[object Array]";
    };

    function serializeForm(form) {
        var elements = form.elements || [];

        return ria.__API.clone(elements)
            .filter(function(_) {
                var type = _.type;
                // Use .is(":disabled") so that fieldset[disabled] works
                return _.name && !ria.dom.Dom(_).is( ":disabled" ) &&
                    rsubmittable.test( _.nodeName ) && !rsubmitterTypes.test( type ) &&
                    ( _.checked || !manipulation_rcheckableType.test( type ) );
            })
            .map(function(elem) {
                if (elem.type.toLowerCase() == 'file')
                    return { name: elem.name, value: elem.files };
                var val = valueOfElement(elem);
                return val == null ?
                    null :
                    isArray( val ) ?
                        val.map(function(val){
                            return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
                        }) :
                    { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
            }).filter(function(_) { return _; });
    }

    var ME = null;

    /** @class ria.controls.ActionFormControl */
    CLASS(
        'ActionFormControl', EXTENDS(ria.mvc.LinkControl), [

            function $() {
                BASE();
                ME = this;
            },

            [ria.mvc.DomEventBind('click', 'FORM [type=submit]')],
            [[ria.dom.Dom, ria.dom.Event]],
            function submitClicked($target, event) {
                var $form = $target.parent('FORM');

                var name = $target.getAttr('name');
                if (name) {
                    $form.setData('submit-name', name);
                    $form.setData('submit-value', $target.getValue() || $target.getAttr('value'));
                    $form.setData('submit-skip', $target.hasClass('validate-skip'))
                }
            },

            [ria.mvc.DomEventBind('submit', 'FORM')],
            [[ria.dom.Dom, ria.dom.Event]],
            Boolean, function submit($target, event) {
                if ($target.hasClass('disabled') || $target.hasClass('working'))
                    return false;

                var controller = $target.getData('controller');
                if (controller) {

                    var action = $target.getData('action');
                    var p = serializeForm($target.valueOf().shift());
                    var params = {};
                    p.forEach(function (o) {
                        if(Array.isArray(o)){
                            params[o[0].name] = o.map(function(item){return item.value})
                        }
                        params[o.name] = o.value; }
                    );

                    Object.keys(params).forEach(function (key) {
                        var path = key.split('.');
                        if (path.length < 2) return;

                        var p = params;
                        do {
                            var root = path.shift();
                            var def = isNaN(parseInt(path[0], 10)) ? {} : [];
                            p = p[root] = p[root] || def;
                        } while (path.length > 1);

                        p[path.shift()] = params[key];
                        delete params[key];
                    });

                    var name = $target.getData('submit-name');
                    var value = $target.getData('submit-value');

                    if (name) {
                        params[name] = value;
                    }

                    $target.setData('submit-name', null);
                    $target.setData('submit-value', null);

                    $target.addClass('working');

                    this.updateState_(controller, action, [params]);

                    return false;
                }

                return true;
            },

            [[Object]],
            function PREPARE(attributes, controller, action) {
                attributes['data-controller'] = controller;
                attributes['data-action'] = action;
                attributes.action = attributes.action || 'javascript:';
                return ME.prepareAttributes_(attributes);
            },

            [[ria.dom.Dom]],
            OVERRIDE, VOID, function onActivate_(dom) {
                BASE(dom);
                if (dom.count() && H5F)
                    H5F['setup'](dom.valueOf()[0]);
            }
        ])
});
