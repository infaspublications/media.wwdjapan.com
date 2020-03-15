'use strict'

const _ = require('lodash')
const yaml = require('js-yaml')
const fs = require('fs')
const execSync = require('child_process').execSync
const aws = require('aws-sdk')
const s3 = new aws.S3()

const region = 'ap-northeast-1'
const cloudformation = new aws.CloudFormation({ region })

function getApiGatewayEndpoint(outputs) {
  return outputs.ServiceEndpoint.match(/https:\/\/.+\.execute-api\..+\.amazonaws\.com.+/)[0]
}

async function getStackOutputs(stackName) {
  const result = await cloudformation.describeStacks({ StackName: stackName }).promise()
  const stack = result.Stacks[0]

  const keys = stack.Outputs.map((x) => x.OutputKey)
  const values = stack.Outputs.map((x) => x.OutputValue)

  return _.zipObject(keys, values)
}

async function putS3Object(bucket, key, file) {
  var body = fs.readFileSync(file)

  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: body,
      ACL: 'public-read'
    })
    .promise()
}

async function deleteS3Object(bucket, key) {
  await s3
    .deleteObject({
      Bucket: bucket,
      Key: key
    })
    .promise()
}

function deployService(stage, service) {
  const args = {
    stdio: 'inherit'
  }

  if (process.env.CIRCLE_WORKING_DIRECTORY) {
    args['cwd'] = process.env.CIRCLE_WORKING_DIRECTORY
  }

  execSync(`npm run deploy:${service} -- --stage ${stage}`, args)
}

function removeService(stage, service) {
  const args = {
    stdio: 'inherit'
  }

  if (process.env.CIRCLE_WORKING_DIRECTORY) {
    args['cwd'] = process.env.CIRCLE_WORKING_DIRECTORY
  }

  execSync(`npm run remove:${service} -- --stage ${stage}`, args)
}

async function deployWithRandomStage(service, configPath) {
  const serviceName = yaml.safeLoad(fs.readFileSync(configPath)).service
  const stage = Math.random()
    .toString(32)
    .substring(2)
  const stackName = `${serviceName}-${stage}`
  deployService(stage, service)
  const outputs = await getStackOutputs(stackName)
  const endpoint = getApiGatewayEndpoint(outputs)

  return { stackName, stage, outputs, endpoint, region }
}

module.exports = {
  deployService,
  removeService,
  deployWithRandomStage,
  deleteS3Object,
  putS3Object
}
