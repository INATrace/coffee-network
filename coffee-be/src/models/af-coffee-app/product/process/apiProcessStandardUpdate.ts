import { ApiDocumentStorageKey } from "../../apiDocumentStorageKey";

export interface ApiProcessStandardUpdate {
    certificate?: ApiDocumentStorageKey;
    /**
     * description of this standard and certification
     */
    description?: string;
}