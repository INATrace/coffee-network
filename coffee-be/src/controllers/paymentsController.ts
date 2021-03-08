import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { PaginatedList } from "../models/chain/PaginatedList";
import { ChainPayment } from "../models/chain/ChainPayment";
import { ChainBulkPayment } from "../models/chain/ChainBulkPayment";

@Security("jwt")
@Tags('Payments')
@Route("chain-api/data/payment")
export class PaymentsController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// PAYMENTS
    ////////////////////////////////////////////////

    /**
     * Fetches a bulk payment by its _id.
     * @param dbId database id of the bulk payment
     */
    @Get('bulk-payment/{dbId}')
    public async getBulkPayment(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainBulkPayment>> {
        return handleApiResponse(
            this.chaincode.getBulkPayment(dbId)
        )
    }

    /**
     * Inserts or updates a bulk payment. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('bulk-payment')
    public async postBulkPayment(
        @Request() request: express.Request,
        @Body() requestBody: ChainBulkPayment
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertBulkPayment(requestBody)
        )
    }

    /**
     * Returns paginated list of bulk payments for payingOrganization
     * @param organizationId _id of a paying organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get('bulk-payment/list/organization/{payingOrganizationId}')
    public async listBulkPaymentsForPayingOrganization(
        @Request() request: express.Request,
        @Path() payingOrganizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainBulkPayment>>> {
        return handleApiResponse(
            this.chaincode.listChainBulkForPayingOrganization(payingOrganizationId, { sort, limit, offset })
        )
    }

    /**
     * Deletes payment
     * @param requestBody
     */
    @Post('delete')
    public async deleteBulkPayment(
        @Request() request: express.Request,
        @Body() requestBody: ChainBulkPayment
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteBulkPayment(requestBody)
        )
    }


    /**
     * Fetches a payment by its _id.
     * @param dbId database id of the payment
     */
    @Get("{dbId}")
    public async getPayment(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainPayment>> {
        return handleApiResponse(
            this.chaincode.getPayment(dbId)
        )
    }

    /**
     * Inserts or updates a payment. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postPayment(
        @Request() request: express.Request,
        @Body() requestBody: ChainPayment
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertPayment(requestBody)
        )
    }

    /**
     * Deletes payment
     * @param requestBody
     */
    @Post('delete-payment')
    public async deletePayment(
        @Request() request: express.Request,
        @Body() requestBody: ChainPayment
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deletePayment(requestBody)
        )
    }

    /**
     * Paginated list of payments
     * @param organizationId _id of a paying organization
     * @param query query by receiptNumber
     * @param sortBy PAYMENT_DATE or DELIVERY_DATE
     * @param paymentStatus CONFIRMED or UNCONFIRMED
     * @param wayOfPayment CASH_VIA_COOPERATIVE or CASH_VIA_COLLECTOR or BANK_TRANSFER or UNKNOWN
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     * @param deliveryDateStart
     * @param deliveryDateEnd
     */
    @Get("list/organization/{payingOrganizationId}")
    public async listPaymentsForPayingOrganization(
        @Request() request: express.Request,
        @Path() payingOrganizationId: string,
        @Query() query?: string,
        @Query() sortBy?: 'PAYMENT_DATE' | 'DELIVERY_DATE',
        @Query() paymentStatus?: 'CONFIRMED' | 'UNCONFIRMED',
        @Query() wayOfPayment?: 'CASH_VIA_COOPERATIVE' | 'CASH_VIA_COLLECTOR' | 'BANK_TRANSFER' | 'UNKNOWN',
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number,
        @Query() deliveryDateStart?: string,
        @Query() deliveryDateEnd?: string,
    ): Promise<ApiResponse<PaginatedList<ChainPayment>>> {
        return handleApiResponse(
            this.chaincode.listPaymentsForPayingOrganization(payingOrganizationId, query, sortBy, paymentStatus, wayOfPayment, deliveryDateStart, deliveryDateEnd, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of payments for a given stock order
     * @param stockOrderId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/stock-order/{stockOrderId}")
    public async listPaymentsForStockOrder(
        @Request() request: express.Request,
        @Path() stockOrderId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainPayment>>> {
        return handleApiResponse(
            this.chaincode.listPaymentsForStockOrder(stockOrderId, {sort, limit, offset})
        )
    }

    /**
     * Paginated list of payments for a user customer
     * @param farmerId
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/farmer/{farmerId}")
    public async listPaymentsForRecipientUserCustomer(
        @Request() request: express.Request,
        @Path() farmerId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainPayment>>> {
        return handleApiResponse(
            this.chaincode.listPaymentsForRecipientUserCustomer(farmerId, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of payments for a given
     * @param stockOrderId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/bank-transfer/{bankTransferId}")
    public async listPaymentsForBankTransfer(
        @Request() request: express.Request,
        @Path() bankTransferId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainPayment>>> {
        return handleApiResponse(
            this.chaincode.listPaymentsForBankTransfer(bankTransferId, {sort, limit, offset})
        )
    }

    /**
     * Confirm payment
     * @param requestBody
     */
    @Post('confirm-payment')
    public async confirmPayment(
        @Request() request: express.Request,
        @Body() requestBody: ChainPayment
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.confirmPayment(requestBody)
        )
    }

}