import serverless from 'serverless-http';
import app from './app.js';

export const handler = serverless(app, {
  request: {
    rawBody: false, // default is false, keep this
    body: 'body',
    headers: 'headers',
    method: 'httpMethod',
    path: 'path',
    requestContext: 'requestContext',
    query: 'queryStringParameters'
  }
});
