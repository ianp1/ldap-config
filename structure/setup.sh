#!/bin/bash
# script to update ldap configuration based on ldif files
# deletes old containers, rebuilds image and config and loads old data

CONTAINER=ldap-provider
DATA_VOLUME=$PWD/persistence/database
CONFIG_VOLUME=$PWD/persistence/config
# stop running containers and remove them
docker stop $CONTAINER
docker rm $CONTAINER
# remove old image to save some space
docker image rm $CONTAINER

# backup old config
NOW=`date '+%F_%H:%M:%S'`;

tar czf backups/config_$NOW.tar.gz persistence/config
rm -r persistence/config

# start docker container to generate config
# let it delete itself afterwards
# dont mount data volume, since it could possibly prevent it from loading
docker image build --no-cache -t $CONTAINER ./
docker run -p 389:389 -p 636:636 --name $CONTAINER \
            --volume $CONFIG_VOLUME:/etc/ldap/slapd.d \
            --env LDAP_DOMAIN="ldap-provider.fablab-luebeck" \
            --env LDAP_ORGANISATION="FabLab Luebeck e.V." \
            --env LDAP_CONFIG_PASSWORD="config" \
            --env LDAP_TLS_VERIFY_CLIENT=never \
            --detach $CONTAINER \
            --loglevel trace 2>&1


# wait if container is successfully started or not
sleep 3
if [ ! "$(docker ps -q -f name=$CONTAINER)" ];
then
    IFS=
    echo `docker logs $CONTAINER`
    echo "container not started, check output above"
    echo "probably failed to create config. Check debug output and fix errors"
    exit -1
fi

# now start with data volume mounted
echo "successfully created ldap config"
echo "starting up main container to check data integrity"
docker stop $CONTAINER
docker rm $CONTAINER
docker run -p 389:389 -p 636:636 --name $CONTAINER \
            --volume $DATA_VOLUME:/var/lib/ldap \
            --volume $CONFIG_VOLUME:/etc/ldap/slapd.d \
            --env LDAP_DOMAIN="ldap-provider.fablab-luebeck" \
            --env LDAP_ORGANISATION="FabLab Luebeck e.V." \
            --env LDAP_CONFIG_PASSWORD="config" \
            --env LDAP_TLS_VERIFY_CLIENT=never \
            --detach $CONTAINER \
            --loglevel trace 2>&1

# check if container was successfully started, to ensure everything is working 
sleep 3
if [ ! "$(docker ps -q -f name=$CONTAINER)" ];
then
    IFS=
    echo `docker logs $CONTAINER`
    echo "container not started, check output above"
    echo "main container could not be started, maybe data integrity problems?"
    echo "check debug output and try again"
    exit -1
fi
# CONFIG_STATUS=$?
# if [$CONFIG_STATUS -eq 0]
# then
#     echo "successfully created new config"
# else 
#     echo "error creating config"
# fi