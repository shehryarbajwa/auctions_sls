import AWS from 'aws-sdk';
import commonMiddleware from './lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';
import getAuctionsSchema from './lib/schemas/getAuctionsSchema';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  let auctions;
  const { status } = event.queryStringParameters;
  //Query the DynamoDB table using the statusAndEndDate filter IndexName
  //Query will be performant due to the index and cheaper
  //We are just returning from the auction table whichever the body of the request contains

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  try {
    const result = await dynamoDB.query(params).promise();

    auctions = result.Items;
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions).use(
  validator({
    inputSchema: getAuctionsSchema,
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  })
);
