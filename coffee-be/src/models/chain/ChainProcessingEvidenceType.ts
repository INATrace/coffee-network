import { ChainSemiProduct } from "./ChainSemiProduct"
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument"

/**
 * Codebook for processing evidence type
 */
export interface ChainProcessingEvidenceType extends DocType, TimeStamped {
    /**
     * capitalized underscored string that defines the document requirement
     */
    id: string,
    /**
     * Default english label
     */
    label: string;
    // /**
    //  * Defines semi product to which the evidence is relevant
    //  */
    // semiProductId?: string
    /**
     * Type of evidence type. DOCUMENT is prescribed (date, type, document). FIELD is any other. Some others can be added.
     */
    type?: 'DOCUMENT' | 'FIELD' | 'CALCULATED';
    /**
     * Whether the evidence is of fairness type
     */
    fairness?: boolean | null;
    /**
     * Whether the evidence is of provenance type
     */
    provenance?: boolean | null;
    /**
     * Whether the evidence is of quality type
     */
    quality?: boolean | null;
    // /**
    //  * Semi product matching to semiProductId
    //  */
    // semiProduct?: ChainSemiProduct
    /**
     * Whether the evidence is required (not used for settings, just in transformations)
     */
    required?: boolean | null;
    /**
     * Whether the evidence is required on quote (not used for settings, just in transformations)
     */
    requiredOnQuote?: boolean | null;
    /**
     * Defines a group in which at least one document has to be provided (is required)
     */
    requiredOneOfGroupIdForQuote?: string | null;
}


export class ChainProcessingEvidenceTypeDB extends DBDocument<ChainProcessingEvidenceType> {
    _prefix = "TPROCEVIDENCE"
    docType = "c_process_evidence_type"

    // public get foreignKeySchemes(): ForeignKeyScheme[] {
    //     return [
    //         {
    //             field: "semiProductId",
    //             docType: "semi_product",
    //             required: true
    //         },
    //     ]
    // }

    // public get fieldsToCleanOnSave(): string[] {
    //     return ['semiProduct']
    // }

}




