import { ChainFacilityType } from "./ChainFacilityType"
import { ChainLocation } from "./ChainLocaton"
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument"
import { ChainOrganization } from "./ChainOrganization"
import { ChainSemiProduct } from "./ChainSemiProduct"

export interface ChainSemiProductPrice {
    semiProductId: string;
    price: number | null;
    currency: string;
}

/**
 * Each organization (ChainOrganization) may have several facilities. Facility is considered as a storage space for
 * product units (ChainProductUnit). Transactions (ChainTransaction) run between facilities and are recorded by
 * ChainTransaciton objects.
 */
export interface ChainFacility extends DocType, TimeStamped {
    /**
     * Facility name
     */
    name: string;
    // /**
    //  * Global Location Number
    //  */
    // GLN?: string;
    /**
     * Organization id
     */
    organizationId: string;
    /**
     * Role of the facility in the value chain
     */
    facilityType?: ChainFacilityType;
    /**
     * Facility where cherries are gathered
     */
    isCollectionFacility?: boolean;
    /**
     * Whether anybody can list stock orders from this facility (facility intended for sale).
     */
    isPublic?: boolean | null;
    /**
     * Facility location
     */
    location?: ChainLocation;
    /**
     * Organization object. Set automatically on read. Ignored on write (not stored, obtained through organizationId)
     */
    organization?: ChainOrganization | null;
    /**
     * Allowable semi products
     */
    semiProducts?: ChainSemiProduct[];
    /**
     * Allowable semi product ids
     */
    semiProductIds?: string[];
    /**
     * Suggested semi-product prices
     */
    semiProductPrices?: ChainSemiProductPrice[];
}


export class ChainFacilityDB extends DBDocument<ChainFacility> {
    _prefix = "FAC"
    docType = "facility"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            {
                field: "organizationId",
                docType: "organization",
                required: true
            }
        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['organization']
    }

}