import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainDocumentRequirementList } from "../models/chain/ChainDocumentRequirementList";
import { PaginatedList } from "../models/chain/PaginatedList";

@Security("jwt")
@Tags('Document requirements')
@Route("chain-api/data/document-requirement-list")
export class DocumentRequirementListController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// DOCUMENT REQUIREMENT
    ////////////////////////////////////////////////

    /**
     * Paginated list of document requrement lists.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listDocumentRequirementLists(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainDocumentRequirementList>>> {
        return handleApiResponse(
            this.chaincode.listDocumentRequirmentsLists({sort, limit, offset})
        )
    }

    /**
     * Fetches document requirement by its _id.
     * @param dbId database _id of the document requirement list
     */
    @Get("{dbId}")
    public async getDocumentRequirementList(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainDocumentRequirementList>> {
        return handleApiResponse(
            this.chaincode.getDocumentRequirementList(dbId)
        )
    }

    /**
     * Inserts or updates a document requirement. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postDocumentRequirementList(
        @Request() request: express.Request,
        @Body() requestBody: ChainDocumentRequirementList
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertDocumentRequirementList(requestBody)
        )
    }

    /**
     * Paginated list of document requirement lists for semi-product.
     * @param semiProductId
     * @param sort
     * @param limit
     * @param offset
     */
    @Get("list/semi-product/{semiProductId}")
    public async listDocumentRequirementListForSemiProduct (
        @Request() request: express.Request,
        @Path() semiProductId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainDocumentRequirementList>>> {
        return handleApiResponse(
            this.chaincode.listDocumentRequirementListsForSemiProduct(semiProductId, {sort, limit, offset})
        )
    }

    /**
     * Deletes semi-product.
     * @param requestBody
     */
    @Post('delete')
    public async deleteDocumentRequirementList(
        @Request() request: express.Request,
        @Body() requestBody: ChainDocumentRequirementList
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteDocumentRequirementList(requestBody)
        )
    }


}