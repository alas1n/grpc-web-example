# gRPC with golang server and browser client without a proxy(envoy)

This is a simple example of a gRPC server written in golang and a browser client written in javascript.

In this example we carate a simple `echo` service with golang that returns the same message that it receives.

Browser client is written in javascript and uses the `grpc-web` library to communicate with the gRPC server.

## Create a Protobuf file

First we need to create a protobuf file that defines the service and messages that we are going to use.([What is Protobuf](https://protobuf.dev/overview/))

Create a file called `echo.proto` with the following content:

```protobuf
syntax = "proto3"; // this is the version of the protobuf syntax

option go_package = "example.com/proto"; // this is the go package that will be generated we need this for golang


package echo; // this is the package name that will be used in the generated code

// this is the message that we are going to use to send the message to the server
message EchoRequest {
  string message = 1;
}
// this is the message that we are going to use to receive the message from the server
message EchoResponse {
  string message = 1;
}

// this is the service that we are going to use to send the message to the server
service EchoService {
  rpc Echo(EchoRequest) returns (EchoResponse);
}
```

## Generate the golang protobuf code

Now we need to generate the golang code from the protobuf file.

we will use the `protoc` tool to generate the code.

1. We need to install the `protoc` tool, you can download it from [here](https://github.com/protocolbuffers/protobuf?tab=readme-ov-file)
2. We need to install the `protoc-gen-go` plugin, you can install it by running the following command:

   ```bash
   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
   ```

3. We need to install the `protoc-gen-go-grpc` plugin, you can install it by running the following command:

   ```bash
   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
   ```

4. install the `protoc-gen-grpc-gateway` plugin, you can install it by running the following command:

   ```bash
   go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
   ```

now we can generate the code by running the following command:

```bash
protoc --go_out=. --go_opt=paths=source_relative \
 --go-grpc_out=. --go-grpc_opt=paths=source_relative \
 --grpc-gateway_out=. --grpc-gateway_opt=logtostderr=true,paths=source_relative \
 echo.proto
```

this will generate the following files:

- `echo.pb.go`
- `echo_grpc.pb.go`

## Golang server

Now we can create the golang server that implements the `EchoService` service.

Create a file called `main.go` with the following content:

```go
package main

import (
 "context"
 "flag"
 "fmt"
 "log"
 "net"
 "net/http"

 pb "example.com/proto"
 "github.com/improbable-eng/grpc-web/go/grpcweb"
 "google.golang.org/grpc"
)

var (
 port = flag.Int("port", 50051, "The server port")
)

// server is used to implement echoServer.
type server struct {
 pb.UnimplementedEchoServiceServer
}

// Echo implements echoServer
func (s *server) Echo(ctx context.Context, in *pb.EchoRequest) (*pb.EchoResponse, error) {
 log.Printf("Server Received -> %v", in.GetMessage())
 return &pb.EchoResponse{Message: in.GetMessage()}, nil
}

func Server() {
 flag.Parse()
 lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
 if err != nil {
  log.Fatalf("failed to listen: %v", err)
 }
 s := grpc.NewServer()
 pb.RegisterEchoServiceServer(s, &server{})
 log.Printf("server listening at %v", lis.Addr())

 go func() {
  log.Fatalf("failed to serve: %v", s.Serve(lis))
 }()

 // gRPC web code
 grpcWebServer := grpcweb.WrapServer(
  s,
  // Enable CORS
  grpcweb.WithOriginFunc(func(origin string) bool { return true }),
 )

 srv := &http.Server{
  Handler: grpcWebServer,
  Addr:    fmt.Sprintf("localhost:%d", *port+1),
 }

 log.Printf("http server listening at %v", srv.Addr)

 if err := srv.ListenAndServe(); err != nil {
  log.Fatalf("failed to serve: %v", err)
 }

}
```

We created a function called `Echo` that implements the `Echo` method of the `EchoService` service.

>note that we are using the `grpcweb.WrapServer` function to wrap the gRPC server so that it can be used by the browser client. this will fix the CORS issue. and we are going to run the gRPC server on port `50051` and the http server on port `50052`. we will use the http server to communicate with the browser client.

## Create javascript protobuf files

Now we can create the javascript client that will communicate with the gRPC server.

First we need to create proto file for the client.

1. We need `protec` which we downloaded before.
2. We need to install `protoc-gen-grpc-web` witch is a plugin for `protoc` that generates the javascript code for the client.[here](https://github.com/grpc/grpc-web?tab=readme-ov-file#3-install-grpc-web-code-generator) for mac os you can install it by running the following command:

   ```bash
   brew install protoc-gen-grpc-web
   ```

3. Now we can generate the javascript code by running the following command:

   ```bash
   protoc -I=. echo.proto \
    --js_out=import_style=commonjs:.

   protoc -I=./ echo.proto \
    --js_out=import_style=commonjs:. \
    --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
   ```

this will generate the following files:

- `echo_pb.js`
- `echo_grpc_web_pb.js`

## Javascript client

Now we can create the javascript client that communicates with the gRPC server.

Create a file called `client.js` with the following content:

```javascript
const { EchoRequest } = require("./proto/echo_pb.js");
const { EchoServiceClient } = require("./proto/echo_grpc_web_pb.js");

var client = new EchoServiceClient("http://localhost:50052", null, null);

const request = new EchoRequest();
request.setMessage("message from client");
client.echo(request, {}, (err, response) => {
   if (err) {
   console.log(
      `Unexpected error for sayHello: code = ${err.code}` +
         `, message = "${err.message}"`
   );
   } else {
   const message = response.getMessage();
   showResponse(message);
   }
});
```

> note that we are using `50052` port to communicate with the gRPC server.
