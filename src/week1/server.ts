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
        response.end(`<html maaa=a>
        <head>
            <style>
                body div #myid {
                  width: 100px;
                  background-color: #ff5000;
                }
                body div img {
                  width: 30px;
                  background-color: #ff1111;
                }
            </style>
        </head>
        <body>
            <div>
              <img id="myid"/>
              <img />
            </div>
        </body>
        </html>`)
      })
  })
  .listen(8080)
