REQUIRE('ria.mvc.IContext');
REQUIRE('ria.mvc.Dispatcher');

NAMESPACE('ria.mvc', function () {

    /** @class ria.mvc.ServiceCreateDelegate */
    DELEGATE(
        [[ClassOf(Class), ria.mvc.IContext]],
        Class, function ServiceCreateDelegate(clazz, context) {});

    /** @class ria.mvc.BaseContext */
    CLASS(
        'BaseContext', IMPLEMENTS(ria.mvc.IContext), [

            ria.mvc.ServiceCreateDelegate, 'serviceCreateDelegate',

            ria.mvc.IView, 'defaultView',
            ria.mvc.ISession, 'session',
            ria.mvc.Dispatcher, 'dispatcher',

            VOID, function stateUpdated() {
                var state = this.dispatcher.getState();
                state.setDispatched(false);

                if (!this.dispatcher.isDispatching())
                    this.dispatcher.dispatch(state, this);
            },

            ria.mvc.State, function getState() {
                return this.dispatcher.getState();
            },

            [[ClassOf(Class)]],
            Class, function getService(clazz) {
                if (!this.serviceCreateDelegate)
                    throw Exception('No service creator is provided');

                return this.serviceCreateDelegate(clazz, this);
            }
        ]);
});
