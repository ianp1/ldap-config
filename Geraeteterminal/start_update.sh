#!/bin/bash

IP=$1
FILE=$2
/usr/bin/python espota.py -d -i ${IP} -f ${FILE} -a esFab19! &>/dev/null
status=$?
if [ $status -ne 0 ] 
then
	echo "ESP ${IP} failed!"
else
	echo "ESP ${IP} successfully updated"
fi
