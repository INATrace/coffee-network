import { DocType, TimeStamped, DBDocument, ForeignKeyScheme } from "./DBDocument";
import { ChainActivityProof } from "./ChainActivityProof";
import { ChainPayment } from "./ChainPayment";
import { ChainOrganization } from "./ChainOrganization";
import { BankAccountInfo } from "./ChainUserCustomer";

/**
 * Chain bulk payment (when paying at the bank to multiple farmers)
 */
export interface ChainBulkPayment extends DocType, TimeStamped {
  /**
   * Currency of payment
   */
  currency: string;
  /**
   * Formal creation time set while entering.
   */
  formalCreationTime: string;
  /**
   * Bank account info where transfer iz carried out.
   */
  bankInfo?: BankAccountInfo;
  /**
   * Organization that is paying
   */
  payingOrganizationId: string;
  /**
   * Payment purpose type.
   */
  paymentPurposeType?: 'ADVANCE_PAYMENT' | 'FIRST_INSTALLMENT' | 'SECOND_INSTALLMENT' | 'WOMEN_PREMIUM' | 'INVOICE_PAYMENT';
  /**
   * Payment description.
   */
  paymentDescription: string;
  /**
   * Total amount of payment in currency
   */
  totalAmount: number;
  /**
   * Payment per kg in currency
   */
  paymentPerKg?: number;
  /**
   * Additional cost of payment in currency
   */
  additionalCost?: number | null;
  /**
   * Additional cost description.
   */
  additionalCostDescription?: string | null;
  /**
   * List of stockOrder ids.
   */
  stockOrderIds?: string[];
  /**
   * List of additional proofs.
   */
  additionalProofs?: ChainActivityProof[];
  /**
   * Receipt number
   */
  receiptNumber?: string | null;
  ////////////////////////////
  //// CALCULATED
  ////////////////////////////
  /**
   * Organization that is paying. Not stored. On write _id is used.
   */
  payingOrganization?: ChainOrganization;
  /**
   * List of payments.
   */
  payments?: ChainPayment[];

}

export class ChainBulkPaymentDB extends DBDocument<ChainBulkPayment> {
  _prefix = "BULKPAYMENT"
  docType = "bulk_payment"

  public get foreignKeySchemes(): ForeignKeyScheme[] {
    return [
      {
        field: "payingOrganizationId",
        docType: "organization",
        required: true
      }
    ]
  }

  public get fieldsToCleanOnSave(): string[] {
    return ['payingOrganization', 'payments']
  }

}