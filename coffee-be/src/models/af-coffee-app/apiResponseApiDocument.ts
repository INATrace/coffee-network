import { ApiDocument } from './apiDocument';
import { ApiDefaultResponseStatusEnum } from './apiDefaultResponse';
import { ApiValidationErrorDetails } from './apiValidationErrorDetails';


/**
 * Generic API response. See documentation for data type for specific type details.
 */

export interface ApiResponseApiDocument {
    data?: ApiDocument;
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
