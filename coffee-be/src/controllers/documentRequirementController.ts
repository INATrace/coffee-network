import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainSemiProduct } from "../models/chain/ChainSemiProduct";
import { PaginatedList } from "../models/chain/PaginatedList";
import { ChainDocumentRequirement } from "../models/chain/ChainDocumentRequirement";

@Security("jwt")
@Tags('Document requirements')
@Route("chain-api/data/document-requirement")
export class DocumentRequirementController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// DOCUMENT REQUIREMENT
    ////////////////////////////////////////////////

    /**
     * Paginated list of document requirements.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listDocumentRequirements(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainDocumentRequirement>>> {
        return handleApiResponse(
            this.chaincode.listDocumentRequirments({sort, limit, offset})
        )
    }

    /**
     * Fetches document requirement by its _id.
     * @param dbId database _id of the document requirement
     */
    @Get("{dbId}")
    public async getDocumentRequirement(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainDocumentRequirement>> {
        return handleApiResponse(
            this.chaincode.getDocumentRequirement(dbId)
        )
    }

    /**
     * Inserts or updates a document requirement. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postDocumentRequirement(
        @Request() request: express.Request,
        @Body() requestBody: ChainDocumentRequirement
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertDocumentRequirement(requestBody)
        )
    }

    /**
     * Deletes document requirement.
     * @param requestBody
     */
    @Post('delete')
    public async deleteDocumentRequirement(
        @Request() request: express.Request,
        @Body() requestBody: ChainDocumentRequirement
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteDocumentRequirement(requestBody)
        )
    }


}