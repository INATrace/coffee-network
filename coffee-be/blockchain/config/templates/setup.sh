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

INSTALL_FABRIC=0
if [ ! -d ./bin ]; then
    INSTALL_FABRIC=1
else
    read -p "Do you want to install Fabric binaries and images? (y/n) " REPLY
    if [ $REPLY == y -o $REPLY == Y ]; then
        INSTALL_FABRIC=1
    fi
fi

if [ $INSTALL_FABRIC -eq 1 ]; then
    emphln "Downloading Fabric binaries and images"
    ./scripts/bootstrap.sh {docker.fabricVersion} {docker.fabricCAVersion} -s
    rm -f ./config/configtx.yaml
    rm -f ./config/core.yaml
    rm -f ./config/orderer.yaml
fi

export PATH=$PWD/bin:$PATH

## Settings

export CORE_PEER_TLS_ENABLED=true
export FABRIC_CFG_PATH=./config/files/
export ORDERER_TLSCA=../../data/organizations/ordererOrganizations/{organizations.org0.domain}/orderers/{orderers.org0.orderer0.host}.{organizations.org0.domain}/msp/tlscacerts/tlsca.{organizations.org0.domain}-cert.pem

## Organization certificates

emphln "Generating organization certificates using cryptogen tool"
execute "cryptogen generate --config=./config/files/crypto-config.yaml --output=./data/organizations/"
node scripts/inject ./config/files/cporg1.json "{tlsCACertOrg1Peer}" ./data/organizations/peerOrganizations/{organizations.org1.domain}/tlsca/tlsca.{organizations.org1.domain}-cert.pem
node scripts/inject ./config/files/cporg1.json "{tlsCACertOrg1CA}" ./data/organizations/peerOrganizations/{organizations.org1.domain}/ca/ca.{organizations.org1.domain}-cert.pem

## System channel

emphln "Generating {channels.channel0.name} genesis block"
execute "configtxgen \
        -profile {channels.channel0.profile} \
        -channelID {channels.channel0.name} \
        -configPath ./config/files/ \
        -outputBlock ./data/channels/{channels.channel0.name}/genesis.block"

## Network

emphln "Starting network"
docker-compose -f ./config/files/docker-compose.yaml up -d

## Channel

emphln "Generating {channels.channel1.name} channel creation transaction"
execute "configtxgen \
        -profile {channels.channel1.profile} \
        -channelID {channels.channel1.name} \
        -configPath ./config/files/ \
        -outputCreateChannelTx ./data/channels/{channels.channel1.name}/{channels.channel1.name}.tx"

emphln "Generating anchor peer update transaction for {organizations.org1.name}MSP"
execute "configtxgen \
        -profile {channels.channel1.profile} \
        -channelID {channels.channel1.name} \
        -configPath ./config/files/ \
        -outputAnchorPeersUpdate ./data/channels/{channels.channel1.name}/{organizations.org1.name}MSPAnchorPeerUpdate.tx \
        -asOrg {organizations.org1.name}MSP"

emphln "Generating anchor peer update transaction for {organizations.org2.name}MSP"
execute "configtxgen \
        -profile {channels.channel1.profile} \
        -channelID {channels.channel1.name} \
        -configPath ./config/files/ \
        -outputAnchorPeersUpdate ./data/channels/{channels.channel1.name}/{organizations.org2.name}MSPAnchorPeerUpdate.tx \
        -asOrg {organizations.org2.name}MSP"

emphln "Creating channel {channels.channel1.name}"
setOrg1Globals
execute "peer channel create \
        --channelID {channels.channel1.name} \
        --file ./data/channels/{channels.channel1.name}/{channels.channel1.name}.tx \
        --outputBlock ./data/channels/{channels.channel1.name}/{channels.channel1.name}.block \
        --orderer localhost:{orderers.org0.orderer0.port} \
        --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
        --cafile $ORDERER_TLSCA \
        --tls $CORE_PEER_TLS_ENABLED" 3

emphln "Joining peer {peers.org1.peer0.host}.{organizations.org1.domain} to channel {channels.channel1.name}"
setOrg1Globals
execute "peer channel join -b ./data/channels/{channels.channel1.name}/{channels.channel1.name}.block" 3

emphln "Joining peer {peers.org2.peer0.host}.{organizations.org2.domain} to channel {channels.channel1.name}"
setOrg2Globals
execute "peer channel join -b ./data/channels/{channels.channel1.name}/{channels.channel1.name}.block" 3

emphln "Updating anchor peer for {organizations.org1.name}MSP"
setOrg1Globals
execute "peer channel update \
        --channelID {channels.channel1.name} \
        --file ./data/channels/{channels.channel1.name}/{organizations.org1.name}MSPAnchorPeerUpdate.tx \
        --orderer localhost:{orderers.org0.orderer0.port} \
        --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
        --cafile $ORDERER_TLSCA \
        --tls $CORE_PEER_TLS_ENABLED" 3

emphln "Updating anchor peer for {organizations.org2.name}MSP"
setOrg2Globals
execute "peer channel update \
        --channelID {channels.channel1.name} \
        --file ./data/channels/{channels.channel1.name}/{organizations.org2.name}MSPAnchorPeerUpdate.tx \
        --orderer localhost:{orderers.org0.orderer0.port} \
        --ordererTLSHostnameOverride {orderers.org0.orderer0.host}.{organizations.org0.domain} \
        --cafile $ORDERER_TLSCA \
        --tls $CORE_PEER_TLS_ENABLED" 3