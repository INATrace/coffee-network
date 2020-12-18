import express from "express";
import { Body, Controller, Get, Path, Post, Route, Tags, Query, Security, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainProcessingOrder } from "../models/chain/ChainProcessingOrder";
import { ChainStockOrder } from "../models/chain/ChainStockOrder";
import { ChainTransaction } from "../models/chain/ChainTransaction";
import { PaginatedList } from "../models/chain/PaginatedList";

@Security("jwt")
@Tags('Transaction')
@Route("chain-api/data/transaction")
export class TransactionController extends Controller {

    /**
     * Returns a paginated list of all transactions subject to search parameters
     * @param facilityId _id of a given facility
     * @param showPurchaseOrderOpenBalanceOnly show purhcase orders with open balance
     * @param purchaseOrderOnly show only purchase orders
     * @param query query by identifier
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("query")
    public async listTransactionQuery(
        @Request() request: express.Request,
        @Query() sourceFacilityId?: string,
        @Query() targetFacilityId?: string,
        @Query() semiProductId?: string,
        @Query() startDate?: string,
        @Query() endDate?: string,
        @Query() query? :string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainTransaction>>> {
        return handleApiResponse(
            this.chaincode.listTransactionsForFacilitiesAndSemiproductAndLastChange(sourceFacilityId, targetFacilityId, semiProductId, startDate, endDate, query, {sort, limit, offset})
        )
    }

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// TRANSACTION
    ////////////////////////////////////////////////

    /**
     * Fetches a transaction by its _id.
     * @param dbId
     */
    @Get("{dbId}")
    public async getTransactionById(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainTransaction>> {
        return handleApiResponse(
            this.chaincode.getTransaction(dbId)
        )
    }

    /**
     * Inserts or updates a transaction. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postTransaction(
        @Request() request: express.Request,
        @Body() requestBody: ChainTransaction
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertTransaction(requestBody)
        )
    }


    /**
     * Inserts or updates a list of stock orders with input transactions.
     * @param requestBody
     */
    @Post('stock-orders-with-inputs')
    public async postStockOrdersWithInputTransactions(
        @Request() request: express.Request,
        @Body() requestBody: ChainStockOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertOrUpdateStockOrdersWithInputTransactions(requestBody)
        )
    }

    /**
     * Inserts or updates a list of processing orders with input transactions and output orders
     * @param requestBody
     */
    @Post('processing-orders-with-inputs-and-outputs')
    public async postProcessingOrdersWithInputTransactionsAndOutputStockOrders(
        @Request() request: express.Request,
        @Body() requestBody: ChainProcessingOrder[]
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertOrUpdateProcessingOrderWithWithInputTransactionsAndOutputStockOrders(requestBody)
        )
    }


    // TODO check due to model change
    /**
     * Paginated list of input transactions for a stock order.
     * @param stockOrderId
     * @param sort
     * @param limit
     * @param offset
     */
    @Get("input/{stockOrderId}")
    public async listInputTransactionsForProductUnitId (
        @Request() request: express.Request,
        @Path() stockOrderId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainTransaction>>> {
        return handleApiResponse(
            this.chaincode.listInputTransactions(stockOrderId, {sort, limit, offset})
        )
    }
    // TODO check due to model change
    /**
     * Paginated list of output transactions for a stock order.
     * @param stockOrderId
     * @param sort
     * @param limit
     * @param offset
     */
    @Get("output/{stockOrderId}")
    public async listOutputTransactionsForProductUnitId (
        @Request() request: express.Request,
        @Path() stockOrderId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainTransaction>>> {
        return handleApiResponse(
            this.chaincode.listOutputTransactions(stockOrderId, {sort, limit, offset})
        )
    }

    /**
     * Paginated list of transactions for a given organization
     * @param organizationId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}")
    public async listTransactionsForOrganization(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainTransaction>>> {
        return handleApiResponse(
            this.chaincode.listTransactionsForOrganization(organizationId, { sort, limit, offset })
        )
    }

    /**
     * Deletes transaction
     * @param requestBody
     */
    @Post('delete')
    public async deleteTransaction(
        @Request() request: express.Request,
        @Body() requestBody: ChainTransaction
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteTransaction(requestBody)
        )
    }

    /**
     * Deletes transactions orders.
     * @param requestBody
     */
    @Post('delete-transactions')
    public async deleteTransactions(
        @Request() request: express.Request,
        @Body() requestBody: ChainTransaction[]
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteTransactions(requestBody)
        )
    }

    /**
     * Cancel transaction
     * @param transactionId
     * @param rejection
     */
    @Post('cancel-transactions/{transactionId}')
    public async cancelTransactions(
        @Request() request: express.Request,
        @Path() transactionId: string,
        @Query() rejection: string
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.cancelTransactions(transactionId, rejection)
        )
    }

    /**
     * Approve transaction
     * @param transactionId
     * @param rejection
     */
    @Post('approve-transactions/{transactionId}')
    public async approveTransactions(
        @Request() request: express.Request,
        @Path() transactionId: string
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.approveTransactions(transactionId)
        )
    }

}