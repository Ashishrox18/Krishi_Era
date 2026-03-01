import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDBService {
  async put(tableName: string, item: any) {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    return await docClient.send(command);
  }

  async get(tableName: string, key: any) {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });
    const response = await docClient.send(command);
    return response.Item;
  }

  async query(tableName: string, keyConditionExpression: string, expressionAttributeValues: any) {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }

  async update(tableName: string, key: any, updateExpression: string, expressionAttributeValues: any) {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });
    const response = await docClient.send(command);
    return response.Attributes;
  }

  async delete(tableName: string, key: any) {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    return await docClient.send(command);
  }

  async scan(tableName: string, filterExpression?: string, expressionAttributeValues?: any, expressionAttributeNames?: any) {
    const params: any = {
      TableName: tableName,
    };
    
    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }
    if (expressionAttributeValues) {
      params.ExpressionAttributeValues = expressionAttributeValues;
    }
    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    const command = new ScanCommand(params);
    const response = await docClient.send(command);
    return response.Items || [];
  }
}

export const dynamoDBService = new DynamoDBService();
