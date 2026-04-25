import socket

HOST = "192.168.4.1"
PORT = 5000

s = socket.socket()
s.connect((HOST, PORT))

s.sendall(b"GET_GPS\n")

response = s.recv(1024).decode().strip()
print(response)

s.close()
