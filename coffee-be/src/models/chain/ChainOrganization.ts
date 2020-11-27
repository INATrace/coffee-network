import { DBDocument, DocType, TimeStamped } from "./DBDocument";
import { ChainFileInfo } from "./ChainFileInfo";
import { ApiAddress } from "../af-coffee-app/apiAddress";

/**
 * Organization is a representative object of a company in af-coffee-app.
 */
export interface ChainOrganization extends DocType, TimeStamped {
    /**
     * company abbreviation
     */
    abbreviation?: string | null;
    /**
     * about the organization
     */
    about?: string | null;
    /**
     * email
     */
    email?: string | null;
    headquarters?: ApiAddress;
    /**
     * Entity id
     */
    id: number;
    /**
     * Type of entity (table in af-coffee app)
     */
    entityType: string;
    /**
     * Logo
     */
    logo?: ChainFileInfo | null;
    /**
     * name of manager / CEO
     */
    manager?: string | null;
    /**
     * social media URL links (Facebook, Instagram, Twitter, YouTube, ...)
     */
    mediaLinks?: { [key: string]: string; } | null;
    /**
     * company name
     */
    name?: string | null;
    /**
     * webpage
     */
    phone?: string | null;
    /**
     * webpage
     */
    webPage?: string | null;
}

export class ChainOrganizationDB extends DBDocument<ChainOrganization> {
    _prefix = "ORG"
    docType = "organization"

    // static prefill(): ChainOrganizationDB[] {
    //     const data = [
    //         {
    //             // name: 'Organization 1',
    //             id: 1,
    //             entityType: 'company',
    //             docType: 'organization'
    //         },
    //         {
    //             // name: 'Organization 2',
    //             id: 2,
    //             entityType: 'company',
    //             docType: 'organization'
    //         },
    //         {
    //             // name: 'Organization 3',
    //             id: 3,
    //             entityType: 'company',
    //             docType: 'organization'
    //         },
    //     ]
    //     return data.map(x => new ChainOrganizationDB(x))
    // }

}