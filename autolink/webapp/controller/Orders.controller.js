sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
     "sap/ui/model/Filter",
     "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageToast, Filter,FilterOperator) {

    "use strict";

    return Controller.extend("autolink.controller.Orders", {

        onInit: function () {

            var oModel = new JSONModel();

            oModel.loadData("model/orders.json");

            this.getView().setModel(oModel);

        },

        onBack: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("home");

        },

        onSearchOrder: function () {

    var sOrderId = this.byId("orderSearchInput").getValue();

    var oTable = this.byId("ordersTable");

    var oBinding = oTable.getBinding("items");

    var oFilter = new Filter(
        "orderId",
        FilterOperator.EQ,
        sOrderId
    );

    oBinding.filter([oFilter]);

}

    });

});