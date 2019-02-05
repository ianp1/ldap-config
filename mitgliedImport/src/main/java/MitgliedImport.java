import com.unboundid.ldap.sdk.*;
import com.unboundid.ldap.sdk.extensions.StartTLSExtendedRequest;
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
import java.security.GeneralSecurityException;
import java.util.Iterator;


public class MitgliedImport {

    public static final int CELL_ANREDE = 2;
    public static final int CELL_TITEL = 3;
    public static final int CELL_NACHNAME = 4;
    public static final int CELL_VORNAME = 5;
    public static final int CELL_ADRESSE_1 = 7;
    public static final int CELL_ADRESSE_2 = 8;
    public static final int CELL_ADRESSE_3 = 9;
    public static final int CELL_ADRESSE_4 = 10;
    public static final int CELL_GEBURTSDATUM = 11;
    public static final int CELL_GESCHLECHT = 12;
    public static final int CELL_BIC = 13;
    public static final int CELL_IBAN = 14;
    public static final int CELL_KONTOINHABER_1 = 28;
    public static final int CELL_KONTOINHABER_2 = 30;
    public static final int CELL_KONTOINHABER_3 = 32;
    public static final int CELL_KONTOINHABER_4 = 33;
    public static final int CELL_KONTOINHABER_5 = 34;
    public static final int CELL_TELEFON_1 = 35;
    public static final int CELL_TELEFON_2 = 36;
    public static final int CELL_HANDY = 37;
    public static final int CELL_MAIL = 38;
    public static final int CELL_EINTRITT = 39;
    public static final int CELL_MITGLIEDSCHAFT = 40;
    public static final int CELL_BEMERKUNG_1 = 45;
    public static final int CELL_BEMERKUNG_2 = 46;
    public static final int CELL_BERUF_1 = 48;
    public static final int CELL_BERUF_2 = 47;
    public static final int CELL_NOTFALLKONTAKT = 50;
    public static final int CELL_VORSTAND = 51;
    public static final int CELL_EHRENAMT = 53;


    public static void main(String[] args) throws IOException, LDAPException, GeneralSecurityException {
        /*
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

        connection.bind("uid=IanPoesse,ou=users,dc=ldap-provider,dc=fablab-luebeck", "abc");
        */


        File excelFile = new File("/home/ian/Dokumente/FabLab/180616_mitgliederverwaltung-data.xlsx");
        FileInputStream fis = new FileInputStream(excelFile);

        XSSFWorkbook workbook = new XSSFWorkbook(fis);
        XSSFSheet sheet = workbook.getSheetAt(0);

        Iterator<Row> rowIterator = sheet.iterator();

        while (rowIterator.hasNext()) {
            Row row = rowIterator.next();

            Iterator<Cell> cellIterator = row.cellIterator();

            while (cellIterator.hasNext()) {
                Cell cell = cellIterator.next();
                System.out.print(cell.toString()+";");
            }

            System.out.println();
        }

        workbook.close();
        fis.close();
    }
}
