function execute() {

    declare -i attempts=$2
    if [ $attempts -lt 1 ]; then
        attempts=1
    fi

    declare -i delay=$3
    if [ $delay -lt 1 ]; then
        delay=1;
    fi

    result=0
    declare -i count=0

    while [ $count -lt $attempts ]; do
        eval $1
        result=$?

        if [ $result -eq 0 ]; then
            return
        fi

        sleep $delay
        count=$count+1;        
    done

    exit 1
}