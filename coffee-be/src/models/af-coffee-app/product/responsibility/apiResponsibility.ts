import { ApiResponsibilityFarmerPicture } from './apiResponsibilityFarmerPicture';

export interface ApiResponsibility {
    /**
     * farmers story - farmer or community
     */
    farmer?: string;
    /**
     * labor policies - Briefly describe labor policies you have in place in your company
     */
    laborPolicies?: string;
    /**
     * farmers story - pictures
     */
    pictures?: ApiResponsibilityFarmerPicture[];
    /**
     * storage - Briefly describe your storage procedures
     */
    relationship?: string;
    /**
     * farmers story - text
     */
    story?: string;
}
