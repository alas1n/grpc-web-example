protoc -I=. echo.proto \
    --js_out=import_style=commonjs:.

protoc -I=./ echo.proto \
    --js_out=import_style=commonjs:. \
    --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
