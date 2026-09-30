sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("autolink.controller.ProductFinder", {

        // ============================================================
        // API
        // ============================================================

        API_BASE: "https://ymmfit.com/v1",


        // ============================================================
        // Initialization
        // ============================================================

        onInit: function () {

            var oVehicleModel = new JSONModel({
                makes: [],
                models: [],
                years: [],

                selectedMake: "",
                selectedMakeName: "",

                selectedModel: "",
                selectedModelName: "",

                selectedYear: "",

                products: [],
                productsLoaded: false
            });

            this.getView().setModel(oVehicleModel, "vehicle");

            // Load all vehicle makes
            this._loadMakes();
        },


        // ============================================================
        // Load Vehicle Makes
        // ============================================================

        _loadMakes: function () {

            var oModel = this.getView().getModel("vehicle");

            fetch(this.API_BASE + "/makes")
                .then(function (oResponse) {

                    if (!oResponse.ok) {
                        throw new Error(
                            "Failed to load makes. HTTP " + oResponse.status
                        );
                    }

                    return oResponse.json();
                })
                .then(function (oData) {

                    console.log("MAKES API RESPONSE:", oData);

                    /*
                     * YMMFit returns an array of make objects.
                     *
                     * Example:
                     * [
                     *   {
                     *      "make": "BMW",
                     *      "slug": "bmw"
                     *   }
                     * ]
                     */

                    var aMakes = Array.isArray(oData)
                        ? oData
                        : (oData.makes || oData.data || []);

                    oModel.setProperty("/makes", aMakes);

                    console.log("MAKES LOADED:", aMakes);
                })
                .catch(function (oError) {

                    console.error("MAKE API ERROR:", oError);

                    MessageToast.show(
                        "Unable to load vehicle makes."
                    );
                });
        },


        // ============================================================
        // Vehicle Make Changed
        // ============================================================

        onMakeChange: function (oEvent) {

            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (!oSelectedItem) {
                return;
            }

            var sMakeSlug = oSelectedItem.getKey();
            var sMakeName = oSelectedItem.getText();

            var oModel = this.getView().getModel("vehicle");

            console.log("SELECTED MAKE:", sMakeSlug);
            console.log("MAKE NAME:", sMakeName);

            // Save selected make
            oModel.setProperty("/selectedMake", sMakeSlug);
            oModel.setProperty("/selectedMakeName", sMakeName);

            // Reset model and year
            oModel.setProperty("/models", []);
            oModel.setProperty("/years", []);

            oModel.setProperty("/selectedModel", "");
            oModel.setProperty("/selectedModelName", "");
            oModel.setProperty("/selectedYear", "");

            oModel.setProperty("/products", []);
            oModel.setProperty("/productsLoaded", false);

            // Load models for selected make
            this._loadModels(sMakeSlug);
        },


        // ============================================================
        // Load Vehicle Models
        // ============================================================

        _loadModels: function (sMakeSlug) {

            var oModel = this.getView().getModel("vehicle");

            console.log(
                "Loading models for make:",
                sMakeSlug
            );

            var sUrl =
                this.API_BASE +
                "/models?make=" +
                encodeURIComponent(sMakeSlug);

            console.log("MODEL API URL:", sUrl);

            fetch(sUrl)
                .then(function (oResponse) {

                    console.log(
                        "MODEL RESPONSE STATUS:",
                        oResponse.status
                    );

                    if (!oResponse.ok) {
                        throw new Error(
                            "Failed to load models. HTTP " +
                            oResponse.status
                        );
                    }

                    return oResponse.json();
                })
                .then(function (oData) {

                    console.log(
                        "FULL MODEL API RESPONSE:",
                        oData
                    );

                    /*
                     * IMPORTANT:
                     *
                     * The API can return the model collection
                     * directly or inside a property such as
                     * "models" or "data".
                     */

                    var aModels = [];

                    if (Array.isArray(oData)) {

                        aModels = oData;

                    } else if (Array.isArray(oData.models)) {

                        aModels = oData.models;

                    } else if (Array.isArray(oData.data)) {

                        aModels = oData.data;
                    }

                    console.log(
                        "PARSED MODELS:",
                        aModels
                    );

                    /*
                     * Make sure every item has the properties
                     * expected by the XML.
                     */

                    aModels = aModels.map(function (oItem) {

                        return {
                            slug: oItem.slug || "",
                            model: oItem.model || oItem.name || ""
                        };

                    });

                    console.log(
                        "FINAL MODELS FOR UI5:",
                        aModels
                    );

                    oModel.setProperty(
                        "/models",
                        aModels
                    );

                    // Force model update
                    oModel.refresh(true);

                })
                .catch(function (oError) {

                    console.error(
                        "MODEL API ERROR:",
                        oError
                    );

                    oModel.setProperty(
                        "/models",
                        []
                    );

                    MessageToast.show(
                        "Unable to load vehicle models."
                    );
                });
        },


        // ============================================================
        // Vehicle Model Changed
        // ============================================================

        onModelChange: function (oEvent) {

            var oSelectedItem =
                oEvent.getParameter("selectedItem");

            if (!oSelectedItem) {
                return;
            }

            var sModelSlug =
                oSelectedItem.getKey();

            var sModelName =
                oSelectedItem.getText();

            var oVehicleModel =
                this.getView().getModel("vehicle");

            console.log(
                "SELECTED MODEL SLUG:",
                sModelSlug
            );

            console.log(
                "SELECTED MODEL NAME:",
                sModelName
            );

            oVehicleModel.setProperty(
                "/selectedModel",
                sModelSlug
            );

            oVehicleModel.setProperty(
                "/selectedModelName",
                sModelName
            );

            // Reset years
            oVehicleModel.setProperty(
                "/years",
                []
            );

            oVehicleModel.setProperty(
                "/selectedYear",
                ""
            );

            /*
             * Load years based on the selected make + model.
             */
            this._loadYears(
                oVehicleModel.getProperty("/selectedMake"),
                sModelSlug
            );
        },


        // ============================================================
        // Load Vehicle Years
        // ============================================================

        _loadYears: function (sMakeSlug, sModelSlug) {

            var oModel =
                this.getView().getModel("vehicle");

            /*
             * YMMFit model objects contain the years
             * available for that model.
             *
             * If the API response does not provide the
             * years directly, we create the year list
             * from the model's yearFrom/yearTo values.
             */

            var sUrl =
                this.API_BASE +
                "/models?make=" +
                encodeURIComponent(sMakeSlug);

            fetch(sUrl)
                .then(function (oResponse) {

                    if (!oResponse.ok) {
                        throw new Error(
                            "Unable to reload model data."
                        );
                    }

                    return oResponse.json();
                })
                .then(function (oData) {

                    var aModels = [];

                    if (Array.isArray(oData)) {

                        aModels = oData;

                    } else if (Array.isArray(oData.models)) {

                        aModels = oData.models;

                    } else if (Array.isArray(oData.data)) {

                        aModels = oData.data;
                    }

                    /*
                     * Find the exact selected model.
                     */

                    var oSelectedModel =
                        aModels.find(function (oItem) {

                            return oItem.slug === sModelSlug;
                        });

                    console.log(
                        "SELECTED MODEL OBJECT:",
                        oSelectedModel
                    );

                    if (!oSelectedModel) {

                        console.warn(
                            "Selected model was not found in API response."
                        );

                        oModel.setProperty(
                            "/years",
                            []
                        );

                        return;
                    }

                    var aYears = [];

                    /*
                     * If API gives an explicit years array,
                     * use it.
                     */

                    if (Array.isArray(oSelectedModel.years)) {

                        aYears = oSelectedModel.years.map(
                            function (oYear) {

                                if (typeof oYear === "object") {
                                    return {
                                        year: String(
                                            oYear.year ||
                                            oYear.value ||
                                            ""
                                        )
                                    };
                                }

                                return {
                                    year: String(oYear)
                                };
                            }
                        );

                    } else {

                        /*
                         * Otherwise create years using
                         * yearFrom and yearTo.
                         */

                        var iFrom =
                            Number(oSelectedModel.yearFrom);

                        var iTo =
                            Number(oSelectedModel.yearTo);

                        if (
                            !isNaN(iFrom) &&
                            !isNaN(iTo)
                        ) {

                            for (
                                var iYear = iFrom;
                                iYear <= iTo;
                                iYear++
                            ) {

                                aYears.push({
                                    year: String(iYear)
                                });
                            }
                        }
                    }

                    console.log(
                        "YEARS:",
                        aYears
                    );

                    oModel.setProperty(
                        "/years",
                        aYears
                    );

                    oModel.refresh(true);
                })
                .catch(function (oError) {

                    console.error(
                        "YEAR API ERROR:",
                        oError
                    );

                    oModel.setProperty(
                        "/years",
                        []
                    );
                });
        },


        // ============================================================
        // Find Compatible Products
        // ============================================================

        onFindProducts: function () {

            var oModel =
                this.getView().getModel("vehicle");

            var sMake =
                oModel.getProperty("/selectedMake");

            var sModel =
                oModel.getProperty("/selectedModel");

            var sYear =
                oModel.getProperty("/selectedYear");

            if (!sMake || !sModel || !sYear) {

                MessageToast.show(
                    "Please select make, model and year."
                );

                return;
            }

            var sUrl =
                this.API_BASE +
                "/parts?make=" +
                encodeURIComponent(sMake) +
                "&model=" +
                encodeURIComponent(sModel) +
                "&year=" +
                encodeURIComponent(sYear);

            console.log(
                "PARTS API URL:",
                sUrl
            );

            fetch(sUrl)
                .then(function (oResponse) {

                    if (!oResponse.ok) {
                        throw new Error(
                            "Failed to load products. HTTP " +
                            oResponse.status
                        );
                    }

                    return oResponse.json();
                })
                .then(function (oData) {

                    console.log(
                        "PRODUCT API RESPONSE:",
                        oData
                    );

                    var aProducts =
                        oData.parts || [];

                    /*
                     * Convert API fields to the fields
                     * used by the XML.
                     */

                    aProducts =
                        aProducts.map(function (oProduct) {

                            return {
                                name:
                                    oProduct.title ||
                                    oProduct.name ||
                                    "",

                                description:
                                    oProduct.note ||
                                    "",

                                mpn:
                                    oProduct.mpn ||
                                    "",

                                source:
                                    oProduct.source ||
                                    ""
                            };
                        });

                    oModel.setProperty(
                        "/products",
                        aProducts
                    );

                    oModel.setProperty(
                        "/productsLoaded",
                        true
                    );

                    oModel.refresh(true);

                    MessageToast.show(
                        aProducts.length +
                        " compatible product(s) found."
                    );
                })
                .catch(function (oError) {

                    console.error(
                        "PRODUCT API ERROR:",
                        oError
                    );

                    oModel.setProperty(
                        "/products",
                        []
                    );

                    oModel.setProperty(
                        "/productsLoaded",
                        true
                    );

                    MessageToast.show(
                        "Unable to load compatible products."
                    );
                });
        },


        // ============================================================
        // Back Button
        // ============================================================

        onBack: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("home");
        }

    });

});