sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"oms/ordermanagementsystem/test/integration/pages/OrdersList",
	"oms/ordermanagementsystem/test/integration/pages/OrdersObjectPage",
	"oms/ordermanagementsystem/test/integration/pages/OrderItemsObjectPage"
], function (JourneyRunner, OrdersList, OrdersObjectPage, OrderItemsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('oms/ordermanagementsystem') + '/test/flp.html#app-preview',
        pages: {
			onTheOrdersList: OrdersList,
			onTheOrdersObjectPage: OrdersObjectPage,
			onTheOrderItemsObjectPage: OrderItemsObjectPage
        },
        async: true
    });

    return runner;
});

