import { ChainFacility } from "./ChainFacility";
import { ChainMeasureUnitType } from "./ChainMeasureUnitType";
import { ChainProcessingAction } from "./ChainProcessingAction";
import { ChainStockOrder } from "./ChainStockOrder";
import { ChainTransaction } from "./ChainTransaction";
import { DBDocument, DocType, TimeStamped } from "./DBDocument";


/**
 * Processing order executed according to processing transaction.
 */
export interface ChainProcessingOrder extends DocType, TimeStamped {
    /**
     * Facility id. Not clear, how to put this into facility.
     */
    facilityId?: string;
    /**
     * Processing action id.
     */
    processingActionId: string;
    /**
     * Processing order initiator (user), userId from af-coffee-ap
     */
    initiatorUserId: string;
    /**
     * Target stock order Ids. Calculated when saving. Should not be counted as a reference when programing chaincode since the primary reference is from targert order back.
     */
    targetStockOrderIds?: string[];
    /**
     * Desired quantity when it acts like an order (processing action type is TRANSFER.
     */
    desiredQuantity?: number
    /**
     * Measure unit of the desired quantity.
     */
    desiredQuantityUnit?: ChainMeasureUnitType
    /**
     * Facility. Read only.
     */
    facility?: ChainFacility;
    /**
     * Target stock orders. Read only.
     */
    targetStockOrders?: ChainStockOrder[];
    /**
     * Input transactions. Read only.
     */
    inputTransactions?: ChainTransaction[]
    /**
     * Processing action. Read only.
     */
    processingAction?: ChainProcessingAction
    /**
     * Input stock orders. Read only
     */
    inputOrders?: ChainStockOrder[]
    /**
     * Processing date
     */
    processingDate?: string | null;
}


export class ChainProcessingOrderDB extends DBDocument<ChainProcessingOrder> {
    _prefix = "PORD"
    docType = "processing_order"

    public get fieldsToCleanOnSave(): string[] {
        return ['gradeAbbreviation', 'processingAction', 'inputTransactions', 'targetStockOrders', 'facility' ]
    }

}