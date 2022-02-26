const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// const kms = new AWS.KMS({apiVersion: '2014-11-01'});

const S3_BUCKET = 'growth-lab-files'
const DYNAMO_TABLE = 'LookUp'

const formatRequest = event => {
  return {
    method: event.requestContext?.http?.method,
    query: event.queryStringParameters || {},
    params: event.pathParameters || {},
    body: event.body ? JSON.parse(event.body) : {}
  };
};


exports.handler = async (event) => {
    try {
        const { params: { id } } = formatRequest(event)

        const fileData = await dynamo.get({
            TableName: DYNAMO_TABLE,
            Key: {
                _id: id
            }
        }).promise()

        console.log({fileData})
        
        if(!fileData || Object.keys(fileData).length == 0 || fileData.Count == 0) throw new Error('File not found')

        const obj = await s3.getObject({
            Bucket: S3_BUCKET,
            Key: `${id}.${fileData.Item.mimeType}`
        }).promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: {
                    ...fileData.Item, 
                    url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileData.Item._id}.${fileData.Item.mimeType}`
                },
                obj
            })
        };
    } catch(error) {
        console.log(error)
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: error.message ? error.message : error
            })
        }
    }
};
