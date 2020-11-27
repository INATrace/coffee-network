
export const aggregateViews = [
    {
        "_id": "_design/aggregates",
        "views":
        {
            "transactions_sums":
            {
                "map": "function(doc) { \
                    if(doc.docType === 'transaction') { \
                        emit([doc.sourceFacilityId, doc.sourceStockOrderId, doc._id], {_id: doc.sourceStockOrderId, direction: -1, quantity: doc.inputQuantity});\
                        emit([doc.targetFacilityId, doc.targetStockOrderId, doc._id], {_id: doc.targetStockOrderId, direction: 1, quantity: doc.outputQuantity});\
                    }\
                }",
                "reduce": "function(keys, values, rereduce) {\
                    if(rereduce) {\
                        return {\
                            _id: values.length ? values[0]._id : null,\
                            totalInputQuantity: values.reduce(function(a, b) {return a + b.totalInputQuantity}, 0),\
                            totalOutputQuantity: values.reduce(function(a, b) {return a + b.totalOutputQuantity}, 0),\
                            totalQuantity: values.reduce(function(a, b) {return a - b.totalOutputQuantity + b.totalInputQuantity}, 0),\
                        }\
                    }\
                    return {\
                        _id: values.length ? values[0]._id : null,\
                        totalInputQuantity: values.reduce(function(a, b) {return a + b.direction > 0 ? b.quantity : 0}, 0),\
                        totalOutputQuantity: values.reduce(function(a, b) {return a + b.direction < 0 ? b.quantity: 0}, 0),\
                        totalQuantity: values.reduce(function(a, b) {return a + b.direction*b.quantity}, 0),\
                    }\
                }",
                "language": "javascript"
            },
            "semi_product_availability_in_facility":
            {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order') { \
                        emit([doc.facilityId, doc.semiProductId, doc._id], doc.availableQuantity);\
                    }\
                }",
                "reduce": "_sum",
                "language": "javascript"
            },
            "purchase_order_count":
            {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.isPurchaseOrder) { \
                        emit(doc._id, 1);\
                    }\
                }",
                "reduce": "_count",
                "language": "javascript"
            },
            "payments_count":
            {
                "map": "function(doc) { \
                    if(doc.docType === 'payment') { \
                        emit(doc._id, 1);\
                    }\
                }",
                "reduce": "_count",
                "language": "javascript"
            }
        }
    }
]
