
export interface ApiDocument {
    /**
     * content type
     */
    contentType?: string;
    /**
     * Entity id
     */
    id?: number;
    /**
     * document (file) name
     */
    name?: string;
    /**
     * size
     */
    size?: number;
    /**
     * storage key (file on system, s3, ...).
     */
    storageKey?: string;
}

