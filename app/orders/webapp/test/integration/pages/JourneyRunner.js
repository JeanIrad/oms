sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"oms/orders/test/integration/pages/OrdersList",
	"oms/orders/test/integration/pages/OrdersObjectPage",
	"oms/orders/test/integration/pages/OrderItemsObjectPage"
], function (JourneyRunner, OrdersList, OrdersObjectPage, OrderItemsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('oms/orders') + '/test/flp.html#app-preview',
        pages: {
			onTheOrdersList: OrdersList,
			onTheOrdersObjectPage: OrdersObjectPage,
			onTheOrderItemsObjectPage: OrderItemsObjectPage
        },
        async: true
    });

    return runner;
});

