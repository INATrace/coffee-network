import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";
import { ChainMeasureUnitType } from "./ChainMeasureUnitType";
import { ChainProductOrder } from "./ChainProductOrder";
import { ChainProduct } from "./ChainProduct";


export interface ChainSemiProductAvailability {
    facilityId: string;
    semiProductId: string;
    availableQuantity: number;
}

export interface AvailabilityInFacilitiesRequest {
    facilityIds: string[];
    semiProductId: string;
}

/**
 * Represents a product definition of a product of some organization (ChainOrganization).
 * It DOES NOT represent any praticular product instance/shippment/bag ...
 * It only represents product description with core properties.
 * Product instances are denoted by class ChainProductItem.
 */
export interface ChainSemiProduct extends DocType, TimeStamped {
    /**
     * id reference of the relevant ChainProduct
     */
    productId: string;
    /**
     * Name of the semi product
     */
    name: string;
    /**
     * Description of the semi product
     */
    description: string;
    /**
     * Type of a measurement unit for quantity of the product (used for stock orders of this product)
     */
    measurementUnitType?: ChainMeasureUnitType;
    /**
     * Whether the product is considered as Stock keeping unit (at producer)
     */
    isSKU?: boolean | null;
    /**
     * Whether the product is buyable
     */
    isBuyable?: boolean | null;
    /**
     * Whether the product is considered as Stock keeping unit (for end customer)
     */
    isSKUEndCustomer?: boolean | null;
    /**
     * Product object. Set automatically on read. Ignored on write (not stored, obtained through productId)
     */
    product?: ChainProduct | null;
}

export class ChainSemiProductDB extends DBDocument<ChainSemiProduct> {
    _prefix = "ORDPROD"
    docType = "semi_product"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            {
                field: "productId",
                docType: "product",
                required: true
            }
        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['product']
    }

}