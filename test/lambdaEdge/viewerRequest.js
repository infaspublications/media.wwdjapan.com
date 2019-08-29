'use strict'
const expect = require('chai').expect
const { handler } = require('../../lambdaEdge/viewerRequest')

describe('#viewerRequest()', () => {
  beforeEach(() => {})
  it('should convert webp and size uri if the request has w parameter from webp supported browser', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/webp,image/apng,image/*,*/*;q=0.8'
                  }
                ]
              },
              method: 'GET',
              querystring: 'w=750',
              uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.jpg'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
          ]
        },
        method: 'GET',
        querystring: 'w=750',
        uri: '/wp-content/uploads/2019/03/11145930/750/webp/190311_CDG_og_03.jpg'
      })
    })
  })

  it('should convert size uri if the request has w parameter from webp not supported browser', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5'
                  }
                ]
              },
              method: 'GET',
              querystring: 'w=750',
              uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.jpg'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5'
            }
          ]
        },
        method: 'GET',
        querystring: 'w=750',
        uri: '/wp-content/uploads/2019/03/11145930/750/jpg/190311_CDG_og_03.jpg'
      })
    })
  })

  it('should not convert uri if the object is gif', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/webp,image/apng,image/*,*/*;q=0.8'
                  }
                ]
              },
              method: 'GET',
              querystring: 'w=750',
              uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.gif'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
          ]
        },
        method: 'GET',
        querystring: 'w=750',
        uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.gif'
      })
    })
  })

  it('should convert webp uri if the request do not has w parameter from webp supported browser', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/webp,image/apng,image/*,*/*;q=0.8'
                  }
                ]
              },
              method: 'GET',
              querystring: '',
              uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.jpg'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
          ]
        },
        method: 'GET',
        querystring: '',
        uri: '/wp-content/uploads/2019/03/11145930/webp/190311_CDG_og_03.jpg'
      })
    })
  })

  it('should not convert uri if the request do not has w parameter from webp not supported browser', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5'
                  }
                ]
              },
              method: 'GET',
              querystring: '',
              uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.jpg'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5'
            }
          ]
        },
        method: 'GET',
        querystring: '',
        uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.jpg'
      })
    })
  })

  it('should convert default(750) demension size if the request has not supported size', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/webp,image/apng,image/*,*/*;q=0.8'
                  }
                ]
              },
              method: 'GET',
              querystring: 'w=492',
              uri: '/wp-content/uploads/2019/03/11145930/190311_CDG_og_03.jpg'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
          ]
        },
        method: 'GET',
        querystring: 'w=492',
        uri: '/wp-content/uploads/2019/03/11145930/750/webp/190311_CDG_og_03.jpg'
      })
    })
  })

  it('should return default request if the request can not be parsed', () => {
    const event = {
      Records: [
        {
          cf: {
            request: {
              headers: {
                accept: [
                  {
                    key: 'accept',
                    value: 'image/webp,image/apng,image/*,*/*;q=0.8'
                  }
                ]
              },
              method: 'GET',
              querystring: '',
              uri: '/sxasaxsaxsaxsaxsas'
            }
          }
        }
      ]
    }
    handler(event, {}, (error, request) => {
      expect(request).to.deep.equal({
        headers: {
          accept: [
            {
              key: 'accept',
              value: 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
          ]
        },
        method: 'GET',
        querystring: '',
        uri: '/sxasaxsaxsaxsaxsas'
      })
    })
  })
})
