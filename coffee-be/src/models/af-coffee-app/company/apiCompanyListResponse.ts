export interface ApiCompanyListResponse {
    /**
     * Entity id
     */
    id?: number;
    /**
     * Name
     */
    name?: string;
    /**
     * Company status
     */
    status?: ApiCompanyListResponseStatusEnum;
}

/**
 * All possible values of status.
 */
export type ApiCompanyListResponseStatusEnum =
    'REGISTERED'
    | 'ACTIVE'
    | 'DEACTIVATED'



