import { DBDocument, DocType } from "./DBDocument"

/**
 * Codebook for type of chain facility
 */
export interface ChainReferencePurpose extends DocType {
    id: string;
    label: string;
    description: string;
}


export class ChainReferencePurposeDB extends DBDocument<ChainReferencePurpose> {
    _prefix = "REFERENCE_PURPOSE"
    docType = "c_reference_purpose"

    static prefill(): ChainReferencePurposeDB[] {
        const data = [
            {
                id: 'CERTIFICATE_1',
                label: 'Certificate 1',
                description: 'Certificate 1 description',
                docType: 'c_reference_purpose'
            },
            {
                id: 'CERTIFICATE_2',
                label: 'Certificate 2',
                description: 'Certificate 2 description',
                docType: 'c_reference_purpose'
            },
        ]
        return data.map(x => new ChainReferencePurposeDB(x))
    }
}




