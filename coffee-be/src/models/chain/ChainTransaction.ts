import { ChainActionType } from "./ChainActionType";
import { ChainFacility } from "./ChainFacility";
import { ChainGradeAbbreviation } from "./ChainGradeAbbreviation";
import { ChainMeasureUnitType } from "./ChainMeasureUnitType";
import { ChainSemiProduct } from "./ChainSemiProduct";
import { ChainStockOrder } from "./ChainStockOrder";
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";


/**
 * Represents a chain value transaction between product units. Essentialy a transaction
 * denotes taking some quantity of a source product unit (sourceProductUnitid) and transferring it to some
 * target product unit (targetProductUnitId), where the product units are necessary different.
 * Product units can be in the same facility (e.g. processing) or in different ones (e.g. transporations).
 * Exact business operation is denoted by actionOrShippment
 */
export interface ChainTransaction extends DocType, TimeStamped {
    /**
     * OrganizationId
     */
    organizationId: string;
    /**
     * Transaction initiator (user), userId from af-coffee-ap
     */
    initiatorUserId: string;
    /**
     * Source stock order ids
     */
    sourceStockOrderId?: string;
    /**
     * Target stock order unit ids
     */
    targetStockOrderId?: string;
    /**
     * Semi product id. Auto set at inserting
     */
    semiProductId?: string;
    /**
     * Source facility. Set automatically from the semi product.
     */
    sourceFacilityId?: string;
    /**
     * Target facility. Set automatically from the semi product.
     */
    targetFacilityId?: string;
    /**
     * True if the transaction is a processing transactions
     */
    isProcessing?: boolean;
    /**
     * Definition of transaction action viewed as a business action.
     */
    actionType?: ChainActionType;
    /**
     * Transaction status.
     */
    status: 'PENDING' | 'CANCELED' | 'EXECUTED';
    /**
     * Shippment code
     */
    shippmentId?: string
    /**
     * Input measure unit type. Set automatically from semi product.
     */
    inputMeasureUnitType?: ChainMeasureUnitType;
    /**
     * Input quantity
     */
    inputQuantity: number;
    /**
     * Output measure unit type. Set automatically from semi product.
     */
    outputMeasureUnitType?: ChainMeasureUnitType;
    /**
     * Output quantity
     */
    outputQuantity: number;
    /**
     * Price per unit
     */
    pricePerUnit?: number;
    /**
     * Currency code according to ISO 4217 for pricePerUnit
     */
    currency?: string;
    /**
     * Grade abbreviaton id
     */
    gradeAbbreviationId?: string;
    /**
     * Reject comment;
     */
    rejectComment?: string;
    /**
     * Grade abbreviaton readOnly
     */
    gradeAbbreviation?: ChainGradeAbbreviation;
    /**
     * Source facility object. Read only
     */
    sourceFacility?: ChainFacility;
    /**
     * Target facility object. Read only.
     */
    targetFacility?: ChainFacility;
    /**
     * Semi product object. Read only;
     */
    semiProduct?: ChainSemiProduct;
    /**
     * Source stock order. Read only
     */
    sourceStockOrder?: ChainStockOrder;
}


export class ChainTransactionDB extends DBDocument<ChainTransaction> {
    _prefix = "TX"
    docType = "transaction"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            // TODO: model changed to sourceStockOrderIds and targetStockOrderIds
            {
                field: "sourceStockOrderId",
                docType: "stock_order",
                required: false
            },
            {
                field: "targetStockOrderId",
                docType: null, // "stock_order",  // can be stock_order or processing_order
                required: false // temporarily set to false (model changed to sourceStockOrderIds and targetStockOrderIds)
            },
            {
                field: "initiatorUserId",
                docType: "user",
                required: true
            },
        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['gradeAbbreviation']
    }

}