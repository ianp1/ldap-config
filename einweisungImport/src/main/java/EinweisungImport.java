import com.unboundid.ldap.sdk.*;
import com.unboundid.ldap.sdk.extensions.StartTLSExtendedRequest;
import com.unboundid.ldif.LDIFException;
import com.unboundid.util.LDAPTestUtils;
import com.unboundid.util.ssl.SSLUtil;
import com.unboundid.util.ssl.TrustAllTrustManager;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import javax.net.ssl.SSLContext;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.LinkedList;

public class EinweisungImport {
    public static final int VORNAME_CELL_NUMBER = 1;
    public static final int NACHNAME_CELL_NUMBER = 2;
    public static final int SICHERHEIT_CELL_NUMBER = 4;

    public static final SimpleDateFormat DATE_PARSER = new SimpleDateFormat("dd.MM.yyyy");
    public static final SimpleDateFormat DATE_FORMATTER = new SimpleDateFormat("yyyyMMdd");

    public static final String LDAP_BASE_DN = "dc=ldap-provider,dc=fablab-luebeck";

    public static void main(String[] args) throws IOException, ParseException, GeneralSecurityException, LDAPException, LDIFException {
        //System.out.println("uniqid: "+uniqid("e_", false));

        LDAPConnection connection = new LDAPConnection("192.168.3.4",389);
        // Create an SSLUtil instance that is configured to trust certificates in
        // a specified trust store file, and use it to create an SSLContext that
        // will be used for StartTLS processing.
        SSLUtil sslUtil = new SSLUtil(new TrustAllTrustManager());
        SSLContext sslContext = sslUtil.createSSLContext();

        // Use the StartTLS extended operation to secure the connection.
        StartTLSExtendedRequest startTLSRequest = new StartTLSExtendedRequest(sslContext);
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

        connection.bind("cn=admin,dc=ldap-provider,dc=fablab-luebeck", "***");

        File excelFile = new File("/home/ian/Dokumente/FabLab/Einweisungen/Einweisungen09.06.2018.xlsx");
        FileInputStream fis = new FileInputStream(excelFile);

        XSSFWorkbook workbook = new XSSFWorkbook(fis);
        XSSFSheet sheet = workbook.getSheetAt(0);

        Iterator<Row> rowIterator = sheet.iterator();
        Row headerRow = rowIterator.next();

        while (rowIterator.hasNext()) {
            Row row = rowIterator.next();
            System.out.println("------------------------------------");
            System.out.print("Benutzer: ");
            System.out.println(row.getCell(VORNAME_CELL_NUMBER)+" "+row.getCell(NACHNAME_CELL_NUMBER));


            Iterator<Cell> cellIterator = row.cellIterator();
            Iterator<Cell> headerCellIterator = headerRow.cellIterator();

            String vorname = row.getCell(VORNAME_CELL_NUMBER).toString().trim();
            String nachname = row.getCell(NACHNAME_CELL_NUMBER).toString().trim();

            String[] vornamen = vorname.split(" ");
            String[] nachnamen = nachname.split(" ");

            StringBuilder nachnamenJoint = new StringBuilder();
            for (String t : nachnamen) {
                if (t.length() > 0) {
                    String t2 = Character.toUpperCase(t.charAt(0)) + t.substring(1);
                    nachnamenJoint.append(t2);
                }
            }

            String userID = vornamen[0]+nachnamenJoint;

            userID = userID.replace("ä", "ae");
            userID = userID.replace("ö", "oe");
            userID = userID.replace("ü", "ue");
            userID = userID.replace("ß", "ss");
            userID = Normalizer
                    .normalize(userID, Normalizer.Form.NFD)
                    .replaceAll("[^\\p{ASCII}]", "");

            String userDN = "uid="+userID+",ou=user,"+LDAP_BASE_DN;

            int i = 0;
            while (connection.getEntry(userDN) != null) {
                userDN = "uid="+userID+(i++)+",ou=user,"+LDAP_BASE_DN;
                System.out.println("FOUND EXISTING USER!");
            }

            System.out.println(userDN);

            ArrayList<String> userLdif = new ArrayList<String>(Arrays.asList("dn: " + userDN,
                    "objectClass: inetOrgPerson",
                    "objectClass: fablabPerson",
                    "sn: " + row.getCell(NACHNAME_CELL_NUMBER),
                    "geburtstag: " + toLdapDate("01.01.1800"),
                    "sicherheitsbelehrung: " + toLdapDate(row.getCell(SICHERHEIT_CELL_NUMBER).toString())));

            for (String t : vornamen) {
                userLdif.add("cn: "+t);
            }
            //debugLdif(userLdif);

            String[] userLdifAr = new String[userLdif.size()];
            userLdifAr = userLdif.toArray(userLdifAr);
            connection.add(userLdifAr);


            while (cellIterator.hasNext()) {
                Cell cell = cellIterator.next();
                Cell headerCell = headerCellIterator.next();

                if (headerCell.toString().equals("Vorname")) {
                } else if (headerCell.toString().equals("Nachname")) {
                } else if (headerCell.toString().equals("Sicherheitsbelehrung")) {
                } else if (headerCell.toString().equals("Mitgliedsform")) {
                } else if (headerCell.toString().equals("Nr.")) {
                } else if (!cell.toString().equals("")){
                    System.out.println("Einweisung: " + headerCell.toString());
                    System.out.println(cell.toString());

                    String distinctName = uniqid("e_", false);
                    String einweisungDn = "distinctname=" + distinctName
                            + ",geraetname=" + headerCell.toString()
                            + ",ou=einweisung," + LDAP_BASE_DN;
                    ArrayList<String> einweisungLdif = new ArrayList<String>(Arrays.asList(
                            "dn: " + einweisungDn,
                            "objectClass: einweisung",
                            "distinctname: " + distinctName,
                            "einweisungsdatum: " + toLdapDate(cell.toString()),
                            "eingewiesener: " + userDN
                    ));

                    //debugLdif(einweisungLdif);
                    String[] einweisungLdifAr = new String[einweisungLdif.size()];
                    einweisungLdifAr = einweisungLdif.toArray(einweisungLdifAr);
                    connection.add(einweisungLdifAr);

                }
            }
        }

        workbook.close();
        fis.close();
    }

    public static String uniqid(String prefix,boolean more_entropy)
    {
        long time = System.currentTimeMillis();
        //String uniqid = String.format("%fd%05f", Math.floor(time),(time-Math.floor(time))*1000000);
        //uniqid = uniqid.substring(0, 13);
        String uniqid = "";
        if(!more_entropy)
        {
            uniqid = String.format("%s%08x%05x", prefix, time/1000, time);
        }else
        {
            SecureRandom sec = new SecureRandom();
            byte[] sbuf = sec.generateSeed(8);
            ByteBuffer bb = ByteBuffer.wrap(sbuf);

            uniqid = String.format("%s%08x%05x", prefix, time/1000, time);
            uniqid += "." + String.format("%.8s", ""+bb.getLong()*-1);
        }


        return uniqid ;
    }

    public static String toLdapDate(String date) throws ParseException {
        if (date.equals("")) {
            date = "01.01.1800";
        }
        return DATE_FORMATTER.format(DATE_PARSER.parse(date))+"000000Z";
    }

    public static void debugLdif(ArrayList<String> ldif) {
        System.out.println("[");
        for (int i = 0; i < ldif.size(); i++) {
            System.out.println(ldif.get(i));
        }
        System.out.println("]");
    }
}
