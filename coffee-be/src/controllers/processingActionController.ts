import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { PaginatedList } from "../models/chain/PaginatedList";
import { ChainProcessingAction } from "../models/chain/ChainProcessingAction";

@Security("jwt")
@Tags('Processing action')
@Route("chain-api/data/processing-action")
export class ProcessingActionController extends Controller {

  @Inject
  private chaincode: ChainCode;

  ////////////////////////////////////////////////
  /// PROCESSING ACTION
  ////////////////////////////////////////////////

  /**
   * Fetches processing action by its _id.
   * @param dbId database _id of the product
   */
  @Get("{dbId}")
  public async getProcessingAction(
    @Request() request: express.Request,
    @Path() dbId: string,
  ): Promise<ApiResponse<ChainProcessingAction>> {
    return handleApiResponse(
      this.chaincode.getProcessingAction(dbId)
    )
  }

  /**
   * Inserts or updates a processing action. When inserting fields _id, _rev and docType should not be present.
   * @param requestBody
   */
  @Post('')
  public async postProcessingAction(
    @Request() request: express.Request,
    @Body() requestBody: ChainProcessingAction
  ): Promise<ApiResponse<any>> {
    return handleApiResponse(
      this.chaincode.insertProcessingAction(requestBody)
    )
  }

  /**
   * Paginated list of processing action for product.
   * @param productId
   * @param organizationId
   * @param sort
   * @param limit
   * @param offset
   */
  @Get("list/product/{productId}/organization/{organizationId}")
  public async listProcessingActionsForProductAndOrganization(
    @Request() request: express.Request,
    @Path() productId: string,
    @Path() organizationId: string,
    @Query() skuOnly?: boolean,
    @Query() sort?: 'ASC' | 'DESC',
    @Query() limit?: number,
    @Query() offset?: number
  ): Promise<ApiResponse<PaginatedList<ChainProcessingAction>>> {
    return handleApiResponse(
      this.chaincode.listProcessingActionsForProductAndOrganization(productId, organizationId, { sort, limit, offset }, skuOnly)
    )
  }

  /**
   * Deletes semi-product.
   * @param requestBody
   */
  @Post('delete')
  public async deleteProcessingAction(
    @Request() request: express.Request,
    @Body() requestBody: ChainProcessingAction
  ): Promise<ApiResponse<any>> {
    return handleApiResponse(
      this.chaincode.deleteProcessingAction(requestBody)
    )
  }


}