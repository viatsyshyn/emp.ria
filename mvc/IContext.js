REQUIRE('ria.mvc.IView');
REQUIRE('ria.mvc.ISession');
REQUIRE('ria.mvc.State');

NAMESPACE('ria.mvc', function () {
    "use strict";

    /**
     * @class ria.mvc.IContext
     */
    INTERFACE(
        'IContext', [
            ria.mvc.State, function getState() {},
            ria.mvc.IView, function getDefaultView() {},
            ria.mvc.ISession, function getSession() {},
            [[ClassOf(Class)]],
            Class, function getService(clazz) {},
            VOID, function stateUpdated() {}
        ]);
});