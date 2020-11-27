function init() {
    down
    
    if [ -d ./data ]; then
        read -p "All blockchain data will be removed. Do you want to continue? (y/n) " REPLY
        if [ -z $REPLY ] || [ $REPLY != y -a $REPLY != Y ]; then
            exit
        fi
        sudo rm -rf ./data
    fi

    node ./scripts/configure \
        "crypto-config.yaml" \
        "core.yaml" \
        "configtx.yaml" \
        "orderer.yaml" \
        "cporg1.json" \
        "docker-compose.yaml" \
        "setup.sh"
    if [ $? -ne 0 ]; then
        errorln "Failed to configure network"
        exit 1
    fi

    chmod +x ./config/files/setup.sh
    ./config/files/setup.sh
    if [ $? -ne 0 ]; then
        errorln "Failed to initialize network"
        exit 1
    fi
}

function up() {
    if [ ! -d ./data ]; then
        errorln "Network is not initialized"
        exit 1
    elif [ ! -f ./config/files/docker-compose.yaml ]; then
        errorln "Configuration files missing"
        exit 1
    else
        node ./scripts/configure \
            "docker-compose.yaml" \
            "setup-chaincode.sh"
        if [ $? -ne 0 ]; then
            errorln "Failed to configure network"
            exit 1
        fi

        docker-compose -f ./config/files/docker-compose.yaml up -d
        if [ $? -ne 0 ]; then
            errorln "Failed to start network"
            exit 1
        fi

        chmod +x ./config/files/setup-chaincode.sh
        ./config/files/setup-chaincode.sh
        if [ $? -ne 0 ]; then
            errorln "Failed to initialize chaincode"
            exit 1
        fi
    fi
}

function down() {
    if [ -f ./config/files/docker-compose.yaml ]; then
        docker-compose -f ./config/files/docker-compose.yaml down
        if [ $? -ne 0 ]; then
            errorln "Failed to stop network"
            exit 1
        fi
    fi
}


source ./scripts/format.sh

if [ $1 == "init" ]; then
    init
elif [ $1 == "up" ]; then
    up
elif [ $1 == "down" ]; then
    down
else
    errorln "Unknown command"
    exit 1
fi