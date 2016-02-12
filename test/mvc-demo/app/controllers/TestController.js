/**
 * Created with JetBrains WebStorm.
 * User: C01t
 * Date: 6/1/13
 * Time: 9:16 PM
 * To change this template use File | Settings | File Templates.
 */

REQUIRE('app.controllers.Base');
REQUIRE('app.services.TestService');

NAMESPACE('app.controllers', function () {
    "use strict";

    /** @class app.controllers.TestController */
    CLASS(
        [ria.mvc.ControllerUri('index')],
        'TestController', EXTENDS(app.controllers.Base), [

            [ria.mvc.Inject],
            app.services.TestService, 'service',

            ria.async.Future, function validateResponse_() {
                var head
                  , me = this;

                (head = new ria.async.Future)
                    .catchError(function (error) {
                        throw app.services.DataException('Failed to load data', error);
                    })
                    .then(function (data) {
                        // TODO: check response here
                        /*if (!data.isOkResponse())
                            throw app.services.DataException('Failed to load data: ' + $L(data.getErrorCode()));*/

                        return data;
                    })
                    .catchException(app.services.DataException, function (error) {
                        console.error(error.toString());
                        // todo: scoping !?
                        //me.view.showAlertBox(error.getMessage());

                        return ria.async.BREAK; // failed with exception, stop further processing
                    });

                return head;
            },

            [[Number, Number, app.model.CoordinateZ]],
            function indexAction(x_, y_, z_) {
                var result = this.service
                    .getSector(x_, y_, z_)
                    .attach(this.validateResponse_());

                /* Put activity in stack and render when result is ready */
                return this.View(app.activities.Notes, result);
            },

            //[[app.activites.CoordinatesViewModel]],
            function updateSectorAction(model) {
                var result = this.service
                    .updateSector(model.getX(), model.getY(), model.getZ(), model.getValue())
                    .attach(this.validateResponse_());

                /* Update part of view. Activity should implement ria.mvc.IPartial.
                    Activity should be in stack. Render when result is ready */
                return this.PartialView(app.activities.Test, result);
            }
        ]);
})