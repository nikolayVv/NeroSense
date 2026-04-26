import serial
import psycopg2
import time
import socket

arduino = serial.Serial('COM5', 9600, timeout=1)
time.sleep(2)

conn = psycopg2.connect(
    dbname="db_name",
    user="user",
    password="password",
    host="localhost",
    port="5432"
)

cursor = conn.cursor()

HOST = "192.168.4.1"
PORT = 5000

print("Reading Arduino + GPS + Temperature data...")

last_gps_time = 0

while True:
    try:
        # ------------------------
        # READ SERIAL (ESP32)
        # ------------------------
        data = arduino.readline().decode(errors='ignore').strip()

        if data:
            print("Raw:", data)

            if data.startswith("DATA:"):
                try:
                    # Remove "DATA:" prefix
                    payload = data.replace("DATA:", "")

                    # Split into key=value pairs
                    parts = payload.split(";")
                    parsed = {}

                    for part in parts:
                        if "=" in part:
                            key, val = part.split("=", 1)
                            parsed[key] = val

                    # Extract values
                    sensor_id = int(parsed.get("ID", 0))
                    temperature = parsed.get("TEMP_C")
                    gps_fix = parsed.get("GPS_FIX")
                    lat = parsed.get("LAT")
                    lon = parsed.get("LON")

                    # Convert temperature safely
                    if temperature not in [None, ""]:
                        temperature = float(temperature)

                    print("Parsed:", parsed)

                    # ------------------------
                    # INSERT INTO DATABASE
                    # ------------------------
                    cursor.execute("""
                        INSERT INTO sensor_data (sensor_id, temperature, gps_fix, latitude, longitude)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        sensor_id,
                        temperature,
                        gps_fix,
                        lat,
                        lon
                    ))

                    conn.commit()

                except Exception as parse_error:
                    print("Parse Error:", parse_error)

        # ------------------------
        # OPTIONAL SOCKET GPS (if still needed)
        # ------------------------
        if time.time() - last_gps_time > 5:
            try:
                s = socket.socket()
                s.settimeout(2)
                s.connect((HOST, PORT))

                s.sendall(b"GET_GPS\n")
                response = s.recv(1024).decode().strip()

                print("Socket GPS:", response)

                s.close()

            except Exception as gps_error:
                print("GPS Error:", gps_error)

            last_gps_time = time.time()

    except Exception as e:
        print("Error:", e)