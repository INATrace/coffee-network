export interface ApiUserBase {
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
 * All possible values of role.
 */
export type ApiUserBaseRoleEnum =
    'USER'
    | 'ADMIN';

/**
 * All possible values of status.
 */
export type  ApiUserBaseStatusEnum =
    'UNCONFIRMED'
    | 'CONFIRMED_EMAIL'
    | 'ACTIVE'
    | 'DEACTIVATED';



