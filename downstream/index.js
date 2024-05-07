/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const { EchoRequest } = require("./proto/echo_pb.js");
const { EchoServiceClient } = require("./proto/echo_grpc_web_pb.js");

var client = new EchoServiceClient("http://localhost:50052", null, null);

const form = document.getElementById("form");
const response = document.getElementById("response");

const showResponse = (message) => {
  response.innerHTML = message;
};

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const data = new FormData(form);
  const message = data.get("message");
  console.log("message send from browser", message);
  const request = new EchoRequest();
  request.setMessage(message);
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
});
