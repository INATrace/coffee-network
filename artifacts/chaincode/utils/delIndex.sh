#!/bin/bash

# https://gist.github.com/aschmidt75/77c292591084598e07703329e730013c
if [[ $# -ne 1 ]]; then
  echo 'Usage: ./delIndex.sh INDEXNAME'
  exit 0
fi

INDEXNAME=$1
FUNCTION="DelIndex"

peer chaincode invoke -n mycc -c "{\"Args\":[\"${FUNCTION}\", \"${INDEXNAME}\"]}" -C myc 2>&1 | cut -d: -f6-
  # sed 's/\\\"/\"/g' | sed 's/\\\d\d\d/_/g' | sed 's/^\"//g' | sed 's/\" *$//g' | jq
# cat tmpFile.tmp | jq
# 'fromjson'

#| sed 's/\\n/\n/g' 


