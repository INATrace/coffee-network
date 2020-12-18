import express from "express";
import * as fs from 'fs';
import { Controller, Get, Path, Post, Request, Route, Tags, Body, Security } from "tsoa";
import { Inject } from "typescript-ioc";
import { ApiResponse } from "../models/chain/ApiResponse";
import { ChainFileInfoDB, ChainFileInfo } from "../models/chain/ChainFileInfo";
import { DocumentService } from "../services/document.service";

@Security("jwt")
@Tags('Document')
@Route("chain-api/data/document")
export class DocumentController extends Controller {

    @Inject
    private documentService: DocumentService;

    ////////////////////////////////////////////////
    /// DOCUMENT
    ////////////////////////////////////////////////

    /**
     * Uploads a file. Returs file info.
     * @param request
     */
    @Post("upload")
    public async uploadFile(@Request() request: express.Request): Promise<any> {
        return this.documentService.handleFile(request).then(
            response => {
                const doc = new ChainFileInfoDB();
                doc.initWithRequestFileInfo((request as any).file);
                return new ApiResponse<any>(doc.value)
            },
            reason => new ApiResponse<any>(undefined, 'ERROR', '' + reason, reason)
        )
    }

    /**
     * Downloads the document (file) on the server identified by a storageKey.
     * @param request
     * @param storageKey identifier of a file on server
     */
    @Get("download/{storageKey}")
    public async getFile(
        @Request() request: express.Request,
        @Path() storageKey: string,
    ) {
        const mystream = fs.createReadStream(process.env.DOC_FOLDER + "/" + storageKey);
        mystream.pipe(request.res);
        return new Promise((resolve, reject) => {
            mystream.on("end", () => {
                request.res.end();
                resolve();
            });
            mystream.on("error", () => {
                reject()
            })
        });
    }

    // /**
    //  * Deletes company custoemr
    //  * @param requestBody
    //  */
    // @Post('delete')
    // public async deleteFile(
    //     @Body() requestBody: ChainFileInfo
    // ): Promise<ApiResponse<any>> {
    //     return handleApiResponse(
    //         this.chaincode.(requestBody)
    //     )
    // }

}