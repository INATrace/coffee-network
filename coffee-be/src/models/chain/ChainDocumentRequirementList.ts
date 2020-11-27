import { DBDocument } from "./DBDocument";
import { ChainDocumentRequirement } from "./ChainDocumentRequirement";

/**
 * Defines score targets for an order. Typically an integer counting amount of documents.
 */
export interface ScoreTargets {
    /**
     * Fairness target score
     */
    fairness: number;
    /**
     * Provenance target score
     */
    provenance: number;
    /**
     * Quality target score
     */
    quality: number;
    /**
     * Quality level (e.g. A+) - TBD enum
     */
    qualityLevel: string;
    /**
     * Required share of women's coffee (0 - 1).
     */
    womenShare: number;
    /**
     * Order target score
     */
    order: number;
    /**
     * Payment target score
     */
    payment: number;
}


export interface ChainDocumentRequirementList {
    /**
     * Identifier for document requirement (defining type)
     */
    identifier: string;
    /**
     * Semi product for which document requirement list is relevant.
     */
    semiProductId?: string;
    /**
     * List of document requirements
     */
    requirements: ChainDocumentRequirement[];
    /**
     * Document requrement targets
     */
    targets: ScoreTargets;
}


export class ChainDocumentRequirementListDB extends DBDocument<ChainDocumentRequirementList> {
    _prefix = "DOCREQLIST"
    docType = "document_requirement_list"
}
