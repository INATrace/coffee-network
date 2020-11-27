import { ApiCertificationUpdate } from '../../apiCertificationUpdate';
import { ApiProcessStandardUpdate } from './apiProcessStandardUpdate';



export interface ApiProcessUpdate {
    /**
     * codes of conduct - Briefly describe your company codes of conduct that your employees
     */
    codesOfConduct?: string;
    /**
     * production description - Briefly describe your production process
     */
    production?: string;
    /**
     * certifications and standards
     */
    standards?: ApiCertificationUpdate[];
    /**
     * storage - Briefly describe your storage procedures
     */
    storage?: string;
}