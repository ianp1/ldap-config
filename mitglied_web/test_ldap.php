<?php
	$ldaphost = "192.168.3.4";
	$ldapport = 389;

	$ldapconn = ldap_connect($ldaphost, $ldapport) or die( "Keine Verbindung");

	ldap_set_option($ldapconn,LDAP_OPT_PROTOCOL_VERSION,3);
	if ($ldapconn) {
		ldap_start_tls($ldapconn);
		$ldapbind = ldap_bind($ldapconn, "uid=normaltest,ou=user,dc=ldap-provider,dc=fablab-luebeck", "1234");
		
		if ($ldapbind) {
			echo "cool!";
		}
		else {
			echo ldap_error($ldapconn);
			ldap_get_option($ldapconn, LDAP_OPT_DIAGNOSTIC_MESSAGE, $err);
			echo "ldap_get_option: $err";
		}
	}
?>
