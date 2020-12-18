See documentation at:

https://github.com/hyperledger/fabric-samples/tree/master/chaincode-docker-devmode

This folder is copied from `fabric-samples` repository. Mount paths for chaincode are adapted in `docker-compose-simple.yaml` 
for containers `chaincode` and `cli` relative to this project. 

Originala documentation is in the file `README.rst`.

WARNING: docker-compose-down our blockchain dockers as there are port conficts. Use our (main) blockchain only for final developments.

Run:
```
docker-compose -f docker-compose-simple.yaml up -d
```

# chaincode - Terminal 1

```
docker exec -it chaincode sh
cd storage/go
go build -o storage

CORE_CHAINCODE_ID_NAME=mycc:0 CORE_PEER_TLS_ENABLED=false ./storage -peer.address peer:7052
```
The contract process is running. Any `fmt.Print`-s will be visible there.
First build after running container can be a bit longer.
Do not build outside the container (not tested, seems it does not work properly)

# cli - Terminal 2

```
docker exec -it cli bash
peer chaincode install -p chaincodedev/chaincode/storage/go -n mycc -v 0
# check omit `chaincodedev` if you are already in this folder
peer chaincode instantiate -n mycc -v 0 -c '{"Args":[]}' -C myc
```

Use scripts from Terminal 2 in `artifacts/chaincode/utils` (in project!) to run code. Make specific scripts for your tests.
Read README.md in that folder. The folder is mounted in `cli` container as well
```
cd chaincode/utils
```

Example test:
```
./invokeTest.sh
./getState.sh myKEY
```

Development cycle goes like this:
- fix the code in `storage.go` (in VS Code outside the containers)
- stop the contract process in `chaincode` container (Ctrl + C)
- compile the code in `chaincode` container in Terminal 1 as above.
- run the contract process again as above (the command line above `CORE_CHAINCODE_ID_NAME=my ....`)
- run scripts in `artifacts/chaincode/utils` to test the functions in the code, observe `fmt` outputs in Terminal 1 (`chaincode`) and function returns in Terminal 2 (`cli`). WARNING: do not use non-asci test examples!

Some examples

```
peer chaincode invoke -n mycc -c '{"Args":["PutState","key", "{\"a\": 1}"]}' -C myc
peer chaincode invoke -n mycc -c '{"Args":["GetState","key"]}' -C myc
```
To stop the network run:

```
docker-compose -f docker-compose-simple.yaml down
```
