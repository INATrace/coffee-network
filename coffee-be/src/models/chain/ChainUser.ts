import { DBDocument, DocType, TimeStamped } from "./DBDocument";
import { ChainLocation } from "./ChainLocaton";
import { ApiUserBaseRoleEnum, ApiUserBaseStatusEnum } from "../af-coffee-app/apiUserBase";

/**
 * User is a user in company
 */
export interface ChainUser extends DocType, TimeStamped {
    /**
     * User id from af-coffee-ap database
     */
    id: number;
    /**
     * Production location if the user is a producer.
     */
    productionLocation?: ChainLocation;
    /**
     * Human readable user identificator
     */
    userId?: string;
    /**
     * Email/username
     */
    email?: string;
    /**
     * Name
     */
    name?: string;
    /**
     * User role
     */
    role?: ApiUserBaseRoleEnum;
    /**
     * Status
     */
    status?: ApiUserBaseStatusEnum;
    /**
     * Surname
     */
    surname?: string;
}

export class ChainUserDB extends DBDocument<ChainUser> {
    _prefix = "USER"
    docType = "user"
}