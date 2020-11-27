ORG1=""
ORG2=""
DOMAIN=""

ORG1_LOWER=""
ORG2_LOWER=""

export CHANNEL_NAME=""

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/artifacts/channel/crypto-config/ordererOrganizations/${DOMAIN}/orderers/orderer.${DOMAIN}/msp/tlscacerts/tlsca.${DOMAIN}-cert.pem
export PEER0_ORG1_CA=${PWD}/artifacts/channel/crypto-config/peerOrganizations/${ORG1_LOWER}.${DOMAIN}/peers/peer0.${ORG1_LOWER}.${DOMAIN}/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/artifacts/channel/crypto-config/peerOrganizations/${ORG2_LOWER}.${DOMAIN}/peers/peer0.${ORG2_LOWER}.${DOMAIN}/tls/ca.crt
export FABRIC_CFG_PATH=${PWD}/artifacts/channel/config/


setGlobalsForOrderer(){
    export CORE_PEER_LOCALMSPID=""
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/artifacts/channel/crypto-config/ordererOrganizations/${DOMAIN}/orderers/orderer.${DOMAIN}/msp/tlscacerts/tlsca.${DOMAIN}-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/ordererOrganizations/${DOMAIN}/users/Admin@${DOMAIN}/msp
    
}

setGlobalsForPeer0Coop(){
    export CORE_PEER_LOCALMSPID="${ORG1}MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/${ORG1_LOWER}.${DOMAIN}/users/Admin@${ORG1_LOWER}.${DOMAIN}/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

# setGlobalsForPeer1Coop(){
#     export CORE_PEER_LOCALMSPID="CoopMSP"
#     export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
#     export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/${ORG1_LOWER}.${DOMAIN}/users/Admin@${ORG1_LOWER}.${DOMAIN}/msp
#     export CORE_PEER_ADDRESS=localhost:8051
    
# }

setGlobalsForPeer0Analytics(){
    export CORE_PEER_LOCALMSPID="${ORG2}MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/${ORG2_LOWER}.${DOMAIN}/users/Admin@${ORG2_LOWER}.${DOMAIN}/msp
    export CORE_PEER_ADDRESS=localhost:9051
}

# setGlobalsForPeer1Analytics(){
#     export CORE_PEER_LOCALMSPID="AnalyticsMSP"
#     export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
#     export CORE_PEER_MSPCONFIGPATH=${PWD}/artifacts/channel/crypto-config/peerOrganizations/${ORG2_LOWER}.${DOMAIN}/users/Admin@${ORG2_LOWER}.${DOMAIN}/msp
#     export CORE_PEER_ADDRESS=localhost:10051
    
# }

createChannel(){
    rm -rf ./channel-artifacts/*
    setGlobalsForPeer0Coop
    
    peer channel create -o localhost:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.${DOMAIN} -f ./artifacts/channel/${CHANNEL_NAME}.tx --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
}

# removeOldCrypto(){
#     rm -rf ./api-1.4/crypto/*
#     rm -rf ./api-1.4/fabric-client-kv-org1/*
# }


joinChannel(){
    setGlobalsForPeer0Coop
    peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block
    
    # setGlobalsForPeer1Coop
    # peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block
    
    setGlobalsForPeer0Analytics
    peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block
    
    # setGlobalsForPeer1Analytics
    # peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block
    
}

updateAnchorPeers(){
    setGlobalsForPeer0Coop
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.${DOMAIN} -c $CHANNEL_NAME -f ./artifacts/channel/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    
    setGlobalsForPeer0Analytics
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.${DOMAIN} -c $CHANNEL_NAME -f ./artifacts/channel/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA   
}

# removeOldCrypto

createChannel
joinChannel
updateAnchorPeers