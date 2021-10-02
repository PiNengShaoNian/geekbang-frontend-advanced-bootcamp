import net from 'net'
import { parseHTML } from '../week2/parser'

type RequestOptions = {
  host: string
  method?: 'GET' | 'POST'
  port?: number
  path?: string
  body?: Record<string, string>
  headers?: Record<string, string | number>
}
class Request {
  method: 'GET' | 'POST' = 'GET'
  host: string
  port: number
  path: string
  body: Record<string, string>
  headers: Record<string, string | number>
  bodyText: string = ''

  constructor(options: RequestOptions) {
    this.method = options.method ?? 'GET'
    this.host = options.host
    this.port = options.port ?? 80
    this.body = options.body ?? {}
    this.headers = options.headers ?? {}
    this.path = options.path ?? '/'

    if (!this.headers['Content-Type']) {
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    if (this.headers['Content-Type'] === 'application/json') {
      this.bodyText = JSON.stringify(this.body)
    } else if (
      this.headers['Content-Type'] === 'application/x-www-form-urlencoded'
    ) {
      this.bodyText = Object.entries(this.headers)
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
    }

    this.headers['Content-Length'] = this.bodyText.length
  }

  toString(): string {
    return [
      `${this.method} ${this.path} HTTP/1.1`,
      ...Object.entries(this.headers).map(([key, val]) => `${key}: ${val}`),
      '\r\n' + this.bodyText,
    ].join('\r\n')
  }

  send(connection?: net.Socket): Promise<{
    statusCode: string
    statusText: string
    headers: Record<string, string | number>
    body: string
  }> {
    return new Promise((resolve, reject) => {
      const parser = new ResponseParser()

      if (connection) {
        connection.write(this.toString())
      } else {
        connection = net.createConnection(
          {
            host: this.host,
            port: this.port,
          },
          () => {
            connection?.write(this.toString())
          }
        )
      }

      connection.on('data', (data) => {
        parser.receive(data.toString())

        if (parser.isFinished) {
          resolve(parser.response)
        }

        connection?.end()
      })

      connection.on('error', (err) => {
        reject(err)
        connection?.end()
      })
    })
  }
}

class ResponseParser {
  WAITING_STATUS_LINE = 0
  WAITING_STATUS_LINE_END = 1
  WAITING_HEADER_NAME = 2
  WAITING_HEADER_SPACE = 3
  WAITING_HEADER_VALUE = 4
  WAITING_HEADER_LINE_END = 5
  WAITING_HEADER_BLOCK_END = 6
  WAITING_BODY = 7

  current = this.WAITING_STATUS_LINE
  statusLine = ''
  headers: Record<string, string | number> = {}
  headerName: string = ''
  headerValue = ''
  bodyParser: null | TrunkedBodyParser = null

  get isFinished(): boolean {
    return this.bodyParser?.isFinished ?? false
  }

  get response() {
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/)
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      headers: this.headers,
      body: this.bodyParser?.content.join('') ?? '',
    }
  }

  receive(string: string): void {
    for (let i = 0; i < string.length; ++i) {
      this.receiveChar(string[i])
    }
  }

  receiveChar(char: string) {
    switch (this.current) {
      case this.WAITING_STATUS_LINE:
        if (char === '\r') {
          this.current = this.WAITING_STATUS_LINE_END
        } else {
          this.statusLine += char
        }
        break
      case this.WAITING_STATUS_LINE_END:
        if (char === '\n') {
          this.current = this.WAITING_HEADER_NAME
        }
        break
      case this.WAITING_HEADER_NAME:
        if (char === ':') {
          this.current = this.WAITING_HEADER_SPACE
        } else if (char === '\r') {
          this.current = this.WAITING_HEADER_BLOCK_END
          if (this.headers['Transfer-Encoding'] === 'chunked') {
            this.bodyParser = new TrunkedBodyParser()
          }
        } else {
          this.headerName += char
        }
        break
      case this.WAITING_HEADER_SPACE:
        if (char === ' ') {
          this.current = this.WAITING_HEADER_VALUE
        }
        break
      case this.WAITING_HEADER_VALUE: {
        if (char === '\r') {
          this.current = this.WAITING_HEADER_LINE_END
          this.headers[this.headerName] = this.headerValue
          this.headerName = this.headerValue = ''
        } else {
          this.headerValue += char
        }
        break
      }
      case this.WAITING_HEADER_LINE_END: {
        if (char === '\n') {
          this.current = this.WAITING_HEADER_NAME
        }
        break
      }
      case this.WAITING_HEADER_BLOCK_END: {
        if (char === '\n') {
          this.current = this.WAITING_BODY
        }
        break
      }
      case this.WAITING_BODY: {
        this.bodyParser?.receiveChar(char)
      }
    }
  }
}

class TrunkedBodyParser {
  WAITING_LENGTH = 0
  WAITING_LENGTH_LINE_END = 1
  READING_TRUNK = 2
  WAITING_NEW_LINE = 3
  WAITING_NEW_LINE_END = 4
  length = 0
  content: string[] = []
  isFinished = false
  current = this.WAITING_LENGTH

  receiveChar(char: string) {
    if (this.current === this.WAITING_LENGTH) {
      if (char === '\r') {
        if (this.length === 0) {
          this.isFinished = true
        }
        this.current = this.WAITING_LENGTH_LINE_END
      } else {
        this.length *= 16
        this.length += parseInt(char, 16)
      }
    } else if (this.current === this.WAITING_LENGTH_LINE_END) {
      if (char === '\n') {
        this.current = this.READING_TRUNK
      }
    } else if (this.current === this.READING_TRUNK) {
      if (this.isFinished) return
      
      this.content.push(char)
      --this.length
      if (this.length === 0) {
        this.current = this.WAITING_NEW_LINE
      }
    } else if (this.current === this.WAITING_NEW_LINE) {
      if (char === '\r') {
        this.current = this.WAITING_NEW_LINE_END
      }
    } else if (this.current === this.WAITING_NEW_LINE_END) {
      if (char === '\n') {
        this.current = this.WAITING_LENGTH
      }
    }
  }
}

const main = async () => {
  const request = new Request({
    method: 'POST',
    host: '127.0.0.1',
    port: 8080,
    path: '/',
    headers: {
      'X-Foo2': 'customed',
    },
    body: {
      name: 'winter',
    },
  })

  const res = await request.send()

  parseHTML(res.body)

  console.log(res)
}

main()
