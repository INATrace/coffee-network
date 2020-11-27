import { DBDocument, DocType } from "./DBDocument"

/**
 * Codebook for type of chain facility
 */
export interface ChainFacilityType extends DocType {
    id: string,
    label: string
}


export class ChainFacilityTypeDB extends DBDocument<ChainFacilityType> {
    _prefix = "TFAC"
    docType = "c_facility_type"

    static prefill(): ChainFacilityTypeDB[] {
        const data = [
            // {
            //     id: 'FARMER',
            //     label: 'Farmer',
            //     docType: "c_facility_type"
            // },
            // {
            //     id: 'COOPERATIVE',
            //     label: 'Cooperative',
            //     docType: "c_facility_type"
            // },
            {
                id: 'WASHING_STATION',
                label: 'Washing station',
                docType: "c_facility_type"
            },
            {
                id: 'DRYING_BED',
                label: 'Drying bed',
                docType: "c_facility_type"
            },
            {
                id: 'HULLING_STATION',
                label: 'Hulling station',
                docType: "c_facility_type"
            },
            {
                id: 'STORAGE',
                label: 'Storage',
                docType: "c_facility_type"
            },

            // {
            //     id: 'ROASTER',
            //     label: 'Roaster',
            //     docType: "c_facility_type"
            // },
            // {
            //     id: 'RETAILER',
            //     label: 'Retailer',
            //     docType: "c_facility_type"
            // },
        ]
        return data.map(x => new ChainFacilityTypeDB(x))
    }
}

