import com.unboundid.ldap.sdk.*;
import com.unboundid.ldap.sdk.extensions.StartTLSExtendedRequest;
import com.unboundid.util.LDAPTestUtils;
import com.unboundid.util.ssl.SSLUtil;
import com.unboundid.util.ssl.TrustAllTrustManager;
import org.junit.jupiter.api.Test;

import javax.net.ssl.SSLContext;

import java.security.GeneralSecurityException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class EinweisungVerwaltungTest {
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

    @Test
    public void einweisungWritable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

        String uniqueName = UUID.randomUUID().toString();
        Attribute[] props = {
                new Attribute("objectClass","einweisung"),
                new Attribute("eingewiesener", NORMAL_USER),
                new Attribute("einweisungsdatum", "20181101115331.688Z"),
                new Attribute("geraet", TEST_GERAET)
        };

        String entry = "distinctname="+uniqueName+",ou=einweisung,"+LDAP_BASE;
        connection.add(entry, props);

        connection.delete(entry);
    }



    @Test
    public void userNotCreatable () throws GeneralSecurityException, LDAPException {
        assertThrows(LDAPException.class, () -> {
            LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

            String uniqueName = UUID.randomUUID().toString();
            Attribute[] props = {
                    new Attribute("objectClass","fablabMitglied"),
                    new Attribute("beginn", "20181101115331.688Z"),
                    new Attribute("beitrag", "10"),
                    new Attribute("kontoinhaber", "name"),
                    new Attribute("mitgliedsart", "abc"),
            };

            String entry = "mitgliedsnummer="+uniqueName+",ou=user,"+LDAP_BASE;
            connection.add(entry, props);

            //Execute delete if add did not fail, afterwards the test fails because no exception is thrown
            connection.delete(entry);
        }, "no write access to parent");
    }


    @Test
    public void userNotWritable() throws GeneralSecurityException, LDAPException {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

            connection.modify(NORMAL_USER, new Modification(ModificationType.ADD, "description", "hallo welt"));
        }, "insufficient access rights");
    }

    @Test
    public void userReadable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

        SearchResultEntry entry = connection.getEntry(NORMAL_USER);


        assertEquals(entry.getAttribute("uid").getValue(), NORMAL_USER_UID);
    }

    @Test
    public void maschineReadable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(EINWEISUNG_USER,
                "1234");

        SearchResultEntry entry = connection.getEntry(TEST_GERAET);
        System.out.println(entry);
        assertEquals(entry.getAttribute("geraetname").getValue(), TEST_GERAET_NAME);
    }

    @Test
    public void maschineNotCreatable() {
        assertThrows(LDAPException.class, ()-> {
            LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

            String name = "geraetname=" + UUID.randomUUID().toString() + "ou=maschine," + LDAP_BASE;
            Attribute[] attributes = {
                    new Attribute("objectClass", "geraet"),
                    new Attribute("geraetementor", NORMAL_USER)
            };
            connection.add(name, attributes);
        }, "no write access to parent");
    }

    @Test
    public void maschineNotWritable() {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

            connection.modify(TEST_GERAET, new Modification(ModificationType.ADD, "geraetementor", NORMAL_USER));

        }, "no write access to parent");
    }

    @Test
    public void groupsNotVisible() throws GeneralSecurityException, LDAPException {

        LDAPConnection connection = connect(EINWEISUNG_USER, "1234");
        SearchResultEntry entry = connection.getEntry("ou=group,"+LDAP_BASE);

        assertNull(entry);
    }
}
