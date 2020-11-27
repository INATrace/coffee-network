import { ApiDocument } from "../../apiDocument";

export interface ApiProcessStandard {
    certificate?: ApiDocument;
    /**
     * description of this standard and certification
     */
    description?: string;
}
