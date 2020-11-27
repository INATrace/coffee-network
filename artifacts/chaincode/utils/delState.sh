#!/bin/bash

# https://gist.github.com/aschmidt75/77c292591084598e07703329e730013c
if [[ $# -ne 1 ]]; then
  echo 'Usage: ./delState.sh KEY'
  exit 0
fi

KEY=$1
FUNCTION="DelState"

peer chaincode invoke -n mycc -c "{\"Args\":[\"${FUNCTION}\", \"${KEY}\"]}" -C myc 2>&1 
#| cut -d: -f6- | tail -1 | \
#  sed 's/\\\"/\"/g' | sed 's/\\\d\d\d/_/g' | sed 's/^\"//g' | sed 's/\" *$//g' | jq
# cat tmpFile.tmp | jq
# 'fromjson'

#| sed 's/\\n/\n/g' 
