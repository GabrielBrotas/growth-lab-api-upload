const AWS = require('aws-sdk');
const {v4} = require('uuid');
const mime = require('mime-types');

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const DYNAMO_TABLE = 'LookUp'
const S3_BUCKET = 'growth-lab-bucket-files'

const formatRequest = event => {
  return {
    method: event.requestContext?.http?.method,
    query: event.queryStringParameters || {},
    params: event.pathParameters || {},
    body: event.body ? JSON.parse(event.body) : {}
  };
};

const validateBody = (data) => {
    const { fileName, base64 } = data
    const errors = {}
    
    if(!fileName) errors.fileName = "fileName is a required field"
    if(!base64) errors.base64 = "base64 is a required field"
    if(!String(base64).includes(base64)) errors.base64 = "base64 is not a valid base64, send with URI prefix"

    if(Object.keys(errors).length > 0) throw errors
    return
}

exports.handler = async (event) => {
    try {
        const { body } = formatRequest(event)

        validateBody(body)
        
        const { fileName, base64 } = body
    
        const onlyBase64Text = base64.split('base64,')[1];

        const buffer = new Buffer.from(onlyBase64Text, 'base64')
        
        const mimeType = mime.extension(base64.split(';')[0].split(':')[1]);

        const fullContentType = base64.split(';base64')[0].substr(5);

        const fileId = v4()

        await s3.upload({
            Bucket: S3_BUCKET,
            Key: `${fileId}.${mimeType}`,
            Body: buffer,
            ContentType: fullContentType,
            ServerSideEncryption: 'AES256',
        }).promise()
    
        const item = {
            _id: fileId,
            fileName,
            mimeType,
            contentType: fullContentType,
            encrypted: true,
            createdAt: new Date().toISOString()
        }

        await dynamo.put({
            TableName: DYNAMO_TABLE,
            Item: item,
        }).promise()
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                Item: item
            }),
        };
    } catch(error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: error.message ? error.message : error
            })
        }
    }
};
