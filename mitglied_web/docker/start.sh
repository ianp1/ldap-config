docker stop ldap-provider
docker rm ldap-provider
docker run -p 389:389 -p 636:636 --name ldap-provider \
            --volume /home/ian/Dokumente/Programmieren/FabLab/ldap/ldap-config/mitglied_web/docker/persistence/database:/var/lib/ldap \
            --volume /home/ian/Dokumente/Programmieren/FabLab/ldap/ldap-config/mitglied_web/docker/persistence/config:/etc/ldap/slapd.d \
            --env LDAP_DOMAIN="ldap-provider.fablab-luebeck" \
            --env LDAP_ORGANISATION="FabLab Luebeck e.V." \
            --volume /home/ian/Dokumente/Programmieren/FabLab/ldap/ldap-config/mitglied_web/docker/ldap-structure/:/container/service/slapd/assets/config/bootstrap/ldif/custom \
            --detach osixia/openldap:1.3.0 \
            --loglevel debug