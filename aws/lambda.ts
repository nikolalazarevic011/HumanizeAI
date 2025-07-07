import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import app from '../backend/src/app';

// Create the server outside the handler to benefit from container reuse
const server = createServer(app);

export const handler = (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Lambda event:', JSON.stringify(event, null, 2));
  
  // Set context to not wait for the event loop to be empty
  context.callbackWaitsForEmptyEventLoop = false;
  
  return proxy(server, event, context, 'PROMISE').promise;
};
