import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainActionType } from "../models/chain/ChainActionType";
import { ChainFacilityType } from "../models/chain/ChainFacilityType";
import { ChainMeasureUnitType } from "../models/chain/ChainMeasureUnitType";
import { PaginatedList } from "../models/chain/PaginatedList";
import { ChainGradeAbbreviation } from "../models/chain/ChainGradeAbbreviation";
import { ChainProcessingEvidenceType } from "../models/chain/ChainProcessingEvidenceType";
import { ChainOrderEvidenceType } from "../models/chain/ChainOrderEvidenceType";

@Security("jwt")
@Tags('Codebook')
@Route("chain-api/codebook")
export class CodebookController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// ACTION TYPE
    ////////////////////////////////////////////////

    /**
     * Returns paginated list of action types.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("action-type/list")
    public async getActionTypeList(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainActionType>>> {
        return handleApiResponse(
            this.chaincode.listActionTypes({sort, limit, offset})
        )
    }

    /**
     * Fetches an action type by its _id.
     * @param dbId
     */
    @Get("action-type/{dbId}")
    public async getActionType(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainActionType>> {
        return handleApiResponse(
            this.chaincode.getActionType(dbId)
        )
    }

    /**
     * Inserts or updates an action type. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('action-type')
    public async postActionType(
        @Request() request: express.Request,
        @Body() requestBody: ChainActionType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertActionType(requestBody)
        )
    }

    /**
     * Deletes action type.
     * @param requestBody
     */
    @Post('action-type/delete')
    public async deleteActionType(
        @Request() request: express.Request,
        @Body() requestBody: ChainActionType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteActionType(requestBody)
        )
    }


    ////////////////////////////////////////////////
    /// FACILITY TYPE
    ////////////////////////////////////////////////

    /**
     * Returns paginated list of facility types.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("facility-type/list")
    public async getFacilityTypeList(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainFacilityType>>> {
        return handleApiResponse(
            this.chaincode.listFacilityTypes({sort, limit, offset})
        )
    }

    /**
     * Fetches a facility type by its _id.
     * @param dbId
     */
    @Get("facility-type/{dbId}")
    public async getFacilityType(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainFacilityType>> {
        return handleApiResponse(
            this.chaincode.getFacilityType(dbId)
        )
    }

    /**
     * Inserts or updates a facility type. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('facility-type')
    public async postFacilityType(
        @Request() request: express.Request,
        @Body() requestBody: ChainFacilityType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertFacilityType(requestBody)
        )
    }

    /**
     * Deletes facility type.
     * @param requestBody
     */
    @Post('facility-type/delete')
    public async deleteFacilityType (
        @Request() request: express.Request,
        @Body() requestBody: ChainFacilityType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteFacilityType(requestBody)
        )
    }

    ////////////////////////////////////////////////
    /// MEASURE UNIT TYPE
    ////////////////////////////////////////////////

    /**
     * Returns paginated list of measure unit types.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("measure-unit-type/list")
    public async getMeasureUnitTypeList(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainMeasureUnitType>>> {
        return handleApiResponse(
            this.chaincode.listMeasureUnitTypes({sort, limit, offset})
        )
    }

    /**
     * Fetches a measure unit type by its _id.
     * @param dbId
     */
    @Get("measure-unit-type/{dbId}")
    public async getMeasureUnitType(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainMeasureUnitType>> {
        return handleApiResponse(
            this.chaincode.getMeasureUnitType(dbId)
        )
    }

    /**
     * Inserts or updates a measure unit type. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('measure-unit-type')
    public async postMeasureUnitType(
        @Request() request: express.Request,
        @Body() requestBody: ChainMeasureUnitType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertMeasureUnitType(requestBody)
        )
    }

    /**
     * Deletes measure unit type.
     * @param requestBody
     */
    @Post('measure-unit-type/delete')
    public async deleteMeasureUnitType(
        @Request() request: express.Request,
        @Body() requestBody: ChainMeasureUnitType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteChainMeasureUnitType(requestBody)
        )
    }


    ////////////////////////////////////////////////
    /// REFERENCE PURPOSE
    ////////////////////////////////////////////////

    // /**
    //  * Returns paginated list of reference purposes.
    //  * @param sort sort order ASC or DESC
    //  * @param limit query limit
    //  * @param offset query offset
    //  */
    // @Get("reference-purpose/list")
    // public async getReferencePurposeList(
    //     @Query() sort?: 'ASC' | 'DESC',
    //     @Query() limit?: number,
    //     @Query() offset?: number
    // ): Promise<ApiResponse<PaginatedList<ChainReferencePurpose>>> {
    //     return handleApiResponse(
    //         this.chaincode.listReferencePurposes({sort, limit, offset})
    //     )
    // }

    // /**
    //  * Fetches a measure unit type by its _id.
    //  * @param dbId
    //  */
    // @Get("reference-purpose/{dbId}")
    // public async getReferencePurpose(
    //     @Path() dbId: string,
    // ): Promise<ApiResponse<ChainReferencePurpose>> {
    //     return handleApiResponse(
    //         this.chaincode.getReferencePurpose(dbId)
    //     )
    // }

    // /**
    //  * Inserts or updates a measure unit type. When inserting fields _id, _rev and docType should not be present.
    //  * @param requestBody
    //  */
    // @Post('reference-purpose')
    // public async postReferencePurpose(
    //     @Body() requestBody: ChainReferencePurpose
    // ): Promise<ApiResponse<any>> {
    //     return handleApiResponse(
    //         this.chaincode.insertReferencePurpose(requestBody)
    //     )
    // }



    ////////////////////////////////////////////////
    /// GRADE ABBREVIATIONS
    ////////////////////////////////////////////////

    /**
     * Returns paginated list of grade abbreviations.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("grade-abbreviation/list")
    public async getGradeAbbreviationList(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainGradeAbbreviation>>> {
        return handleApiResponse(
            this.chaincode.listGradeAbbreviations({ sort, limit, offset })
        )
    }

    /**
     * Fetches a grade abbreviation by its _id.
     * @param dbId
     */
    @Get("grade-abbreviation/{dbId}")
    public async getGradeAbbreviation(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainGradeAbbreviation>> {
        return handleApiResponse(
            this.chaincode.getGradeAbbreviation(dbId)
        )
    }

    /**
     * Inserts or updates a grade abbreviation. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('grade-abbreviation')
    public async postGradeAbbreviation(
        @Request() request: express.Request,
        @Body() requestBody: ChainGradeAbbreviation
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertGradeAbbreviation(requestBody)
        )
    }

    /**
     * Deletes grade abbreviation.
     * @param requestBody
     */
    @Post('grade-abbreviation/delete')
    public async deleteGradeAbbreviation(
        @Request() request: express.Request,
        @Body() requestBody: ChainGradeAbbreviation
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteGradeAbbreviation(requestBody)
        )
    }


    ////////////////////////////////////////////////
    /// PROCESSING EVIDENCE TYPE
    ////////////////////////////////////////////////

    /**
     * Returns paginated list of processing evidence type.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("processing-evidence-type/list")
    public async getProcessingEvidenceTypeList(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainProcessingEvidenceType>>> {
        return handleApiResponse(
            this.chaincode.listProcessingEvidenceTypes({ sort, limit, offset })
        )
    }

    /**
     * Fetches a processing evidence type by its _id.
     * @param dbId
     */
    @Get("processing-evidence-type/{dbId}")
    public async getProcessingEvidenceType(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainProcessingEvidenceType>> {
        return handleApiResponse(
            this.chaincode.getProcessingEvidenceType(dbId)
        )
    }

    /**
     * Inserts or updates a rocessing evidence type. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('processing-evidence-type')
    public async postProcessingEvidenceType(
        @Request() request: express.Request,
        @Body() requestBody: ChainProcessingEvidenceType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertProcessingEvidenceType(requestBody)
        )
    }

    /**
     * Deletes rocessing evidence type.
     * @param requestBody
     */
    @Post('processing-evidence-type/delete')
    public async deleteProcessingEvidenceType(
        @Request() request: express.Request,
        @Body() requestBody: ChainProcessingEvidenceType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteProcessingEvidenceType(requestBody)
        )
    }


    ////////////////////////////////////////////////
    /// ORDER EVIDENCE TYPE
    ////////////////////////////////////////////////

    /**
     * Returns paginated list of order evidence type.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("order-evidence-type/list")
    public async getOrderEvidenceTypeList(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainOrderEvidenceType>>> {
        return handleApiResponse(
            this.chaincode.listOrderEvidenceTypes({ sort, limit, offset })
        )
    }

    /**
     * Fetches a order evidence type by its _id.
     * @param dbId
     */
    @Get("order-evidence-type/{dbId}")
    public async getOrderEvidenceType(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainOrderEvidenceType>> {
        return handleApiResponse(
            this.chaincode.getOrderEvidenceType(dbId)
        )
    }

    /**
     * Inserts or updates a order evidence type. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('order-evidence-type')
    public async postOrderEvidenceType(
        @Request() request: express.Request,
        @Body() requestBody: ChainOrderEvidenceType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertOrderEvidenceType(requestBody)
        )
    }

    /**
     * Deletes order evidence type.
     * @param requestBody
     */
    @Post('order-evidence-type/delete')
    public async deleteOrderEvidenceType(
        @Request() request: express.Request,
        @Body() requestBody: ChainOrderEvidenceType
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteOrderEvidenceType(requestBody)
        )
    }

    @Get("translation-templates")
    public async getTranslationTemplates(
        @Request() request: express.Request,
    ): Promise<string> {

        const res = await this.chaincode.codebookTranslationTemplates()
        console.log(res)
        return res
    }

}