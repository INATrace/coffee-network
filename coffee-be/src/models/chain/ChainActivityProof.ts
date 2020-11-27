import { ChainFileInfo } from "./ChainFileInfo";
import { DBDocument, DocType, TimeStamped } from "./DBDocument";

/**
 * Chain action proof
 */
export interface ChainActivityProof extends DocType, TimeStamped {
    /**
     * Formal date of the action proof.
     */
    formalCreationDate: string;
    /**
     * Valid until
     */
    validUntil?:string;
    /**
     * Type of the proof.
     */
    type: any;
    /**
     * Formal document proof.
     */
    document?: ChainFileInfo;
}

export class ChainActivityProofDB extends DBDocument<ChainActivityProof> {
    _prefix = "ACTPROOF"
    docType = "action_proof"
}