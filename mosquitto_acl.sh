#!/bin/bash
# Create Mosquitto-ACLs for machines
# takes one argument, the machine name
# prints generated password to stdout 


MACHINE_NAME=$1
if [ -z "$MACHINE_NAME" ]; then
	echo "Usage: mosquitto_acl.sh machine_name"
       	exit -1
fi

echo "Adding user $MACHINE_NAME to /etc/mosquitto/passwd, continue [j/y/n]?"
read -n 1 ans
printf "\n"
PASSWD=`head /dev/urandom | tr -dc A-Za-z0-9 | head -c 8 ; echo ''`
if [ "$ans" = "y"  ] || [ "$ans" = "j" ]; then
	mosquitto_passwd -b /etc/mosquitto/passwd $MACHINE_NAME $PASSWD
else
	echo "OK, not added"
fi

#echo "user $MACHINE_NAME">>/etc/mosquitto/acl
#echo "topic read machines/$MACHINE_NAME/status">>/etc/mosquitto/acl

echo "User added, password is $PASSWD"
