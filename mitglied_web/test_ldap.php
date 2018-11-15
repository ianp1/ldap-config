<?php
	$ldaphost = "192.168.3.4";
	$ldapport = 389;

	$ldapconn = ldap_connect($ldaphost, $ldapport) or die( "Keine Verbindung");

	ldap_set_option($ldapconn,LDAP_OPT_PROTOCOL_VERSION,3);
	if ($ldapconn) {
		ldap_start_tls($ldapconn);
		$sr = ldap_search($ldapconn, "ou=maschine,dc=ldap-provider,dc=fablab-luebeck", "(objectClass=*)", array("geraetname"));
		$result = ldap_get_entries($ldapconn, $sr);
		var_dump($result);
		var_dump($result['count']);

		echo ldap_error($ldapconn);
		ldap_get_option($ldapconn, LDAP_OPT_DIAGNOSTIC_MESSAGE, $err);
		echo "ldap_get_option: $err";
		/*$ldapbind = ldap_bind($ldapconn, "uid=normaltest,ou=user,dc=ldap-provider,dc=fablab-luebeck", "1234");
		
		if ($ldapbind) {
			echo "cool!";
		}
		else {
			echo ldap_error($ldapconn);
			ldap_get_option($ldapconn, LDAP_OPT_DIAGNOSTIC_MESSAGE, $err);
			echo "ldap_get_option: $err";
		}*/
	}
?>
