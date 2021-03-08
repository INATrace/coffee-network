# Hyperledger Fabric Blockchain

This module implements Hyperledger Fabric network.

## Prerequisites
* NodeJS
* Docker and Docker Compose

## Use
* `./network.sh init` for first or clean initialization;
* `./network.sh up` to start network;
* `./network.sh down` to stop network.

## Content
* File `config.json` holds network specific data. On network initialization all parameters from this file are injected into configuration files.
* Folder `./config/templates` contains configuration file templates. -On parameter injection actual configuration files are generated in the folder `./config/files`.
* Folder `./data` contains all network data. It is created on network initialization.
* Folder `./chaincodes` contains chaincode code. The `storage` chaincode implementation is placed in folder `./chaincodes/storage/v#`, where `#` denotes the chaincode version.
* Folder `./bin` contains Fabric command line tools for network management.

## Description
* `./network.sh init`:
    * downloads Fabric images and command line tools (upon request);
    * generates crypto material (saved in `./data/organizations`);
    * creates system channel;
    * starts network (creates Docker containers, see `./config/files/docker-compose.yaml`);
    * creates basic channel for two organizations (`org1` and `org2`).
* `./network.sh up`:
    * starts network (creates Docker containers, see `./config/files/docker-compose.yaml`);
    * installs versions of the chaincode that have not yet been installed.
* `./network.sh down`:
    * stops network (removes Docker containers).

## Development hints

If you are developing on MacOS, then one has to swithch off the following: Preferences -> Experimental features -> Use gRPC FUSE for file sharing

## Migration protocol to blockchain

- Sync production database to write couchDB database
- Carry out the migration by using write database

### Replication of one couchdb

- Remote database
    - Name: ""
    - Username, password
- New remote database
    - Name: ""
    - Username, password
- Options:
    - Replication type: continuous


