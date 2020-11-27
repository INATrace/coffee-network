# Tests

Testing scripts use `invoke.sh`. Due to environement variables in docker, this script should not be executed `./invoke.sh`, instead it must be sourced `. invoke.sh`. Usually from some other script, that can be then executed.

**WARNING: Do not use non-asci characters in test JSONs.** The script `getState.sh` does not handle them well.

## Example 1:

Calls function `PutState` in `storage` smart contract and stores JSON from the file `test.json` under the key `myKEY`.
Then it reads the JSON through a chaincode and outputs it as a formatted JSON. 

```
./invokeTest.sh
./getState.sh myKEY
```

# Example 2

Call function `InsertOrganization` with key `keyORG` and JSON from the file `testorg.json`. Retrieves the JSON by the key.
```
./invokeOrg.sh
./getState.sh keyORG
```