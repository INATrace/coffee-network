import { DBDocument, DocType, TimeStamped } from "./DBDocument";

// {
// "originalname":"PRILOGA_8_Porocilo_skupno - apr-maj.pdf",
// "encoding":"7bit",
// "mimetype":"application/pdf",
// "destination":"./tmp_data/documents",
// "filename":"F-1591174863154-533215241",
// "path":"tmp_data/documents/F-1591174863154-533215241",
// "size":1822983}
/**
 * Represents a document in the system
 */
export interface ChainFileInfo extends DocType {
    /**
     * Storage key used for access to the actual file.
     */
    storageKey: string;
    /**
     * File name as uploaded.
     */
    name: string;
    /**
     * Mime/content type
     */
    contentType: string;
    /**
     * File size.
     */
    size: number;
}

export class ChainFileInfoDB extends DBDocument<ChainFileInfo> {
    _prefix = "DOC"
    docType = "document"

    public initWithRequestFileInfo(response: any) {
        const doc = this as any;
        doc.storageKey = response.filename;
        doc.name = response.originalname;
        doc.contentType = response.mimetype;
        doc.size = response.size;
    }
}