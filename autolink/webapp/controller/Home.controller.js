sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {

    "use strict";

    return Controller.extend("autolink.controller.Home", {

        onInit: function () {

        },

        onDashboard: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("home");

        },

     

        onProductFinder: function () {
             this.getOwnerComponent()
            .getRouter()
             .navTo("productfinder");
              MessageToast.show("Product Finder clicked")

        },

        onOrders: function () {

                MessageToast.show("User Management clicked"),
                this.getOwnerComponent()
                .getRouter()
                .navTo("Orders");

        },

        onUsers: function () {

            MessageToast.show("User Management clicked");

        },

        onForms: function () {

            MessageToast.show("Forms clicked");

        },

        onReports: function () {

            MessageToast.show("Reports clicked");

        },

        onAccount: function () {

            MessageToast.show("Account clicked");

        },

        onHelp: function () {

            MessageToast.show("Help clicked");

        },

        onLogout: function () {

            MessageToast.show("Logout clicked");

        },

        onRefresh: function () {

            MessageToast.show("AutoLink refreshed");

        }

    });

});