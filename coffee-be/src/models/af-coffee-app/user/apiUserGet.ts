import { ApiUserBaseStatusEnum, ApiUserBaseRoleEnum } from "../apiUserBase";

export interface ApiUserGet {
    /**
     * Possible actions
     */
    actions?: ApiUserGetActionsEnum[];
    /**
     * User's company ids
     */
    companyIds?: number[];
    /**
     * Email/username
     */
    email?: string;
    /**
     * Entity id
     */
    id?: number;
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

/**
 * All possible values of actions.
 */
export type ApiUserGetActionsEnum =
    'VIEW_USER_PROFILE'
    | 'CREATE_COMPANY'
    | 'UPDATE_USER_PROFILE'
    | 'ACTIVATE_USER'
    | 'DEACTIVATE_USER'
    | 'SET_USER_ADMIN'
    | 'UNSET_USER_ADMIN'



