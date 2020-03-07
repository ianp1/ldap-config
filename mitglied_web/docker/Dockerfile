FROM osixia/openldap:1.3.0

#RUN mkdir -p /container/service/slapd/assets/config/bootstrap/ldif/custom
ADD ldap-structure/* /container/service/slapd/assets/config/bootstrap/ldif/custom/
#RUN cd /container/service/slapd/assets/config/bootstrap/
RUN ls -la /container/service/slapd/assets/config/bootstrap/ldif/custom/
#RUN cat /container/service/slapd/assets/config/bootstrap/fablabPerson2.ldif