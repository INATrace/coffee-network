import { ChainCompanyCustomer } from "./ChainCompanyCustomer";
import { ChainFacility } from "./ChainFacility";
import { ChainGradeAbbreviation } from "./ChainGradeAbbreviation";
import { ChainProcessingOrder } from "./ChainProcessingOrder";
import { ChainStockOrder } from "./ChainStockOrder";
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";


/**
 * Represents a product order. Items in the order are
 */
export interface ChainProductOrder extends DocType, TimeStamped {
    /**
     * Order id.
     */
    id: string;
    /**
     * Facility to which order is ordered
     */
    facilityId: string;
    /**
     * Order delivery deadline
     */
    deliveryDeadline?: string | null;
    /**
     * Company customer id.
     */
    customerId?: string;
    /**
     * Indicator whether only women's coffee is required
     */
    requiredwomensOnly?: boolean;
    /**
     * Grade Id.
     */
    requiredGradeId?: string;
    /**
     * Document requirements
     */
    // documentRequirements?: ChainDocumentRequirement[];
    // /**
    //  * Score targets
    //  */
    // scoreTargets?: ScoreTargets
    /**
     * Read only list of ordered items. Used also on creation
     */
    items?: ChainStockOrder[] | null;
    /**
     * Read only facility.
     */
    facility?: ChainFacility;
    /**
     * Read only company customer.
     */
    customer?: ChainCompanyCustomer;
    /**
     * Read only required grade.
     */
    requiredGrade?: ChainGradeAbbreviation;
    /**
     * Processing orders. Insert only. Does not get saved. Used for creating orders.
     */
    processingOrders?: ChainProcessingOrder[]
    /**
     * List of open orders
     */
    open?: boolean
}

export class ChainProductOrderDB extends DBDocument<ChainProductOrder> {
    _prefix = "ORD"
    docType = "order"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            {
                field: "facilityId",
                docType: "facility",
                required: true
            },
            {
                field: "customerId",
                docType: "company_customer",
                required: false
            },
            {
                field: "requiredGradeId",
                docType: "c_grade_abbreviation",
                required: false
            },
        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['facility', 'items', 'customer', 'requiredGrade', 'processingOrders']
    }


}