import { FieldDefinition } from "./ChainDocumentRequirement";
import { ChainProcessingEvidenceType } from "./ChainProcessingEvidenceType";
import { ChainSemiProduct } from "./ChainSemiProduct";
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";

export interface DocTypeIdsWithRequired {
    processingEvidenceTypeId: string;
    required?: boolean;
    requiredOnQuote?: boolean;
    requiredOneOfGroupIdForQuote?: string | null;
}

/**
 *
 */
export interface ChainProcessingAction extends DocType, TimeStamped {
    /**
     * id reference of the relevant ChainProduct
     */
    productId: string;
    /**
     * id reference of the relevant ChainOrganization
     */
    organizationId: string;
    /**
     * Name of the processing action
     */
    name: string;
    /**
     * Description of the processing action
     */
    description: string;
    /**
     * Input semi-product id
     */
    inputSemiProductId?: string;
    /**
     * Output semi-product id
     */
    outputSemiProductId?: string;
    /**
     * Required fields
     */
    requiredFields?: FieldDefinition[];
    /**
     * Input semi-product on get only
     */
    inputSemiProduct?: ChainSemiProduct;
    /**
     * Output semi-product on get only
     */
    outputSemiProduct?: ChainSemiProduct;
    /**
     * List of required document types for processing ids
     */
    requiredDocTypeIds?: string[];
    /**
     * List of required document types for processing ids
     */
    requiredDocTypeIdsWithRequired?: DocTypeIdsWithRequired[];
    /**
     * List of required document types for processing ids
     */
    requiredDocTypes?: ChainProcessingEvidenceType[];
    /**
     * If transaction output has multiple outputSemiProducts
     */
    repackedOutputs?: boolean | null;
    /**
     * Max weight of one of the multiple outputSemiProducts (required if repackedOutputs)
     */
    maxOutputWeight?: number | null;
    /**
     * Type of processing transaction.
     * PROCESSING: many-to-many semi products, consumed and produced quantities not connected
     * SHIPMENT: same semiproduct. Acts as an order of the same quantity from target facility
     */
    type?: 'PROCESSING' | 'SHIPMENT' | 'TRANSFER';
    /**
     * Prefix. Used to build internal lot number names.
     */
    prefix?: string;
    /**
     * Public timeline name. If not null, the processing order with this action is shown on public timeline.
     */
    publicTimelineLabel?: string | null;
    /**
     * Public timeline location.
     */
    publicTimelineLocation?: string | null;
    /**
     * Icon type in public timeline
     */
    publicTimelineIcon?: 'SHIP' | 'LEAF' | 'WAREHOUSE' | 'QRCODE' | 'OTHER' | null
}

// export interface StrippedProcessingAction {
//     name: string;
//     description: string;
//     type?: 'PROCESSING' | 'SHIPMENT' | 'TRANSFER';
// }

export class ChainProcessingActionDB extends DBDocument<ChainProcessingAction> {
    _prefix = "PROCESSACTION"
    docType = "process_action"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            {
                field: "productId",
                docType: "product",
                required: true
            },
            {
                field: "organizationId",
                docType: "organization",
                required: true
            },
        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['inputSemiProduct', 'outputSemiProduct', 'requiredDocTypes']
    }

}