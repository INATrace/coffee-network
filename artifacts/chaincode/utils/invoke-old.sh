#!/bin/bash

# https://gist.github.com/aschmidt75/77c292591084598e07703329e730013c
if [[ $# -ne 3 ]]; then
  echo 'Usage: . invoke.sh FUNCTIONNAME KEY JSONFILE'
  exit 0   # as script is sourced, exit 1 would close docker terminal
fi

JSONFILE="$3"
KEY=$2
FUNCTION="$1"
INPUTDATA0=$(cat $JSONFILE)
INPUTDATA=$(echo $INPUTDATA0 | sed 's/\"/\\"/g')


echo "{\"Args\":[\"${FUNCTION}\", \"${KEY}\", \"${INPUTDATA}\"]}"
peer chaincode invoke -n mycc -c "{\"Args\":[\"${FUNCTION}\", \"${KEY}\", \"${INPUTDATA}\"]}" -C myc
