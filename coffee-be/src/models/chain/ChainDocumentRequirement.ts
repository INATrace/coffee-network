import { ChainFileInfo } from "./ChainFileInfo";
import { DBDocument, DocType } from "./DBDocument";

/**
 * Definition of an entry field
 */
export interface FieldDefinition {
    /**
     * Label of an entry field
     */
    label: string;
    /**
     * Field type (data taype)
     */
    type: 'string' | 'text' | 'number' | 'integer' | 'date' | 'object' | 'array' | 'price' | 'exchange_rate'| 'timestamp' | 'file';
    // type: 'text' | 'number' | 'date' | 'timestamp' | 'file' | 'object';
    /**
     * Field is required or not
     */
    required?: boolean;
    /**
     * Field is mandatory for creation.
     */
    mandatory?: boolean;
    /**
     * Field is required if related to quote order.
     */
    requiredOnQuote?: boolean;
    /**
     * String value of the field, if the type is 'text', 'date' or 'timestamp'
     */
    stringValue?: string;
    /**
     * Numeric value if the type is 'number'
     */
    numericValue?: number;
    /**
     * Object value for type 'object'
     */
    objectValue?: any;
    /**
     * Number of files if the type is 'file'. For unlimited number use 'any'.
     */
    fileMultiplicity?: number | 'any';
    /**
     * List of files (ChainFileInfo)
     */
    files?: ChainFileInfo[]
}


export interface ScoreImpact {
    /**
     * Type of score
     */
    type: 'PROVENANCE' | 'FAIRNESS' | 'QUALITY' | 'ORDER' | 'PAYMENT';
    /**
     * Score weight
     */
    score: number;
}

/**
 * Description of the document requirements for an order.
 */
export interface ChainDocumentRequirement extends DocType {
    /**
     * Document name (label)
     */
    name: string;
    /**
     * Description of the document requirement.
     */
    description: string;
    /**
     * Document identifier (type). Used to identify particular type of document and for matching.
     */
    documentIdentifier: string;
    /**
     * List of field definition. Order is important.
     */
    fields: FieldDefinition[];
    /**
     * score
     */
    score: ScoreImpact[];
    /**
     * Whether the document is required (critical)
     */
    required?: boolean;
}

export class ChainDocumentRequirementDB extends DBDocument<ChainDocumentRequirement> {
    _prefix = "DOCREQ"
    docType = "document_requirement"
}
