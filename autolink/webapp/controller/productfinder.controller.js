sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("autolink.controller.productfinder", {




         onBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("home");
        }

    });
    
   

});