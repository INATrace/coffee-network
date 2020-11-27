import { Factory, Singleton } from "typescript-ioc";
// import { Client } from '@elastic/elasticsearch'; // newer client but incompatible with tsoa
import elasticsearch = require('elasticsearch');


@Singleton
@Factory(() => new ElasticsearchService())
export class ElasticsearchService {

    private client: any;

    constructor() {
        // this.client = new Client({ node: `http://${process.env.R_ELASTICSEARCH_HOST}:${process.env.R_ELASTICSEARCH_PORT}` });
        this.client = new elasticsearch.Client({
            host: `${process.env.R_ELASTICSEARCH_HOST}:${process.env.R_ELASTICSEARCH_PORT}`,
            log: ["error", "warning"], // 'trace'
            apiVersion: "7.x", // use the same version of your Elasticsearch instance
          });
    }

    public async search(request: any): Promise<any> {
        return await this.client.search(request);
    }

}