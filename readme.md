
##LDAP auf STARTTLS umschalten##
https://www.digitalocean.com/community/tutorials/how-to-encrypt-openldap-connections-using-starttls
``` shell
sudo mkdir /etc/ssl/templates
sudo cp ca_server.conf /etc/ssl/templates
sudo cp ldap_server.conf /etc/ssl/templates

sudo apt install gnutls-bin
sudo certtool -p --outfile /etc/ssl/private/ca_server.key
sudo certtool -s --load-privkey /etc/ssl/private/ca_server.key --template /etc/ssl/templates/ca_server.conf --outfile /etc/ssl/certs/ca_server.pem

sudo certtool -p --sec-param high --outfile /etc/ssl/private/ldap_server.key
sudo certtool -c --load-privkey /etc/ssl/private/ldap_server.key --load-ca-certificate /etc/ssl/certs/ca_server.pem --load-ca-privkey /etc/ssl/private/ca_server.key --template /etc/ssl/templates/ldap_server.conf --outfile /etc/ssl/certs/ldap_server.pem

sudo groupadd ssl-cert
sudo usermod -aG ssl-cert openldap
sudo chown :ssl-cert /etc/ssl/private/ldap_server.key
sudo chmod 640 /etc/ssl/private/ldap_server.key
sudo chown :ssl-cert /etc/ssl/private
sudo chmod 650 /etc/ssl/private/

sudo ldapmodify -H ldapi:// -Y EXTERNAL -f addcerts.ldif

sudo service slapd force-reload
```
Anschließend im ADS(Apache Directory Studio) überprüfen

##STARTTLS verpflichtend##
https://www.digitalocean.com/community/tutorials/how-to-encrypt-openldap-connections-using-starttls
``` shell
sudo ldapmodify -H ldapi:// -Y EXTERNAL -f forcetls.ldif
sudo service slapd force-reload
```

#Struktur anlegen#
##Memberof overlay##
``` shell
sudo ldapadd -Q -Y EXTERNAL -H ldapi:// -f overlays/memberof.ldif
sudo ldapmodify -Q -Y EXTERNAL -H ldapi:/// -f overlays/refint1.ldif
sudo ldapadd -Q -Y EXTERNAL -H ldapi:/// -f overlays/refint2.ldif

```

