#!/bin/bash
# stops and removes old containers
# clears config and data folders and rebuilds them

CONTAINER=ldap-provider
echo $PWD
DATA_VOLUME=$PWD/persistence/database
CONFIG_VOLUME=$PWD/persistence/config
# stop running containers and remove them
docker stop $CONTAINER
docker rm $CONTAINER

NOW=`date '+%F_%H:%M:%S'`;
# backup data and remove it afterwards
tar czf backups/database_$NOW.tar.gz persistence/database
rm -r persistence/database

# need to rebuild config, too
# since docker container will complain otherwise
tar czf backups/config_$NOW.tar.gz persistence/config
rm -r persistence/config

# rebuild image
docker image build --no-cache -t $CONTAINER ./
# build new container
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
    echo "check debug output and try again"
    exit -1
fi