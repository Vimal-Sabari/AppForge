import http from 'http'

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 2000,
}

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`)
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`)
  })
})

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`)
})

req.on('timeout', () => {
  console.error('request timed out')
  req.destroy()
})

req.end()
