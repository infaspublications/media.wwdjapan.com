'use strict'

const querystring = require('querystring')

// defines the allowed dimensions, default dimensions and how much variance from allowed
// dimension is allowed.

const variables = {
  allowedDimension: [{ w: 750 }, { w: 200 }, { w: 375 }, { w: 600 }, { w: 176 }, { w: 280 }],
  defaultDimension: { w: 750 },
  webpExtension: 'webp'
}

exports.handler = (event, context, callback) => {
  try {
    const request = event.Records[0].cf.request
    const headers = request.headers
    const url = []

    // parse the querystrings key-value pairs. In our case it would be d=100x100
    const params = querystring.parse(request.querystring)

    // fetch the uri of original image
    let fwdUri = request.uri

    // parse the prefix, image name and extension from the uri.
    // In our case /images/image.jpg
    const match = fwdUri.match(/(.*)\/(.*)\.(.*)/)

    const prefix = match[1]
    const imageName = match[2]
    const extension = match[3]

    if (extension === 'gif') {
      callback(null, request)
      return
    }

    // read the accept header to determine if webP is supported.
    const accept = headers['accept'] ? headers['accept'][0].value : ''

    // if there is no dimension attribute, just pass the request
    if (!params.w) {
      if (accept.includes(variables.webpExtension)) {
        url.push(prefix)
        url.push(variables.webpExtension)
        url.push(imageName + '.' + extension)
        fwdUri = url.join('/')

        // final modified url is of format /webp/image.jpg
        request.uri = fwdUri
      }
      callback(null, request)
      return
    }

    // set the width parameters
    let width = params.w

    // define variable to be set to true if requested dimension is allowed.
    let matchFound = false
    for (const dimension of variables.allowedDimension) {
      if (parseInt(width, 10) === dimension.w) {
        matchFound = true
        break
      }
    }
    // if no match is found from allowed dimension with variance then set to default
    //dimensions.
    if (!matchFound) {
      width = variables.defaultDimension.w
    }

    // build the new uri to be forwarded upstream
    url.push(prefix)
    url.push(width)

    // check support for webp
    if (accept.includes(variables.webpExtension)) {
      url.push(variables.webpExtension)
    } else {
      url.push(extension)
    }
    url.push(imageName + '.' + extension)

    fwdUri = url.join('/')

    // final modified url is of format /images/200/webp/image.jpg
    request.uri = fwdUri
    callback(null, request)
  } catch (error) {
    callback(null, event.Records[0].cf.request)
  }
}
