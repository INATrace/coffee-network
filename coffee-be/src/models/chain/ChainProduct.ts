import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";
import { ApiDocument } from "../af-coffee-app/apiDocument";
import { ApiProductLabelValues } from "../af-coffee-app/product/label/apiProductLabelValues";
import { ApiProductOrigin } from "../af-coffee-app/product/apiProductOrigin";
import { ApiProcess } from "../af-coffee-app/product/process/apiProcess";
import { ApiResponsibility } from "../af-coffee-app/product/responsibility/apiResponsibility";
import { ApiSustainability } from "../af-coffee-app/product/sustainability/apiSustainability";
import { ChainOrganization } from "./ChainOrganization";

export interface ChainCompanyProductRole {
    companyId: number;
    role: string;
}

/**
 * Represents general product definition of a product. Example: Coffee Angelique (without specific packaging, quantity, ...)
 * It DOES NOT represent an example of a product unit one can buy (e.g. a type of product unit of 50g coffee bag of brand Angelique)
 * It DOES NOT represent any particular product instance/shippment/bag ... (e.g. A particular 50g bag of brand Anguelique in some facility
 * such that one can actually get it.)
 * It only represents product description with core properties.
 * Sellable (orderable) types of a product of this kind are described by the class ChainSemiProduct.
 * Instances of semi products are described by ChainStockOrder.
 */
export interface ChainProduct extends DocType, TimeStamped {
    /**
     * ProductId from afApp database
     */
    id: number;
    /**
     * List of roles of companies on the product value chain
     */
    organizationRoles?: ChainCompanyProductRole[] | null;

    /**
     * af coffie company id
     */
    companyId?: number | null;
    /**
     * Chain organization id matching companyId, set automatically from companyId on read or write.
     */
    organizationId?: string;
    /**
     * Chain organization matching companyId, set automatically.
     */
    organization?: ChainOrganization | null;
    /**
     * product description
     */
    description?: string | null;
    /**
     * how to Use / Recipes - Describe the best way to use the product (e.g. recipes, how to apply the product...)
     */
    howToUse?: string | null;
    /**
     * ingredients - list the ingredients in the product and describe their properties
     */
    ingredients?: string | null;
    /**
     * Key Markets, market name - share number map
     */
    keyMarketsShare?: { [key: string]: number; } | null;
    /**
     * labels
     */
    labels?: ApiProductLabelValues[];
    /**
     * product name
     */
    name?: string | null;
    /**
     * nutritional Value - list the nutritional value of the product
     */
    nutritionalValue?: string | null;
    origin?: ApiProductOrigin;
    photo?: ApiDocument;
    process?: ApiProcess;
    responsibility?: ApiResponsibility;
    sustainability?: ApiSustainability;


}

export class ChainProductDB extends DBDocument<ChainProduct> {
    _prefix = "PROD"
    docType = "product"

    public get fieldsToCleanOnSave(): string[] {
        return ['organization']
    }

}