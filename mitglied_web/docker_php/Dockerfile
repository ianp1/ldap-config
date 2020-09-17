FROM php:7.2-fpm
RUN \
    apt-get update && \
    apt-get install libldap2-dev -y && \
    rm -rf /var/lib/apt/lists/* && \
    docker-php-ext-configure ldap --with-libdir=lib/x86_64-linux-gnu/ && \
    docker-php-ext-install ldap
COPY phpSettings.conf /usr/local/etc/php-fpm.d/zzz-phpSettings.conf
COPY ldap.conf /etc/ldap/ldap.conf