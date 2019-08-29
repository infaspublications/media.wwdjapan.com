'use strict'

const AWS = require('aws-sdk')
const S3 = new AWS.S3({
  signatureVersion: 'v4'
})
const Sharp = require('sharp')

// set the S3 endpoints
const BUCKET = process.env.BUCKET
const MAX_LENGTH = 1600

exports.handler = async (event, context, callback) => {
  try {
    const w =
      event.queryStringParameters && event.queryStringParameters.w
        ? event.queryStringParameters.w
        : false
    const path =
      event.pathParameters && event.pathParameters.filename
        ? decodeURIComponent(event.pathParameters.filename)
        : false
    if (!w) {
      let originalBuffer
      try {
        const image = await S3.getObject({ Bucket: BUCKET, Key: path }).promise()
        originalBuffer = image.Body
      } catch (error) {
        let prefix, originalKey, match, requiredFormat, imageName
        try {
          match = path.match(/(.*)\/webp\/(.*)/)
          prefix = match[1]
          imageName = match[2]
          originalKey = prefix + '/' + imageName
        } catch (err) {
          match = path.match(/webp\/(.*)/)
          imageName = match[1]
          originalKey = imageName
        }

        const originalImage = await S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise()
        originalBuffer = await Sharp(originalImage.Body)
          .toFormat('webp')
          .toBuffer()
        S3.putObject({
          Body: originalBuffer,
          Bucket: BUCKET,
          ContentType: 'image/' + requiredFormat,
          CacheControl: 'max-age=31536000',
          Key: path,
          StorageClass: 'STANDARD'
        }).promise()
      }

      const metadata = await Sharp(originalBuffer).metadata()
      if (metadata.width > MAX_LENGTH) {
        const resizedBuffer = await Sharp(originalBuffer)
          .resize(MAX_LENGTH, null)
          .toBuffer()
        S3.putObject({
          Body: resizedBuffer,
          Bucket: BUCKET,
          ContentType: 'image/' + metadata.format,
          CacheControl: 'max-age=31536000',
          Key: path,
          StorageClass: 'STANDARD'
        }).promise()
        callback(null, {
          statusCode: 200,
          headers: {
            'Content-Type': 'image/' + metadata.format,
            'Cache-Control': 'max-age=31536000'
          },
          body: resizedBuffer.toString('base64'),
          isBase64Encoded: true
        })
      } else {
        callback(null, {
          statusCode: 200,
          headers: {
            'Content-Type': 'image/' + metadata.format,
            'Cache-Control': 'max-age=31536000'
          },
          body: originalBuffer.toString('base64'),
          isBase64Encoded: true
        })
      }
    } else {
      try {
        const image = await S3.getObject({ Bucket: BUCKET, Key: path }).promise()
        callback(null, {
          statusCode: 200,
          headers: {
            'Content-Type': image.ContentType,
            'Cache-Control': 'max-age=31536000'
          },
          body: image.Body.toString('base64'),
          isBase64Encoded: true
        })
      } catch (error) {
        let prefix, originalKey, match, width, requiredFormat, imageName

        try {
          match = path.match(/(.*)\/(\d+)\/(.*)\/(.*)/)
          prefix = match[1]
          width = parseInt(match[2], 10)

          // correction for jpg required for 'Sharp'
          requiredFormat = match[3] == 'jpg' ? 'jpeg' : match[3]
          imageName = match[4]
          originalKey = prefix + '/' + imageName
        } catch (err) {
          match = path.match(/(\d+)\/(.*)\/(.*)/)
          width = parseInt(match[1], 10)

          // correction for jpg required for 'Sharp'
          requiredFormat = match[2] == 'jpg' ? 'jpeg' : match[2]
          imageName = match[3]
          originalKey = imageName
        }

        const originalImage = await S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise()
        let resizedBuffer
        try {
          resizedBuffer = await Sharp(originalImage.Body)
            .resize(width, null)
            .toFormat(requiredFormat)
            .toBuffer()
          S3.putObject({
            Body: resizedBuffer,
            Bucket: BUCKET,
            ContentType: 'image/' + requiredFormat,
            CacheControl: 'max-age=31536000',
            Key: path,
            StorageClass: 'STANDARD'
          }).promise()
          callback(null, {
            statusCode: 200,
            headers: {
              'Content-Type': 'image/' + requiredFormat,
              'Cache-Control': 'max-age=31536000'
            },
            body: resizedBuffer.toString('base64'),
            isBase64Encoded: true
          })
        } catch (err) {
          callback(null, {
            statusCode: 200,
            headers: {
              'Content-Type': 'image/' + requiredFormat,
              'Cache-Control': 'max-age=31536000'
            },
            body: originalImage.Body.toString('base64'),
            isBase64Encoded: true
          })
        }
      }
    }
  } catch (error) {
    try {
      const file = await S3.getObject({
        Bucket: BUCKET,
        Key: decodeURIComponent(event.pathParameters.filename.replace(/^webp\//g, ''))
      }).promise()

      callback(null, {
        statusCode: 200,
        headers: {
          'Content-Type': file.ContentType,
          'Cache-Control': 'max-age=31536000'
        },
        body: file.Body.toString('base64'),
        isBase64Encoded: true
      })
    } catch (err) {
      callback(null, {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Not found' })
      })
    }
  }
}
