import { ApiUserBaseRoleEnum, ApiUserBaseStatusEnum } from "../apiUserBase";

export interface ApiUserBasicResponse {
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
