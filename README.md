# Growth Lab Inc - Upload System


Build a lambda function in NodeJS that has an API using API Gateway. It takes a file as input, encrypts the file using a Public Key, saves it to S3, and then returns a 200 Status with the Files URL.


<b>1 - Create API Gateway (HTTP)</b> <br />
![image](https://user-images.githubusercontent.com/63565773/155828571-53c4ec0b-86c8-4603-80ae-ef211c292f94.png)

Put a name  <br />
![image](https://user-images.githubusercontent.com/63565773/155828579-d4eb7daa-4ae9-4124-a62f-919aa5a74412.png)

Leave all the rest default and create  <br />
![image](https://user-images.githubusercontent.com/63565773/155828588-bdee9e92-1cb2-490c-a315-4df98d353281.png)

<b>2 - Create S3 Bucket</b> <br />
Put a name and allow public access  <br />
![image](https://user-images.githubusercontent.com/63565773/155828597-0ddc7280-4a6e-4ca6-b664-d86881694ca6.png)

Enable default encryption and select SSE-S3 option so aws can manage the encryption key for you.  <br />
![image](https://user-images.githubusercontent.com/63565773/155828604-b310a672-7639-471e-85fb-70bfe39aaeff.png)
 <br />
Create bucket

<b>4 - Create DynamoDB Table (LookUp) </b> <br />
![image](https://user-images.githubusercontent.com/63565773/155828611-ffe159bb-e4a8-4805-b32a-5f211102f37f.png)

Leave all the rest default and create

<b>5 - Create the both Lambda of this folder </b> <br />

Polices:

<b>5.1 - get-file lambda</b> <br />
this lambda role must have these polices: <br />
5.1.1 - s3 access <br />
        
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "VisualEditor0",
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObjectAcl",
                        "s3:GetObject",
                        "s3:GetObjectVersionAcl",
                        "s3:GetObjectVersionAttributes",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": "arn:aws:s3:::<your bucket name>/*"
                }
            ]
        }
     
<br />
5.1.2 - dynamodb access <br />
    
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "VisualEditor0",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:Scan",
                        "dynamodb:Query"
                    ],
                    "Resource": "arn:aws:dynamodb:*:<your user iam number>:table/*"
                },
                {
                    "Sid": "VisualEditor1",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Scan",
                        "dynamodb:Query"
                    ],
                    "Resource": "arn:aws:dynamodb:us-east-1:<your user iam number>:table/LookUp/index/*"
                }
            ]
        }
<br />
<b>5.2 - upload-gl lambda (make sure it has the node_modules dependencies) </b> <br />
this lambda role must have these polices: <br />
5.2.1 - s3 access <br />
        
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "VisualEditor0",
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObjectAcl",
                        "s3:GetObject",
                        "s3:ListBucket",
                        "s3:DeleteObject",
                        "s3:GetBucketAcl"
                    ],
                    "Resource": [
                        "arn:aws:s3:::growth-lab-files",
                        "arn:aws:s3:::*/*"
                    ]
                }
            ]
        }
<br />
5.2.2 - dynamodb access <br />
        
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "VisualEditor0",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Scan",
                        "dynamodb:Query"
                    ],
                    "Resource": "arn:aws:dynamodb:us-east-1:603113125842:table/LookUp/index/*"
                },
                {
                    "Sid": "VisualEditor1",
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Scan",
                        "dynamodb:Query",
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": "arn:aws:dynamodb:*:603113125842:table/*"
                },
                {
                    "Sid": "VisualEditor2",
                    "Effect": "Allow",
                    "Action": "dynamodb:ListTables",
                    "Resource": "*"
                }
            ]
        }
        
<br />

<b>6 - Attach the lambdas to the API Gateway</b>
![image](https://user-images.githubusercontent.com/63565773/155828838-15b281d8-04a9-40c4-9d3b-7e5ec439380a.png)

### API Call Example
```
[POST] https://<your api url>/upload
[BODY] 
 {
  "fileName": "mytext",
  "base64": "data:text/plain;base64,YXNkc3NhZHNhZGQgYXNkIGFzZHMgYQ=="
 }
 
[RESPONSE]
{
  "Item": {
    "_id": "05eea8d1-a9fb-4ec3-bb62-5d3d2554bfac",
    "fileName": "myimage",
    "mimeType": "png",
    "contentType": "image/png",
    "encrypted": true,
    "createdAt": "2022-02-26T03:55:20.411Z"
  }
}

-----------------------------

[GET] https://<your api url>/file/<file id>

[RESPONSE]
{
  "data": {
    "fileName": "mytext",
    "mimeType": "txt",
    "_id": "68011579-299a-4a9c-98d5-f863ce3a39e0",
    "createdAt": "2022-02-26T04:40:47.114Z",
    "encrypted": true,
    "contentType": "text/plain",
    "url": "https://growth-lab-files.s3.amazonaws.com/68011579-299a-4a9c-98d5-f863ce3a39e0.txt"
  },
  "obj": {
    "AcceptRanges": "bytes",
    "LastModified": "2022-02-26T04:40:47.000Z",
    "ContentLength": 22,
    "ETag": "\"dd479fd5fee236b72d83fc0271bec27a\"",
    "ContentType": "text/plain",
    "ServerSideEncryption": "AES256",
    "Metadata": {},
    "Body": {
      "type": "Buffer",
      "data": [
        97,
        115,
        100,
        115,
        115,
        97,
        100,
        115,
        97,
        100,
        100,
        32,
        97,
        115,
        100,
        32,
        97,
        115,
        100,
        115,
        32,
        97
      ]
    }
  }
}
```


