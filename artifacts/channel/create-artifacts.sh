ORG1="Coop"
ORG2="Analytics"

# System channel
SYS_CHANNEL="sys-channel"

# channel name defaults to "mychannel"
CHANNEL_NAME="coffee-channel"

echo $CHANNEL_NAME

chmod -R 0755 ./crypto-config
# Delete existing artifacts
rm -rf ./crypto-config
# rm genesis.block $CHANNEL_NAME.tx
rm *.block *.tx
rm -rf ../../channel-artifacts/*

#Generate Crypto artifactes for organizations
cryptogen generate --config=./crypto-config.yaml --output=./crypto-config/


# Generate System Genesis block
configtxgen -profile OrdererGenesis -configPath . -channelID $SYS_CHANNEL  -outputBlock ./genesis.block


# Generate channel configuration block
configtxgen -profile BasicChannel -configPath . -outputCreateChannelTx ./$CHANNEL_NAME.tx -channelID $CHANNEL_NAME

echo "#######    Generating anchor peer update for ${ORG1}MSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./${ORG1}MSPanchors.tx -channelID $CHANNEL_NAME -asOrg ${ORG1}MSP

echo "#######    Generating anchor peer update for ${ORG2}MSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./${ORG2}MSPanchors.tx -channelID $CHANNEL_NAME -asOrg ${ORG2}MSP

# Delete and create tmp_data directory
mkdir ../../tmp_data
mkdir ../../tmp_data/ordererOrg
mkdir ../../tmp_data/org1
mkdir ../../tmp_data/org2
mkdir ../../tmp_data/ordererOrg/orderer
mkdir ../../tmp_data/org1/peer0
mkdir ../../tmp_data/org2/peer0
mkdir ../../tmp_data/org1/couchdb0
mkdir ../../tmp_data/org2/couchdb2