'use strict'
const expect = require('chai').expect
const Sharp = require('sharp')
const fetch = require('node-fetch')
const { deployWithRandomStage, removeService, putS3Object, deleteS3Object } = require('./../setup')

describe('#originResponse()', () => {
  let endpoint
  let stage
  const configPath = 'originResponse/serverless.yml'
  const service = 'origin'
  const bucket = process.env.TEST_BUCKET

  before(async () => {
    const result = await deployWithRandomStage(service, configPath)
    stage = result.stage
    endpoint = result.endpoint
    await putS3Object(bucket, `${stage}/150x150.png`, 'test/originResponse/materials/150x150.png')
    await putS3Object(
      bucket,
      `${stage}/2000x2000.png`,
      'test/originResponse/materials/2000x2000.png'
    )
    await putS3Object(bucket, `${stage}/robots.txt`, 'test/originResponse/materials/robots.txt')
  })
  it('should return an uploaded file if the size is less than 1600', async () => {
    const testEndpoint = `${endpoint}/${stage}/150x150.png`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const metadata = await Sharp(new Buffer(await response.text(), 'base64')).metadata()
    expect(metadata.format).to.be.equal('png')
    expect(metadata.width).to.be.equal(150)
    expect(metadata.height).to.be.equal(150)
  })

  it('should return an resized file if the size is over 1600', async () => {
    const testEndpoint = `${endpoint}/${stage}/2000x2000.png`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const metadata = await Sharp(new Buffer(await response.text(), 'base64')).metadata()
    expect(metadata.format).to.be.equal('png')
    expect(metadata.width).to.be.equal(1600)
  })

  it('should return an webp file if the path contain a webp', async () => {
    const testEndpoint = `${endpoint}/${stage}/webp/150x150.png`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const metadata = await Sharp(new Buffer(await response.text(), 'base64')).metadata()
    expect(metadata.format).to.be.equal('webp')
    expect(metadata.width).to.be.equal(150)
    expect(metadata.height).to.be.equal(150)
  })

  it('should return a resized webp file if the size is less than 1600', async () => {
    const testEndpoint = `${endpoint}/${stage}/webp/2000x2000.png`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const metadata = await Sharp(new Buffer(await response.text(), 'base64')).metadata()
    expect(metadata.format).to.be.equal('webp')
    expect(metadata.width).to.be.equal(1600)
  })

  it('should return a resized file if the path contain size', async () => {
    const testEndpoint = `${endpoint}/${stage}/30/png/150x150.png?w=30`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const metadata = await Sharp(new Buffer(await response.text(), 'base64')).metadata()
    expect(metadata.format).to.be.equal('png')
    expect(metadata.width).to.be.equal(30)
  })

  it('should return a resized webp file if the path contain a size and webp', async () => {
    const testEndpoint = `${endpoint}/${stage}/20/webp/150x150.png?w=20`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const metadata = await Sharp(new Buffer(await response.text(), 'base64')).metadata()
    expect(metadata.format).to.be.equal('webp')
    expect(metadata.width).to.be.equal(20)
  })

  it('should return an original file if the path is not image', async () => {
    const testEndpoint = `${endpoint}/webp/${stage}/robots.txt`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    const text = new Buffer(await response.text(), 'base64')
    expect(text.toString('utf-8')).to.be.equal('robots\n')
  })

  it('should return 404 if the request is non-existing object', async () => {
    const testEndpoint = `${endpoint}/${stage}/sxacadscdsaxsaxsacsa`

    const response = await fetch(testEndpoint, {
      method: 'GET'
    })
    expect(response.status).to.be.equal(404)
  })

  after(() => {
    deleteS3Object(bucket, `${stage}/2000x2000.png`)
    deleteS3Object(bucket, `${stage}/150x150.png`)
    deleteS3Object(bucket, `${stage}/webp/2000x2000.png`)
    deleteS3Object(bucket, `${stage}/webp/150x150.png`)
    deleteS3Object(bucket, `${stage}/30/png/150x150.png`)
    deleteS3Object(bucket, `${stage}/20/webp/150x150.png`)
    deleteS3Object(bucket, `${stage}/robots.txt`)
    removeService(stage, service, configPath)
  })
})
