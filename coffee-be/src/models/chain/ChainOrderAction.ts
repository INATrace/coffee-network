import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";
import { ChainSemiProduct } from "./ChainSemiProduct";
import { FieldDefinition } from "./ChainDocumentRequirement";
import { ChainOrderEvidenceType } from "./ChainOrderEvidenceType";

/**
 *
 */
export interface ChainOrderAction extends DocType, TimeStamped {
  /**
   * id reference of the relevant ChainProduct
   */
  productId: string;
  /**
   * id reference of the relevant ChainOrganization
   */
  organizationId: string;
  /**
   * Name of the order action
   */
  name: string;
  /**
   * Description of the order action
   */
  description: string;
  /**
   * Input semi-product id
   */
  inputSemiProductId: string;
  /**
   * Output semi-product id
   */
  outputSemiProductId: string;
  /**
   * Required fields
   */
  requiredFields?: FieldDefinition[];
  /**
   * Input semi-product on get only
   */
  inputSemiProduct?: ChainSemiProduct;
  /**
   * Output semi-product on get only
   */
  outputSemiProduct?: ChainSemiProduct;
  /**
   * List of required document types for order ids
   */
  requiredDocTypeIds?: string[];
  /**
   * List of required document types for order ids
   */
  requiredDocTypes?: ChainOrderEvidenceType[];
  /**
   * If transaction output has multiple outputSemiProducts
   */
  repackedOutputs?: boolean | null;
  /**
   * Max weight of one of the multiple outputSemiProducts (required if repackedOutputs)
   */
  maxOutputWeight?: number | null;
}

export class ChainOrderActionDB extends DBDocument<ChainOrderAction> {
  _prefix = "ORDERACTION"
  docType = "order_action"

  public get foreignKeySchemes(): ForeignKeyScheme[] {
    return [
      {
        field: "productId",
        docType: "product",
        required: true
      },
      {
        field: "organizationId",
        docType: "organization",
        required: true
      },
    ]
  }

  public get fieldsToCleanOnSave(): string[] {
    return ['inputSemiProduct', 'outputSemiProduct', 'requiredDocTypes']
  }

}