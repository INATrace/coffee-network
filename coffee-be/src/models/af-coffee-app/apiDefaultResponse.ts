
import { ApiValidationErrorDetails } from './apiValidationErrorDetails';


/**
 * Generic API response. See documentation for data type for specific type details.
 */

export interface ApiDefaultResponse {
    /**
     * Optional details for unexpected error responses.
     */
    errorDetails?: string;
    /**
     * Simple message to explain client developers the reason for error.
     */
    errorMessage?: string;
    /**
     * Response status. OK for successful reponses.
     */
    status: ApiDefaultResponseStatusEnum;
    validationErrorDetails?: ApiValidationErrorDetails;
}

/**
 * All possible values of status.
 */
export type ApiDefaultResponseStatusEnum  =
    'OK'
    | 'ERROR'
    | 'REQUEST_BODY_ERROR'
    | 'VALIDATION_ERROR'
    | 'TOO_MANY_REQUESTS'
    | 'UNAUTHORIZED'
    | 'AUTH_ERROR'
    | 'UPSTREAM_HTTP_ERROR'
    | 'INVALID_REQUEST'
    | 'NOT_IMPLEMENTED'

