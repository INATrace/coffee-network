import { ApiCertification } from '../../apiCertification';
import { ApiProcessDocument } from './apiProcessDocument';
import { ApiProcessStandard } from './apiProcessStandard';



export interface ApiProcess {
    /**
     * codes of conduct - Briefly describe your company codes of conduct that your employees
     */
    codesOfConduct?: string;
    /**
     * production description - Briefly describe your production process
     */
    production?: string;
    /**
     * production records
     */
    records?: ApiProcessDocument[];
    /**
     * certifications and standards
     */
    standards?: ApiCertification[];
    /**
     * storage - Briefly describe your storage procedures
     */
    storage?: string;
}
