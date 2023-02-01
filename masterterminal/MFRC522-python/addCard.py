import pymysql


serial_no = input("RIFD card serial number ?")
user_id = input("user name?")

# put serial_no uppercase just in case
serial_no = serial_no.upper()

# open an sql session

sql_con = pymysql.connect(host='localhost', user='rfidreader',
                          passwd='password', db='rfidcardsdb')
sqlcursor = sql_con.cursor()


# first thing is to check if the card exist

sql_request = 'SELECT card_id,serial_no,user_id,valid' + \
              ' FROM cards  WHERE serial_no = "' + serial_no + '"'

count = sqlcursor.execute(sql_request)

if count > 0:
    print("Error! RFID card {} already in database".format(serial_no))
    T = sqlcursor.fetchone()
    print(T)
else:
    sql_insert = 'INSERT INTO cards (serial_no,user_id,valid) ' + \
                 'values("{}","{}","1")'.format(serial_no, user_id)
    count = sqlcursor.execute(sql_insert)
    if count > 0:
        sql_con.commit()
        # let's check it  just in case
        count = sqlcursor.execute(sql_request)
        if count > 0:
            print("RFID card {} inserted to database".format(serial_no))
            T = sqlcursor.fetchone()
            print(T)
    if count == 0:
        print("Error! RFID card {} not inserted to database! ".format(
               serial_no))

