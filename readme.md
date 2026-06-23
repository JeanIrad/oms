<mvc:View
controllerName="oms.orderscustom.controller.Orders"
xmlns="sap.m"
xmlns:mvc="sap.ui.core.mvc">
<Page title="Orders">
<headerContent>
<Button
        text="Create Order"
        type="Emphasized"
        icon="sap-icon://add"
        press="onCreateOrder"/>
</headerContent>
<content>
<core:Fragment
xmlns:core="sap.ui.core"
fragmentName="oms.orderscustom.view.FilterPanel"
type="XML"/>
<Table
        id="ordersTable"
        items="{
          path: '/Orders',
          parameters: {
            $$updateGroupId: 'auto',
            $select: 'ID,status,totalPrice,createdAt,customer_ID',
            $expand: { customer: { $select: 'ID,name' } }
          }
        }"
        growing="true"
        growingThreshold="20"
        noDataText="No orders found">
<headerToolbar>
<Toolbar>
<Title text="Orders" level="H2"/>
<ToolbarSpacer/>
</Toolbar>
</headerToolbar>
<columns>
<Column><Text text="Customer"/></Column>
<Column><Text text="Order date"/></Column>
<Column><Text text="Total price"/></Column>
<Column><Text text="Status"/></Column>
<Column><Text text="Actions"/></Column>
</columns>
<items>
<ColumnListItem>
<cells>
<Text text="{customer/name}"/>
<Text text="{path: 'createdAt', type: 'sap.ui.model.type.DateTime', formatOptions: {style: 'medium'}}"/>
<Text text="{path: 'totalPrice', type: 'sap.ui.model.type.Currency', formatOptions: {showMeasure: false}} USD"/>
<ObjectStatus text="{status}" state="{= ${status} === 'CONFIRMED' ? 'Success' : ${status} === 'CANCELLED' ? 'Error' : ${status} === 'SHIPPED' ? 'Information' : 'None' }"/>
<HBox>
<Button
                  text="Confirm"
                  type="Emphasized"
                  press="onConfirm"
                  class="sapUiTinyMarginEnd"
                  visible="{= ${status} === 'PENDING' }"/>
<Button
                  text="Ship"
                  type="Default"
                  press="onShip"
                  class="sapUiTinyMarginEnd"
                  enabled="{= ${status} === 'CONFIRMED' }"
                  visible="{= ${status} === 'CONFIRMED' }"/>
<Button
                  text="Cancel"
                  type="Reject"
                  press="onCancel"
                  visible="{= ${status} === 'PENDING' || ${status} === 'CONFIRMED' }"/>
</HBox>
</cells>
</ColumnListItem>
</items>
</Table>
</content>
</Page>
</mvc:View>
