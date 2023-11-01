FROM osixia/openldap:1.5.0

ENV LDAP_DOMAIN=ldap-provider.fablab-luebeck
ENV LDAP_BASE_DN=dc=ldap-provider,dc=fablab-luebeck
ENV LDAP_BACKEND=mdb
ENV LDAP_DEBUG_LEVEL=8
ENV LDAP_TLS=false

RUN mkdir -p /container/service/slapd/assets/config/bootstrap/ldif/custom
ADD ldap-structure/* /container/service/slapd/assets/config/bootstrap/ldif/custom/
ADD seed/* /container/service/slapd/assets/config/bootstrap/ldif/custom/