import com.unboundid.ldap.sdk.*;
import com.unboundid.ldap.sdk.extensions.StartTLSExtendedRequest;
import com.unboundid.ldif.LDIFException;
import com.unboundid.util.LDAPTestUtils;
import com.unboundid.util.ssl.SSLUtil;
import com.unboundid.util.ssl.TrustAllTrustManager;

import javax.net.ssl.SSLContext;
import java.security.GeneralSecurityException;
import java.util.UUID;

public class Base {
    public static final String LDAP_URL = "192.168.3.4";
    public static final int LDAP_PORT = 389;
    public static final String LDAP_BASE = "dc=ldap-provider,dc=fablab-luebeck";

    public static final String NORMAL_USER_UID = "normaltest";
    public static final String NORMAL_USER = "uid="+NORMAL_USER_UID+",ou=user,"+LDAP_BASE;

    public static final String EINWEISUNG_USER = "uid=einweisungvtest,ou=user,"+LDAP_BASE;
    public static final String MITGLIED_USER = "uid=mitgliedvtest,ou=user,"+LDAP_BASE;
    public static final String FINANZ_USER = "uid=finanzvtest,ou=user,"+LDAP_BASE;

    public static final String TEST_GERAET_NAME = "lasercutter";
    public static final String TEST_GERAET = "geraetname="+TEST_GERAET_NAME+",ou=maschine,"+LDAP_BASE;

    public LDAPConnection connect(String user, String password) throws LDAPException, GeneralSecurityException {
        LDAPConnection connection = new LDAPConnection(LDAP_URL, LDAP_PORT);

        // Create an SSLUtil instance that is configured to trust certificates in
        // a specified trust store file, and use it to create an SSLContext that
        // will be used for StartTLS processing.
        SSLUtil sslUtil = new SSLUtil(new TrustAllTrustManager());
        SSLContext sslContext = sslUtil.createSSLContext();

        // Use the StartTLS extended operation to secure the connection.
        StartTLSExtendedRequest startTLSRequest =
                new StartTLSExtendedRequest(sslContext);
        ExtendedResult startTLSResult;
        try
        {
            startTLSResult = connection.processExtendedOperation(startTLSRequest);
        }
        catch (LDAPException le)
        {
            startTLSResult = new ExtendedResult(le);
        }
        LDAPTestUtils.assertResultCodeEquals(startTLSResult, ResultCode.SUCCESS);

        connection.bind(user, password);
        return connection;
    }

    public void userCreateDummy(LDAPConnection connection) throws LDAPException, LDIFException {

        String uniqueName = UUID.randomUUID().toString();

        String entry = "mitgliedsnummer="+uniqueName+",ou=user,"+LDAP_BASE;
        String[] ldif = {
                "dn: "+entry,
                "objectClass: inetOrgPerson",
                "objectClass: fablabMitglied",
                "beginn: 20181101115331.688Z",
                "beitrag: 10",
                "kontoinhaber: name",
                "mitgliedsart: abc",
                "cn: hallo",
                "sn: welt",
                "uid: HalloWelt!"
        };

        connection.add(ldif);

        //Execute delete if add did not fail, afterwards the test fails because no exception is thrown
        connection.delete(entry);
    }

    public void machineNotCreatableDummy(LDAPConnection connection) throws GeneralSecurityException, LDAPException {
        String name = "geraetname=" + UUID.randomUUID().toString() + "ou=maschine," + LDAP_BASE;
        Attribute[] attributes = {
                new Attribute("objectClass", "geraet"),
                new Attribute("geraetementor", NORMAL_USER)
        };
        connection.add(name, attributes);
    }
}
