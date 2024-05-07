package main

import (
	"example.com/echo_server"
)

func main() {
	// ch := make(chan bool)
	// go echo_server.ServerParallel(ch)

	// if <-ch {
	// 	echo_client.Client()
	// }

	echo_server.Server()
	// grpcurl -plaintext -d '{"message":"Hello"}' localhost:50051 echo.EchoService/Echo
}
