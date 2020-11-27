import { default as Nano, default as nano } from 'nano';
import { Factory, Singleton } from "typescript-ioc";
import express from "express";
import multer from "multer";

@Singleton
@Factory(() => new DocumentService())
export class DocumentService {

    private config: any;
    private multerConf: any;
    constructor() {
        const docFolder = process.env.DOC_FOLDER;
        const storage = multer.diskStorage({
            destination: (req: any, file: any, callback: any) => callback(null, docFolder),
            filename: (req: any, file: any, callback: any) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
                callback(null, 'F-' + uniqueSuffix)
            }
        })
        this.config = {
            storage,
            encoding: 'utf8'
        }
    }

    public handleFile(request: express.Request): Promise<any> {
        const multerSingle = multer(this.config).single("file");
        return new Promise((resolve, reject) => {
            multerSingle(request, undefined, async (error: any) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    }
}