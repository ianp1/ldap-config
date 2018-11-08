import com.unboundid.ldap.sdk.*;
import com.unboundid.ldif.LDIFException;
import org.junit.jupiter.api.Test;

import java.security.GeneralSecurityException;

import static org.junit.jupiter.api.Assertions.*;

public class MitgliedVerwaltungTest extends Base{

    @Test
    public void einweisungNotVisible() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(MITGLIED_USER,"1234");

        SearchResultEntry entry = connection.getEntry("ou=einweisung,"+LDAP_BASE);
        assertNull(entry);
    }



    @Test
    public void userCreatable () throws GeneralSecurityException, LDAPException, LDIFException {
        userCreateDummy(connect(MITGLIED_USER, "1234"));

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
        LDAPConnection connection = connect(MITGLIED_USER,
                "1234");

        SearchResultEntry entry = connection.getEntry(TEST_GERAET);
        System.out.println(entry);
        assertEquals(entry.getAttribute("geraetname").getValue(), TEST_GERAET_NAME);
    }

    @Test
    public void maschineNotCreatable() {
        assertThrows(LDAPException.class, ()-> machineNotCreatableDummy(connect(MITGLIED_USER, "1234")),
                "no write access to parent");
    }

    @Test
    public void maschineNotWritable() {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(MITGLIED_USER,"1234");

            connection.modify(TEST_GERAET, new Modification(ModificationType.ADD, "geraetementor", NORMAL_USER));

        }, "no write access to parent");
    }

    @Test
    public void groupsNotVisible() throws GeneralSecurityException, LDAPException {

        LDAPConnection connection = connect(MITGLIED_USER, "1234");
        SearchResultEntry entry = connection.getEntry("ou=group,"+LDAP_BASE);

        assertNull(entry);
    }
}
