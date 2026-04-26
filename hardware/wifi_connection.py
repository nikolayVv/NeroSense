import socket
import time

HOST = "192.168.4.1"
PORT = 5000

def get_data():
    try:
        s = socket.socket()
        s.settimeout(3)
        s.connect((HOST, PORT))

        data = s.recv(1024).decode().strip()
        s.close()

        return data

    except Exception as e:
        return f"ERROR: {e}"

# Run once
print(get_data())

# Then loop every 5 seconds
while True:
    time.sleep(5)
    print(get_data())