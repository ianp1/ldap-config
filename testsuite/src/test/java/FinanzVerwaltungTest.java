import com.unboundid.ldap.sdk.*;
import org.junit.jupiter.api.Test;

import java.security.GeneralSecurityException;

import static org.junit.jupiter.api.Assertions.*;

public class FinanzVerwaltungTest extends Base{

    @Test
    public void einweisungNotVisible() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(FINANZ_USER,"1234");

        SearchResultEntry entry = connection.getEntry("ou=einweisung,"+LDAP_BASE);
        assertNull(entry);
    }



    @Test
    public void userNotCreatable () throws GeneralSecurityException, LDAPException {
        assertThrows(LDAPException.class, () -> {
            userCreateDummy(connect(FINANZ_USER, "1234"));
        }, "no write access to parent");
    }


    @Test
    public void userFinanzReadable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(FINANZ_USER,"1234");

        SearchResultEntry entry = connection.getEntry(NORMAL_USER);
        String[] neededAttributes = {
                "mitgliedsart",
                "mitgliedsnummer",
                "cn",
                "sn",
                "beginn",
                "kontoinhaber",
                "objectClass",
                "uid",
                "beitrag"
        };

        for (String needed :
                neededAttributes) {
            assertNotNull(entry.getAttribute(needed), "Attribute "+needed+" has to be readable");
        }
    }

    @Test
    public void userNotWritable() {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(EINWEISUNG_USER,"1234");

            connection.modify(NORMAL_USER, new Modification(ModificationType.ADD, "description", "hallo welt"));
        }, "insufficient access rights");
    }

    @Test
    public void maschineReadable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(FINANZ_USER,
                "1234");

        SearchResultEntry entry = connection.getEntry(TEST_GERAET);
        System.out.println(entry);
        assertEquals(entry.getAttribute("geraetname").getValue(), TEST_GERAET_NAME);
    }

    @Test
    public void maschineNotCreatable() {
        assertThrows(LDAPException.class, ()-> machineNotCreatableDummy(connect(FINANZ_USER, "1234")),
                "no write access to parent");
    }

    @Test
    public void maschineNotWritable() {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(FINANZ_USER,"1234");

            connection.modify(TEST_GERAET, new Modification(ModificationType.ADD, "geraetementor", NORMAL_USER));

        }, "no write access to parent");
    }

    @Test
    public void groupsNotVisible() throws GeneralSecurityException, LDAPException {

        LDAPConnection connection = connect(FINANZ_USER, "1234");
        SearchResultEntry entry = connection.getEntry("ou=group,"+LDAP_BASE);

        assertNull(entry);
    }
}
