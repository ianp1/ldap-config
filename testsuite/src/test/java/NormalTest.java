import com.unboundid.ldap.sdk.*;
import org.junit.jupiter.api.Test;

import java.security.GeneralSecurityException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class NormalTest extends Base{

    @Test
    public void einweisungNotVisible() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(NORMAL_USER,"1234");

        SearchResultEntry entry = connection.getEntry("ou=einweisung,"+LDAP_BASE);
        assertNull(entry);
    }



    @Test
    public void userNotCreatable () throws GeneralSecurityException, LDAPException {
        assertThrows(LDAPException.class, () -> {
            userCreateDummy(connect(NORMAL_USER, "1234"));
        }, "no write access to parent");
    }

    @Test
    public void usersNotVisible() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(NORMAL_USER, "1234");
        SearchRequest request = new SearchRequest("ou=user,"+LDAP_BASE,
                SearchScope.SUBORDINATE_SUBTREE, Filter.create("(objectClass=*)"));

        SearchResult result = connection.search(request);
        System.out.println(result.getSearchEntries().get(0));
        assertEquals(1, result.getEntryCount());
    }

    /*
    @Test
    public void userNotWritable() throws GeneralSecurityException, LDAPException {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(NORMAL_USER,"1234");

            connection.modify(NORMAL_USER, new Modification(ModificationType.ADD, "description", "hallo welt"));
        }, "insufficient access rights");
    }*/

    @Test
    public void ownUserReadable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(NORMAL_USER,"1234");

        SearchResultEntry entry = connection.getEntry(NORMAL_USER);


        assertEquals(entry.getAttribute("uid").getValue(), NORMAL_USER_UID);
    }

    @Test
    public void maschineReadable() throws GeneralSecurityException, LDAPException {
        LDAPConnection connection = connect(NORMAL_USER,
                "1234");

        SearchResultEntry entry = connection.getEntry(TEST_GERAET);
        System.out.println(entry);
        assertEquals(entry.getAttribute("geraetname").getValue(), TEST_GERAET_NAME);
    }

    @Test
    public void maschineNotCreatable() {
        assertThrows(LDAPException.class, ()-> machineNotCreatableDummy(connect(NORMAL_USER, "1234")),
                "no write access to parent");
    }

    @Test
    public void maschineNotWritable() {
        assertThrows(LDAPException.class, ()->{
            LDAPConnection connection = connect(NORMAL_USER,"1234");

            connection.modify(TEST_GERAET, new Modification(ModificationType.ADD, "geraetementor", NORMAL_USER));

        }, "no write access to parent");
    }

    @Test
    public void groupsNotVisible() throws GeneralSecurityException, LDAPException {

        LDAPConnection connection = connect(NORMAL_USER, "1234");
        SearchResultEntry entry = connection.getEntry("ou=group,"+LDAP_BASE);

        assertNull(entry);
    }
}
