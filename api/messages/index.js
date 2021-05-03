// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

module.exports = async function (context, req) {
  context.log('Authorization', req.headers['Authorization']);
  context.log('x-ms-client-principal-name', req.headers['x-ms-client-principal-name']);

  return {
    "target": "newMessage",
    "arguments": [ req.body ]
  };
};