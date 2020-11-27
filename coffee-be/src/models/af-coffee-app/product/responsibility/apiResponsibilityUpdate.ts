
import { ApiDocumentStorageKey } from '../../apiDocumentStorageKey';



export interface ApiResponsibilityUpdate {
    /**
     * farmers story - farmer or community
     */
    farmer?: string;
    /**
     * labor policies - Briefly describe labor policies you have in place in your company
     */
    laborPolicies?: string;
    picture?: ApiDocumentStorageKey;
    /**
     * storage - Briefly describe your storage procedures
     */
    relationship?: string;
    /**
     * farmers story - text
     */
    story?: string;
}