import http from 'http'

http
  .createServer((request, response) => {
    let body: Buffer[] = []
    request
      .on('error', (err) => {
        console.log(err)
      })

      .on('data', (chunk: Buffer) => {
        body.push(chunk)
      })

      .on('end', () => {
        const temp = Buffer.concat(body).toString()

        console.log('body: ', temp)
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end('Hello world \n')
      })
  })
  .listen(8080)
