#!/bin/bash

## Functions

function setOrg1Globals() {
    export CORE_PEER_LOCALMSPID={organizations.org1.name}MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=../../data/organizations/peerOrganizations/{organizations.org1.domain}/peers/{peers.org1.peer0.host}.{organizations.org1.domain}/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=../../data/organizations/peerOrganizations/{organizations.org1.domain}/users/Admin@{organizations.org1.domain}/msp
    export CORE_PEER_ADDRESS=localhost:{peers.org1.peer0.port}
}

function setOrg2Globals() {
    export CORE_PEER_LOCALMSPID={organizations.org2.name}MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=../../data/organizations/peerOrganizations/{organizations.org2.domain}/peers/{peers.org2.peer0.host}.{organizations.org2.domain}/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=../../data/organizations/peerOrganizations/{organizations.org2.domain}/users/Admin@{organizations.org2.domain}/msp
    export CORE_PEER_ADDRESS=localhost:{peers.org2.peer0.port}
}

## Prerequisites

source ./scripts/format.sh
source ./scripts/utils.sh

export PATH=$PWD/bin:$PATH

## Settings

export CORE_PEER_TLS_ENABLED=true
export FABRIC_CFG_PATH=./config/files/
export ORDERER_TLSCA=../../data/organizations/ordererOrganizations/{organizations.org0.domain}/orderers/{orderers.org0.orderer0.host}.{organizations.org0.domain}/msp/tlscacerts/tlsca.{organizations.org0.domain}-cert.pem

## Deploy

declare -i VERSION=1
while [ -d "./chaincodes/{chaincodes.chaincode0.name}/v$VERSION" ]; do

    if [ -d "./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION" ]; then
        VERSION=VERSION+1
        continue
    fi

    emphln "Building chaincode {chaincodes.chaincode0.name}/v$VERSION"
    pushd ./chaincodes/{chaincodes.chaincode0.name}/v$VERSION
    GO111MODULE=on go mod vendor
    popd

    emphln "Packaging chaincode {chaincodes.chaincode0.name}/v$VERSION"
    setOrg1Globals
    mkdir -p ./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION
    execute "peer lifecycle chaincode package ./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION/{chaincodes.chaincode0.name}_$VERSION.tar.gz \
            --path ./chaincodes/{chaincodes.chaincode0.name}/v$VERSION \
            --lang golang \
            --label {chaincodes.chaincode0.name}_$VERSION"

    emphln "Installing chaincode {chaincodes.chaincode0.name}/v$VERSION on peer {peers.org1.peer0.host}.{organizations.org1.domain}"
    setOrg1Globals
    execute "peer lifecycle chaincode install ./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION/{chaincodes.chaincode0.name}_$VERSION.tar.gz"

    emphln "Installing chaincode {chaincodes.chaincode0.name}/v$VERSION on peer {peers.org2.peer0.host}.{organizations.org2.domain}"
    setOrg2Globals
    execute "peer lifecycle chaincode install ./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION/{chaincodes.chaincode0.name}_$VERSION.tar.gz"

    emphln "Querying chaincode {chaincodes.chaincode0.name}/v$VERSION installation"
    setOrg1Globals
    execute "peer lifecycle chaincode queryinstalled >&./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION/query.txt"
    PACKAGE_ID=$(sed -n "/{chaincodes.chaincode0.name}_$VERSION/{s/^Package ID: //; s/, Label:.*$//; p;}" ./data/chaincodes/{chaincodes.chaincode0.name}/v$VERSION/query.txt)
    infoln "Package ID: $PACKAGE_ID"

    emphln "Approving chaincode {chaincodes.chaincode0.name}/v$VERSION on peer {peers.org1.peer0.host}.{organizations.org1.domain}"
    setOrg1Globals
    execute "peer lifecycle chaincode approveformyorg \
            --channelID {channels.channel1.name} \
            --package-id $PACKAGE_ID \
            --name {chaincodes.chaincode0.name} \
            --version $VERSION \
            --sequence $VERSION \
            --init-required \
            --orderer localhost:{orderers.org0.orderer0.port} \
            --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
            --cafile $ORDERER_TLSCA \
            --tls $CORE_PEER_TLS_ENABLED"

    emphln "Checking commit readineness for chaincode {chaincodes.chaincode0.name}/v$VERSION on peer {peers.org1.peer0.host}:{organizations.org1.domain}"
    setOrg1Globals
    execute "peer lifecycle chaincode checkcommitreadiness \
            --channelID {channels.channel1.name} \
            --name {chaincodes.chaincode0.name} \
            --version $VERSION \
            --sequence $VERSION \
            --output json \
            --init-required" 3

    emphln "Approving chaincode {chaincodes.chaincode0.name}/v$VERSION on peer {peers.org2.peer0.host}.{organizations.org2.domain}"
    setOrg2Globals
    execute "peer lifecycle chaincode approveformyorg \
            --channelID {channels.channel1.name} \
            --package-id $PACKAGE_ID \
            --name {chaincodes.chaincode0.name} \
            --version $VERSION \
            --sequence $VERSION \
            --init-required \
            --orderer localhost:{orderers.org0.orderer0.port} \
            --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
            --cafile $ORDERER_TLSCA \
            --tls $CORE_PEER_TLS_ENABLED"

    emphln "Checking commit readineness for chaincode {chaincodes.chaincode0.name}/v$VERSION on peer {peers.org2.peer0.host}:{organizations.org2.domain}"
    setOrg2Globals
    execute "peer lifecycle chaincode checkcommitreadiness \
            --channelID {channels.channel1.name} \
            --name {chaincodes.chaincode0.name} \
            --version $VERSION \
            --sequence $VERSION \
            --output json \
            --init-required" 3

    emphln "Commit chaincode {chaincodes.chaincode0.name}/v$VERSION"
    setOrg1Globals
    execute "peer lifecycle chaincode commit \
            --channelID {channels.channel1.name} \
            --name {chaincodes.chaincode0.name} \
            --version $VERSION \
            --sequence $VERSION \
            --init-required \
            --peerAddresses localhost:{peers.org1.peer0.port} --tlsRootCertFiles ./data/organizations/peerOrganizations/{organizations.org1.domain}/peers/{peers.org1.peer0.host}.{organizations.org1.domain}/tls/ca.crt \
            --peerAddresses localhost:{peers.org2.peer0.port} --tlsRootCertFiles ./data/organizations/peerOrganizations/{organizations.org2.domain}/peers/{peers.org2.peer0.host}.{organizations.org2.domain}/tls/ca.crt \
            --orderer localhost:{orderers.org0.orderer0.port} \
            --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
            --tls $CORE_PEER_TLS_ENABLED \
            --cafile $ORDERER_TLSCA"

    emphln "Querying chaincode {chaincodes.chaincode0.name}/v$VERSION commit"
    setOrg1Globals
    execute "peer lifecycle chaincode querycommitted \
            --channelID {channels.channel1.name} \
            --name {chaincodes.chaincode0.name}" 3

    emphln "Initialize chaincode {chaincodes.chaincode0.name}/v$VERSION"
    setOrg1Globals
    execute "peer chaincode invoke \
            --channelID {channels.channel1.name} \
            --name {chaincodes.chaincode0.name} \
            --peerAddresses localhost:{peers.org1.peer0.port} --tlsRootCertFiles ./data/organizations/peerOrganizations/{organizations.org1.domain}/peers/{peers.org1.peer0.host}.{organizations.org1.domain}/tls/ca.crt \
            --peerAddresses localhost:{peers.org2.peer0.port} --tlsRootCertFiles ./data/organizations/peerOrganizations/{organizations.org2.domain}/peers/{peers.org2.peer0.host}.{organizations.org2.domain}/tls/ca.crt \
            --isInit \
            --ctor '{\"Args\":[]}' \
            --orderer localhost:{orderers.org0.orderer0.port} \
            --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
            --cafile $ORDERER_TLSCA \
            --tls $CORE_PEER_TLS_ENABLED"

    VERSION=$VERSION+1
done