#!/bin/bash
# seeds a newly created ldap file system with standard entries


echo "What ldap-user should the operation be performed with [cn=admin,dc=ldap-provider,dc=fablab-luebeck]?"
read LDAP_USER
if [ -z "$LDAP_USER" ];
then
    LDAP_USER="cn=admin,dc=ldap-provider,dc=fablab-luebeck"
fi 

echo "Please insert the password for user $LDAP_USER [admin]: "
read -s LDAP_PASSWORD
if [ -z "$LDAP_PASSWORD" ];
then
    LDAP_PASSWORD="admin"
fi

for f in ./seed/*
do
    IFS=
    echo "'$LDAP_USER'"
    echo "'$LDAP_PASSWORD'"
    echo "'$f'"
    set -o pipefail
    TASK_RESPONSE=$(ldapadd -h localhost -p 389 -D $LDAP_USER -w "$LDAP_PASSWORD" -f $f -c -v 2>&1 | tr '\0' '\n')
    if [ $? -ne 0 ]
    then
        echo -e "error performing seed action \e[31m$f\e[0m"
        echo -n "error is "
        echo -e "\e[31m$TASK_RESPONSE\e[0m"
    else
        echo -e "successfully performed \e[92m$f\e[0m"
    fi

done


