import { ApiDocument } from "../../apiDocument";

export interface ApiProcessDocument {
    /**
     * description of this document
     */
    description?: string;
    document?: ApiDocument;
}
