# Node Express Typescript Project

## Start

- Clone project and run `npm install`

## Running in development
```
npm run dev
```

If routes are changed in controllers, run the following to refresh routes (usually in other terminal)
```
npm run routes
```

## Swagger documentation 

It is served on the route `/api-docs`
To refresh the documentation, run:
```
npm run spec
```
Also `npm run routes` does the same job.

## Dependency injection

For dependency injection `typescript-ioc` is used. For injectable services use syntax
```
@Factory(() => new SomeService())
export class SomeService { ...
```

To inject a service, use 
```
export class SomeClass {
    @Inject
    private someService: SomeService;

    constructor () {...
```

## Setting up CouchDB

Have installed Docker and Docker Compose. 
You have to have a folder `tmp_data/couchdb`.
In `docker-compose.yaml` there is a configuration for a CouchDB database.

To check docker use:
```
docker ps
```

To start couchDB container
```
./databaseUp.sh
```

To stop CouchDB container
```
docker-compose down
```

To see the CouchDB through web interface Fauxton go to:
```
http://localhost:5984/_utils/
``` 

### Replica setup

Replica is available on port 5985. Its name is `couchdbreplica` (in docker). The name of original development database is `couchdb`. 

To configure replication go to replica:

```
http://localhost:5985/_utils/
``` 

Then press replication button in the left side menu and configure replication with the following parameters.

- Remote database
    - http://couchdb:5984/chain_object
    - Username, password
- New remote database
    - Name: http://couchdbreplica:5984/chain_object
    - Username, password
- Options:
    - Replication type: continuous

This should be set only once!    
Note that internal docker network naming is used!


## Elasticsearch (experimental)

1) docker-compose -f docker-compose-elastic.yaml up -d
2) docker it -exec [logstash_id] sh:
- cd /usr/share/logstash/config
- vi pipelines.yml: path.config -> "/usr/share/logstash/config/logstash.conf"
- vi logstash.conf: copy logstash.conf
3) rerun docker containers from docker-compose-elastic.yaml
4) elasticsearch is on port 9200, to remove all data use `curl -XDELETE localhost:9200/_all`

 
