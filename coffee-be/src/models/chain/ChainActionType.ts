import { DBDocument, DocType } from "./DBDocument";


/**
 * Codebook for action type
 */
export interface ChainActionType extends DocType {
    id: string;
    label: string;
    facilityId?: string;
    facilityType?: string;
}

export class ChainActionTypeDB extends DBDocument<ChainActionType> {
    _prefix = "TACT"
    docType = "c_action_type"

    static prefill(): ChainActionTypeDB[] {
        const data = [
            {
                id: 'PROCESSING',
                label: 'Processing',
                docType: "c_action_type"
            },
            {
                id: 'SHIPMENT',
                label: 'Shipment',
                docType: "c_action_type"
            },
        ]
        return data.map(x => new ChainActionTypeDB(x))
    }
}
