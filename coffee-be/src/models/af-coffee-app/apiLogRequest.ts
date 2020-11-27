
export interface ApiLogRequest {
    /**
     * log key to store (max 64 chars)
     */
    logKey?: string;
    /**
     * request token
     */
    token?: string;
    /**
     * type
     */
    type?: ApiLogRequestTypeEnum;
    /**
     * value 1 (max 255 chars)
     */
    value1?: string;
    /**
     * value 2 (max 255 chars)
     */
    value2?: string;
}

/**
 * All possible values of type.
 */
export type ApiLogRequestTypeEnum =
    'VISIT_QR'
    | 'VERIFY_BATCH'
    | 'VERIFY_BATCH_ORIGIN'
    | 'CLICK_CERT_STD'
    | 'CLICK_PROD_REC'
    | 'CLICK_COMPANY_PAGE'
    | 'CLICK_SOCIAL_MEDIA'
    | 'LANDING_PAGE'
    | 'CLICK_VERIFY_BATCH'
    | 'CLICK_VERIFY_BATCH_ORIGIN'



