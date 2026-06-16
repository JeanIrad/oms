using OmsService from '../srv/oms-service';

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS — field-level annotations
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.Orders with {
  ID         @title: 'Order ID'       @Core.Computed: true @UI.Hidden: true;
  status     @title: 'Status'         @Core.Computed: true @UI.HiddenFilter: false;
  totalPrice @title: 'Total Price'    @Core.Computed: true @Measures.ISOCurrency: 'USD';
  notes      @title: 'Delivery Notes' @UI.MultiLineText: true;
  createdAt  @title: 'Order Date'     @Core.Computed: true;
  createdBy  @title: 'Placed By'      @Core.Computed: true;
  modifiedAt @title: 'Last Updated'   @Core.Computed: true;

  // CRITICAL FIX: annotate the ASSOCIATION (customer), NOT customer_ID.
  // Fiori maps this to customer_ID in OData $metadata and renders a value-help
  // picker instead of a raw GUID input.
  customer @(
    title: 'Customer',
    Common.Text: customer.name,
    Common.TextArrangement: #TextOnly,
    Common.ValueList: {
      $Type:          'Common.ValueListType',
      CollectionPath: 'Customers',
      Parameters: [
        {
          $Type:             'Common.ValueListParameterOut',
          LocalDataProperty: customer_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'email'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'phone'
        }
      ]
    }
  );

  // customer_ID: hidden from display, but writable (no @Core.Computed, no @ReadOnly)
  // so the value-help out-parameter can populate it.
  customer_ID @UI.Hidden: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS — UI layout annotations
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.Orders with @(

  UI.HeaderInfo: {
    TypeName:       'Order',
    TypeNamePlural: 'Orders',
    Title:       { $Type: 'UI.DataField', Value: ID },
    Description: { $Type: 'UI.DataField', Value: status }
  },

  UI.SelectionFields: [ status, createdAt ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: customer_ID,  Label: 'Customer'    },
    { $Type: 'UI.DataField', Value: createdAt,    Label: 'Order Date'  },
    { $Type: 'UI.DataField', Value: totalPrice,   Label: 'Total Price' },
    { $Type: 'UI.DataField', Value: status,       Label: 'Status', Criticality: statusCriticality },
    {
      $Type:              'UI.DataFieldForAction',
      Action:             'OmsService.EntityContainer/confirm',
      Label:              'Confirm Order',
      InvocationGrouping: #Isolated
    },
    {
      $Type:              'UI.DataFieldForAction',
      Action:             'OmsService.EntityContainer/cancel',
      Label:              'Cancel Order',
      InvocationGrouping: #Isolated
    }
  ],

  UI.PresentationVariant: {
    MaxItems: 10,
    SortOrder: [{ Property: createdAt, Descending: true }],
    Visualizations: ['@UI.LineItem']
  },

  UI.HeaderFacets: [
    { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#StatusBadge' },
    { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#TotalBadge'  }
  ],

  UI.FieldGroup #StatusBadge: {
    Data: [{ $Type: 'UI.DataField', Value: status, Criticality: statusCriticality }]
  },

  UI.FieldGroup #TotalBadge: {
    Data: [{ $Type: 'UI.DataField', Value: totalPrice, Label: 'Order Total' }]
  },

  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID:    'GeneralFacet',
      Label: 'General Information',
      Facets: [
        { $Type: 'UI.ReferenceFacet', Label: 'Order Details', Target: '@UI.FieldGroup#OrderDetails' },
        { $Type: 'UI.ReferenceFacet', Label: 'Audit',         Target: '@UI.FieldGroup#AuditDetails' }
      ]
    },
    { $Type: 'UI.ReferenceFacet', ID: 'ItemsFacet', Label: 'Order Items', Target: 'items/@UI.LineItem' },
    { $Type: 'UI.ReferenceFacet', ID: 'NotesFacet', Label: 'Notes',       Target: '@UI.FieldGroup#NotesGroup' }
  ],

  UI.FieldGroup #OrderDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      // customer_ID renders as the customer name (via @Common.Text) with a picker
      { $Type: 'UI.DataField', Value: customer_ID,    Label: 'Customer'       },
      // customer.email is a read-only nav-property — shown after selection
      { $Type: 'UI.DataField', Value: customer.email, Label: 'Customer Email' },
      { $Type: 'UI.DataField', Value: status,         Label: 'Status',   Criticality: statusCriticality },
      { $Type: 'UI.DataField', Value: totalPrice,     Label: 'Total Price' }
    ]
  },

  UI.FieldGroup #AuditDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: createdBy,  Label: 'Placed By'    },
      { $Type: 'UI.DataField', Value: createdAt,  Label: 'Order Date'   },
      { $Type: 'UI.DataField', Value: modifiedAt, Label: 'Last Updated' }
    ]
  },

  UI.FieldGroup #NotesGroup: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: notes, Label: 'Delivery Notes' }
    ]
  }
);

annotate OmsService.Orders with @(
  UI.CreateHidden: false,
  UI.DeleteHidden: true,

  // The create dialog shows customer picker + notes.
  // customer_ID picks up the ValueList from the association annotation above.
  UI.FieldGroup #CreateForm: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: customer_ID, Label: 'Customer'        },
      { $Type: 'UI.DataField', Value: notes,       Label: 'Delivery Notes'  }
    ]
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS — field-level annotations
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.OrderItems with {
  quantity  @title: 'Quantity';
  unitPrice @title: 'Unit Price' @Core.Computed: true @Measures.ISOCurrency: 'USD';
  lineTotal @title: 'Line Total' @Core.Computed: true @Measures.ISOCurrency: 'USD';

  // CRITICAL FIX: annotate the ASSOCIATION (product), NOT product_ID.
  product @(
    title: 'Product',
    Common.Text: product.name,
    Common.TextArrangement: #TextOnly,
    Common.ValueList: {
      $Type:          'Common.ValueListType',
      CollectionPath: 'Products',
      Parameters: [
        {
          $Type:             'Common.ValueListParameterOut',
          LocalDataProperty: product_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'price'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'stock'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'category'
        }
      ]
    }
  );

  // product_ID: hidden from display, writable so the value-help can populate it.
  product_ID @UI.Hidden: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS — UI layout annotations
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.OrderItems with @(

  // HeaderInfo: replaces the raw UUID title on the OrderItems object page.
  UI.HeaderInfo: {
    TypeName:       'Order Item',
    TypeNamePlural: 'Order Items',
    Title:       { $Type: 'UI.DataField', Value: product_ID },
    Description: { $Type: 'UI.DataField', Value: quantity   }
  },

  // LineItem drives both the table view AND the inline create row.
  // product_ID renders as product.name (via @Common.Text) with value-help picker.
  // quantity is the only free-text input — unitPrice and lineTotal are computed.
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: product_ID, Label: 'Product'    },
    { $Type: 'UI.DataField', Value: quantity,   Label: 'Quantity'   },
    { $Type: 'UI.DataField', Value: unitPrice,  Label: 'Unit Price' },
    { $Type: 'UI.DataField', Value: lineTotal,  Label: 'Line Total' }
  ],

  // Facets for the OrderItems object page (shown when creation mode = NewPage).
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'Item Details', Target: '@UI.FieldGroup#ItemDetails' }
  ],

  UI.FieldGroup #ItemDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      // product_ID with value-help picker (via @Common.Text / @Common.ValueList on 'product' above)
      { $Type: 'UI.DataField', Value: product_ID,          Label: 'Product'     },
      { $Type: 'UI.DataField', Value: product.description, Label: 'Description' },
      { $Type: 'UI.DataField', Value: quantity,             Label: 'Quantity'    },
      { $Type: 'UI.DataField', Value: unitPrice,            Label: 'Unit Price'  },
      { $Type: 'UI.DataField', Value: lineTotal,            Label: 'Line Total'  }
    ]
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.Products with {
  name        @title: 'Product Name';
  description @title: 'Description' @UI.MultiLineText: true;
  price       @title: 'Price'       @Measures.ISOCurrency: 'USD';
  stock       @title: 'Stock';
  category    @title: 'Category';
}

annotate OmsService.Products with @(

  UI.HeaderInfo: {
    TypeName:       'Product',
    TypeNamePlural: 'Products',
    Title:       { $Type: 'UI.DataField', Value: name     },
    Description: { $Type: 'UI.DataField', Value: category }
  },

  UI.SelectionFields: [ category, price ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: name,     Label: 'Product Name' },
    { $Type: 'UI.DataField', Value: category, Label: 'Category'     },
    { $Type: 'UI.DataField', Value: price,    Label: 'Price'        },
    { $Type: 'UI.DataField', Value: stock,    Label: 'Stock', Criticality: stockCriticality }
  ],

  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID:    'ProductDetailsFacet',
      Label: 'Product Details',
      Facets: [
        { $Type: 'UI.ReferenceFacet', Label: 'Basic Information', Target: '@UI.FieldGroup#ProductBasic'     },
        { $Type: 'UI.ReferenceFacet', Label: 'Inventory',         Target: '@UI.FieldGroup#ProductInventory' }
      ]
    }
  ],

  UI.FieldGroup #ProductBasic: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: name,        Label: 'Product Name' },
      { $Type: 'UI.DataField', Value: description, Label: 'Description'  },
      { $Type: 'UI.DataField', Value: category,    Label: 'Category'     },
      { $Type: 'UI.DataField', Value: price,        Label: 'Price'        }
    ]
  },

  UI.FieldGroup #ProductInventory: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: stock, Label: 'Units in Stock', Criticality: stockCriticality }
    ]
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.Customers with {
  name    @title: 'Customer Name';
  email   @title: 'Email';
  phone   @title: 'Phone';
  address @title: 'Address';
  status  @title: 'Status';
}

annotate OmsService.Customers with @(

  UI.HeaderInfo: {
    TypeName:       'Customer',
    TypeNamePlural: 'Customers',
    Title:       { $Type: 'UI.DataField', Value: name  },
    Description: { $Type: 'UI.DataField', Value: email }
  },

  UI.SelectionFields: [ status ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: name,   Label: 'Name'  },
    { $Type: 'UI.DataField', Value: email,  Label: 'Email' },
    { $Type: 'UI.DataField', Value: phone,  Label: 'Phone' },
    { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality }
  ],

  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'Customer Details', Target: '@UI.FieldGroup#CustomerDetails' }
  ],

  UI.FieldGroup #CustomerDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: name,    Label: 'Full Name' },
      { $Type: 'UI.DataField', Value: email,   Label: 'Email'     },
      { $Type: 'UI.DataField', Value: phone,   Label: 'Phone'     },
      { $Type: 'UI.DataField', Value: address, Label: 'Address'   },
      { $Type: 'UI.DataField', Value: status,  Criticality: statusCriticality }
    ]
  }
);
