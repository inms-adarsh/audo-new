(function () {
    'use strict';

    angular
        .module('app.notes')
        .controller('NotesController', NotesController);

    /** @ngInject */
    function NotesController($state, $scope, $timeout, $compile, $mdDialog, $q, $document, authService, firebaseUtils, config, msUtils, dxUtils, noteService, languages) {
        var vm = this,
            formInstance,
            dataGridInstance,
            cartFormInstance;

        // Data
        // Methods
        init();
        //////////

        function init() {
            vm.noteGridOptions = gridOptions('vm.notes', $scope.customers);
        }

        $scope.popupOptions = {
            contentTemplate: "info",
            showTitle: true,
            width: '500px',
            height: 'auto',
            title: "Add Audio Note",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visiblePopup"
            },
            onHidden: function () {
                resetValues();
            }
        };

        $scope.cartPopupOptions = {
            contentTemplate: "cart",
            showTitle: true,
            width: '500px',
            height: 'auto',
            title: "Buy More Words",
            dragEnabled: false,
            closeOnOutsideClick: true,
            bindingOptions: {
                visible: "visibleCartPopup"
            },
            onHidden: function () {
                resetCartValues();
            }
        };

        function resetValues() {
            formInstance.resetValues();
        }

        function resetCartValues() {
            cartFormInstance.resetCartValues();
        }

        $scope.buttonOptions = {
            text: "Save and Exit",
            type: "success",
            useSubmitBehavior: true,
            validationGroup: "customerData",
            onClick: function (e) {
                submitForm(e).then(function () {
                    $scope.visiblePopup = false;
                });
            }
        };

        $scope.purchaseBtnOptions = {
            text: "Purchase",
            type: "success",
            useSubmitBehavior: true,
            validationGroup: "cartData",
            onClick: function (e) {
                submitPurchaseForm(e).then(function () {
                    $scope.visibleCartPopup = false;
                });
            }
        };


        $scope.saveNewBttonOptions = {
            text: "Save and New",
            type: "info",
            useSubmitBehavior: true,
            validationGroup: "customerData",
            onClick: function (e) {
                submitForm(e);
            }
        };

        function submitForm(e) {
            var defer = $q.defer();
            var result = e.validationGroup.validate();
            if (result.isValid == true) {
                var formData = formInstance.option('formData');
                var bookingData = angular.copy(formData);
                noteService.saveNote(bookingData).then(function () {
                    init();
                    dataGridInstance.refresh();
                    resetValues();
                    defer.resolve();
                });
            }
            return defer.promise;
        }

        function submitPurchaseForm(e) {
            var defer = $q.defer();
            var result = e.validationGroup.validate();
            if (result.isValid == true) {
                var formData = cartFormInstance.option('formData');
                var purchaseData = angular.copy(formData);
                noteService.buyCredits(purchaseData).then(function () {
                    init();
                    dataGridInstance.refresh();
                    resetValues();
                    defer.resolve();
                });
            }
            return defer.promise;
        }

        /**
         * Bulk buy form
         * @param {*} customerList 
         * @param {*} beerList 
         */
        vm.bulkgridForm = {
            colCount: 1,
            onInitialized: function (e) {
                formInstance = e.component;
            },
            validationGroup: "customerData",
            items: [{
                dataField: 'date',
                label: {
                    text: 'Date'
                },
                editorType: 'dxDateBox',
                editorOptions: {
                    width: '100%',
                    onInitialized: function (e) {
                        e.component.option('value', new Date());
                    },
                    visible: false
                },
                validationRules: [{
                    type: 'required',
                    message: 'Date is required'
                }],
                visible: false
            }, {
                dataField: 'title',
                caption: 'Title',
                dataType: 'string',
                validationRules: [{
                    type: 'required',
                    message: 'Title is required'
                }]
            }, {
                dataField: 'description',
                label: {
                    text: 'Content'
                },
                name: 'description',
                editorType: 'dxTextArea'

            }, {
                dataField: 'language',
                label: {
                    text: 'Selected Language'
                },
                name: 'selectedLang',
                editorType: 'dxSelectBox',
                editorOptions: {
                    dataSource: languages,
                    displayExpr: "name",
                    valueExpr: "code",
                    searchExpr: ["name"],
                    onSelectionChanged: function (data) {
                        if (data.selectedItem && data.selectedItem.$id) {
                            formInstance.getEditor('voice').option('dataSource', data.selectedItem.voices);
                        }
                    }
                },
                validationRules: [{
                    type: 'required',
                    message: 'Please select a language'
                }]
            }, {
                dataField: 'voice',
                label: {
                    text: 'Selecte a default voice'
                },
                name: 'voice',
                editorType: 'dxSelectBox',
                editorOptions: {
                    dataSource: languages,
                    displayExpr: "Id",
                    valueExpr: "Name",
                    searchExpr: ["Name"]
                },
                validationRules: [{
                    type: 'required',
                    message: 'Please select a voice'
                }]
            }]
        };

        vm.cartForm = {
            colCount: 1,
            onInitialized: function (e) {
                cartFormInstance = e.component;
            },
            validationGroup: "cartData",
            items: [{
                dataField: 'date',
                label: {
                    text: 'Date'
                },
                editorType: 'dxDateBox',
                editorOptions: {
                    width: '100%',
                    onInitialized: function (e) {
                        e.component.option('value', new Date());
                    },
                    visible: false
                },
                validationRules: [{
                    type: 'required',
                    message: 'Date is required'
                }],
                visible: false
            }, {
                dataField: 'noOfWords',
                label: {
                    text: 'Enter Words Count'
                },
                name: 'noOfWords',
                editorType: 'dxNumberBox',
                validationRules: [{
                    type: 'required',
                    message: 'Please select a value'
                }]
            }, {
                label: {
                    text: 'Cost'
                },
                template: '0.02$ per word'
            }]
        };

        $scope.opts = {
            env: 'sandbox',
            client: {
                sandbox: 'AWi18rxt26-hrueMoPZ0tpGEOJnNT4QkiMQst9pYgaQNAfS1FLFxkxQuiaqRBj1vV5PmgHX_jA_c1ncL',
                production: 'AVZhosFzrnZ5Mf3tiOxAD0M6NHv8pcB2IFNHAfp_h69mmbd-LElFYkJUSII3Y0FPbm7S7lxBuqWImLbl'
            },
            payment: function () {
                var env = this.props.env;
                var client = this.props.client;

                //var formData = cartFormInstance.option('formData');
                return paypal.rest.payment.create(env, client, {
                    transactions: [
                        {
                            amount: { total: 0.02, currency: 'USD' }
                        }
                    ]
                });
            },
            commit: true, // Optional: show a 'Pay Now' button in the checkout flow
            onAuthorize: function (data, actions) {
                // Optional: display a confirmation page here
                return actions.payment.execute().then(function () {
                    alert("Payment Successful");
                });
            }
        };
        /**
         * Grid Options for note list
         * @param {Object} dataSource 
         */
        function gridOptions() {
            $scope.gridCols = [{
                dataField: 'date',
                caption: 'Date',
                dataType: 'date',
                validationRules: [{
                    type: 'required',
                    message: 'Date is required'
                }]
            },
            {
                dataField: 'title',
                caption: 'Title',
                dataType: 'string',
                validationRules: [{
                    type: 'required',
                    message: 'Title is required'
                }]
            }, {
                dataField: 'downloadUrl',
                caption: 'Download',
                cellTemplate: function (container, options) {
                    if (options.data.downloadUrl) {
                        $('<a href=' + options.data.downloadUrl + '>Download Audio</a>').appendTo(container);
                    }
                }

            }, {
                dataField: 'status',
                caption: 'Status'
            }];

            var gridOptions = dxUtils.createGrid(),
                otherConfig = {
                    dataSource: {
                        load: function () {
                            var defer = $q.defer();
                            noteService.fetchNoteList().then(function (data) {
                                defer.resolve(data);
                            });
                            return defer.promise;
                        },
                        insert: function (noteObj) {
                            //var data = formInstance.option('formData');
                            noteService.saveNote(noteObj);
                        },
                        update: function (key, noteObj) {
                            noteService.updateNote(key, noteObj);
                        },
                        remove: function (key) {
                            noteService.deleteNote(key);
                        }
                    },
                    summary: {
                        totalItems: [{
                            column: 'balancedQuantity',
                            summaryType: 'sum',
                            texts: {
                                sum: 'Total Balanced'
                            }
                        }]
                    },
                    editing: {
                        allowAdding: false,
                        allowUpdating: false,
                        allowDeleting: true,
                        mode: 'form'
                    },
                    bindingOptions: {
                        columns: 'gridCols'
                    },
                    export: {
                        enabled: true,
                        fileName: 'Notes',
                        allowExportSelectedData: true
                    },
                    onRowInserted: function () {
                        init();
                        dataGridInstance.repaint();
                        dataGridInstance.refresh();
                    }, onToolbarPreparing: function (e) {
                        e.toolbarOptions.items.unshift({
                            location: "after",
                            template: function () {
                                return $("<div/>")
                                    .addClass("informer")
                                    .append(
                                    $("<b />")
                                        .addClass("count")
                                        .text('100 Words')
                                    );
                            }
                        }, {
                                location: "before",
                                widget: "dxButton",
                                options: {
                                    text: "Create Audio Note",
                                    type: "success",
                                    onClick: function (e) {
                                        $scope.visiblePopup = true;
                                    }
                                }
                            }, {
                                location: "after",
                                widget: "dxButton",
                                options: {
                                    text: "Buy More",
                                    icon: "cart",
                                    type: "default",
                                    onClick: function (e) {
                                        $scope.visibleCartPopup = true;
                                    }
                                }
                            });
                    },
                    onContentReady: function (e) {
                        dataGridInstance = e.component;
                    },
                    onRowPrepared: function (info) {
                        if (info.rowType == 'data' && new Date(info.data.expiryDate).getTime() < new Date().getTime())
                            info.rowElement.addClass("md-red-50-bg");
                    }
                };

            angular.extend(gridOptions, otherConfig);
            return gridOptions;
        }

    }
})();