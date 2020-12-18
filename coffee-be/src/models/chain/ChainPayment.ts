import { ChainFileInfo } from "./ChainFileInfo";
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";
import { ChainOrganization } from "./ChainOrganization";
import { ChainUserCustomer } from "./ChainUserCustomer";
import { ChainBulkPayment } from "./ChainBulkPayment";
import { ChainCompanyCustomer } from "./ChainCompanyCustomer";

/**
 * Chain payment
 */
export interface ChainPayment extends DocType, TimeStamped {
    /**
     * Formal creation time set while entering.
     */
    formalCreationTime: string;
    /**
     * Type of payment.
     */
    paymentType: 'CASH' | 'BANK';
    /**
     * Currency of payment
     */
    currency: string;
    /**
     * Amount of payment in currency
     */
    amount: number;
    /**
     * Amount paid to the collector
     */
    amountPaidToTheCollector?: number;
    /**
     * Stock order for which payment was done (order reference).
     */
    stockOrderId: string;
    /**
     *  Order for which payment was done (when payment purpose is second_installment aka member bonus).
     */
    orderId?: string;
    /**
     * Reference to (input) transactions for which payment was actually done.
     */
    transactionIds?: string[]
    /**
     * Organization that is paying
     */
    payingOrganizationId: string;
    /**
     * Recipient organization
     */
    recipientOrganizationId?: string | null;
    /**
     * Recipient user customer
     */
    recipientUserCustomerId?: string | null;
    /**
     * Recipient organization (i.e. collector's organization)
     */
    representativeOfRecipientOrganizationId?: string | null;
    /**
     * Recipient user customer (i.e. collector)
     */
    representativeOfRecipientUserCustomerId?: string | null;
    /**
     * Recipient company  customer
     */
    recipientCompanyCustomerId?: string | null;
    /**
     * Type of recipient.
     */
    recipientType: 'ORGANIZATION' | 'COMPANY_CUSTOMER' | 'USER_CUSTOMER'
    /**
     * Receipt number on the attached receipt (receiptDocumentId). Mandatory for the cash transfer.
     */
    receiptNumber?: string | null;
    /**
     * Receipt document. Required for the cash transfer.
     */
    receiptDocument?: ChainFileInfo;
    /**
     * Receipt document type.
     */
    receiptDocumentType?: 'PURCHASE_SHEET' | 'RECEIPT';
    /**
     * Reference to the bulk payment.
     */
    bankTransferId?: string | null;
    /**
     * Payment purpose type.
     */
    paymentPurposeType?: 'ADVANCE_PAYMENT' | 'FIRST_INSTALLMENT' | 'SECOND_INSTALLMENT' | 'WOMEN_PREMIUM' | 'INVOICE_PAYMENT';
    /**
     * Payment status.
     */
    paymentStatus?: 'UNCONFIRMED' | 'CONFIRMED';
    /**
     * Payment confirmed by userId.
     */
    paymentConfirmedByUser?: string | null;
    /**
     * Payment confirmed by oganizationId.
     */
    paymentConfirmedByOrganization?: string | null;
    /**
     * Payment confirmed at this time.
     */
    paymentConfirmedAtTime?: string | null;
    ////////////////////////////
    //// CALCULATED
    ////////////////////////////
    /**
     * Organization that is paying. Not stored. On write _id is used.
     */
    payingOrganization?: ChainOrganization;
    /**
     * Recipient organization. Not stored. On write _id is used.
     */
    recipientOrganization?: ChainOrganization;
    /**
     * Recipient user customer. Not stored. On write _id is used.
     */
    recipientUserCustomer?: ChainUserCustomer;
    /**
     * Recipient user customer. Not stored. On write _id is used.
     */
    recipientCompanyCustomer?: ChainCompanyCustomer;
    /**
     * Bank transfer. Not stored. On write _id is used.
     */
    bankTransfer?: ChainBulkPayment;
    /**
     * Recipient organization (i.e. collector's organization). Not stored. On write _id is used.
     */
    representativeOfRecipientOrganization?: ChainOrganization;
    /**
     * Recipient user customer (i.e. collector). Not stored. On write _id is used.
     */
    representativeOfRecipientUserCustomer?: ChainUserCustomer;
    ////////////////////////////
    //// HELPERS FOR QUERYING
    ////////////////////////////
    /**
     * Stock order facility
     */
    queryFacilityName?: string | null;
    /**
     * Stock order name.
     */
    queryPurchaseOrderName?: string | null;
    /**
     * Producer user customer name.
     */
    queryProducerUserCustomerName?: string | null;

    preferredWayOfPayment?: string | null; // (CASH_VIA_COOPERATIVE || CASH_VIA_COLLECTOR || BANK_TRANSFER)

    productionDate?: string | null;

}

export class ChainPaymentDB extends DBDocument<ChainPayment> {
    _prefix = "PAYMENT"
    docType = "payment"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            {
                field: "stockOrderId",
                docType: "stock_order",
                required: true
            },
            {
                field: "payingOrganizationId",
                docType: "organization",
                required: true
            },
            // {
            //     field: "receiptDocument",
            //     docType: "document",
            //     required: true
            // },

        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['payingOrganization', 'recipientOrganization', 'recipientUserCustomer', 'recipientCompanyCustomer', 'bankTransfer', 'representativeOfRecipientOrganization', 'representativeOfRecipientUserCustomer']
    }

}