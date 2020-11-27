import { ApiDocument } from "../af-coffee-app/apiDocument"
import { DocType, TimeStamped, DBDocument } from "./DBDocument"

export interface ChainCertification extends DocType, TimeStamped {
    certificate?: ApiDocument;
    /**
     * description of this standard and certification
     */
    description?: string;
    /**
     * certification type
     */
    type?: string;
    /**
     * validity
     */
    validity?: string;
}


export class ChainCertificationDB extends DBDocument<ChainCertification> {
    _prefix = "CERT"
    docType = "certification"

    public get fieldsToCleanOnSave(): string[] {
        return []
    }

}