import { DBDocument, DocType } from "./DBDocument"

/**
 * Codebook for type of chain facility
 */
export interface ChainMeasureUnitType extends DocType {
    id: string;
    label: string;
    weight?: number | null;
    underlyingMeasurementUnitTypeId?: string | null;
    underlyingMeasurementUnitType?: ChainMeasureUnitType
}


export class ChainMeasureUnitTypeDB extends DBDocument<ChainMeasureUnitType> {
    _prefix = "MEASURE"
    docType = "c_measure_unit_type"

    static prefill(): ChainMeasureUnitTypeDB[] {
        const data = [
            {
                id: 'VOLUME_L',
                label: 'liter',
                weight: null,
                docType: 'c_measure_unit_type'
            },
            {
                id: 'WEIGHT_KG',
                label: 'kg',
                weight: 1,
                docType: 'c_measure_unit_type'
            },
            {
                id: 'BAG_60',
                label: 'Bag (60 kg)',
                weight: 60,
                docType: 'c_measure_unit_type'
            },
        ]
        return data.map(x => new ChainMeasureUnitTypeDB(x))
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['underlyingMeasurementUnitType']
    }

}




