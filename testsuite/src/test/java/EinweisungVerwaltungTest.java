import com.unboundid.ldap.sdk.*;
import org.junit.jupiter.api.Test;

import java.security.GeneralSecurityException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class EinweisungVerwaltungTest extends Base{

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
            userCreateDummy(connect(EINWEISUNG_USER, "1234"));
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
        assertThrows(LDAPException.class, ()-> machineNotCreatableDummy(connect(EINWEISUNG_USER, "1234")),
                "no write access to parent");
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
