import serial
import psycopg2
import time

arduino = serial.Serial('COM3', 9600)
time.sleep(2)

conn = psycopg2.connect(
    dbname="arduino_db",
    user="postgres",
    password="your_password",
    host="localhost",
    port="5432"
)

cursor = conn.cursor()

print("Reading Arduino data...")

while True:
    try:
        data = arduino.readline().decode().strip()
        print("Raw:", data)

        if data and data.isdigit():
            value = int(data)
            print("Received:", value)

            cursor.execute(
                "INSERT INTO sensor_data (value) VALUES (%s)",
                (value,)
            )
            conn.commit()

    except Exception as e:
        print("Error:", e)