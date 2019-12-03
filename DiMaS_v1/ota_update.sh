#!/bin/bash

declare -A array
array["esp8266-c690bb"]=1 # ulti 3
array["esp8266-173616"]=1 # ulti 1 
array["esp8266-c6e662"]=1 # prusa 
array["esp8266-c6e82e"]=1 # eecke
array["esp8266-172dd8"]=1 # platfraes
array["esp8266-c730a8"]=1 # drehmasch 
array["esp8266-c73646"]=1 # cncfraes
array["esp8266-c6e1a1"]=1 # lasercut

DEVICES=$(timeout 1 avahi-browse _arduino._tcp -p)
file=$1
i=0
for line in $DEVICES; do
	HOSTNAME="$(cut -d';' -f4 <<<"$line")" 
	IP=$(dig +short ${HOSTNAME} @192.168.2.1)
	
	if [[ ${array[$HOSTNAME]} ]]; then 
	
		echo "Trying to flash ${HOSTNAME}:${IP}"
	
		./start_update.sh ${IP} ${file}&
		pids[${i}]=$!
		i=${i}+1
	else
		echo "ESP ${HOSTNAME} not in Known hosts, ignoring"
	fi
done

for pid in ${pids[*]}; do
	wait $pid
done

echo "done updating"
