class XRegExp {
  public table: Map<number, string> = new Map()
  public regexp: RegExp
  constructor(
    public source: { [key: string]: string | RegExp },
    public flag: string,
    public root = 'root'
  ) {
    this.regexp = new RegExp(this.compileRegExp(source, root, 0).source, flag)
  }

  compileRegExp = (
    source: { [key: string]: string | RegExp },
    name: string,
    start: number
  ): {
    source: string
    length: number
  } => {
    const x = source[name]!
    const { table } = this
    if (x instanceof RegExp) {
      return {
        source: x.source,
        length: 0,
      }
    }

    let length = 0

    let regexp = x.replace(/\<([^>]+)\>/g, (_, $1) => {
      table.set(start + length, $1)
      ++length

      let r = this.compileRegExp(source, $1, start + length)

      length += r.length
      return '(' + r.source + ')'
    })

    return {
      source: regexp,
      length,
    }
  }

  exec(str: string) {
    let r = this.regexp.exec(str)

    if (!r) return r

    for (let i = 1; i < r.length; ++i) {
      if (r[i] !== undefined) {
        r[this.table.get(i - 1) as any as number] = r[i]
      }
    }

    return r
  }

  get lastIndex() {
    return this.regexp.lastIndex
  }

  setLastIndex(val: number): number {
    return (this.regexp.lastIndex = val)
  }
}

export const scan = function* (str: string) {
  let regexp = new XRegExp(
    {
      InputElement: '<WhiteSpace>|<LineTerminator>|<Comments>|<Token>',
      WhiteSpace: / /,
      LineTerminator: /\n/,
      Comments: /\/\*(?:[^*]|\*[^\/])*\*\/|\/\/[^\n]*/,
      Token: '<Literal>|<Keywords>|<Identifier>|<Punctuator>',
      Literal:
        '<NumericLiteral>|<BooleanLiteral>|<StringLiteral>|<NullLiteral>',
      NumericLiteral: /(?:[1-9][0-9]*|0)(?:\.[0-9]*)?|\.[0-9]+/,
      BooleanLiteral: /true|false/,
      StringLiteral: /\"(?:[^"\n]|\\[\s\S]*)\"|\'(?:[^'\n]|\\[\s\S])*\'/,
      NullLiteral: /null/,
      Identifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
      Keywords: /if|else|for|function|let|var/,
      Punctuator: /\+|\,|\?|\:|\{|\}|\.|\(|\)|\=|\<|\+\+|\=\=|\=\>|\*|\[|\]|;/,
    },
    'g',
    'InputElement'
  )

  while (regexp.lastIndex < str.length) {
    const r = regexp.exec(str) as RegExpExecArray & {
      [key: string]: string
    }

    if (!r) continue

    if (r.WhiteSpace) {
    } else if (r.LineTerminator) {
    } else if (r.Comments) {
    } else if (r.NumericLiteral) {
      yield {
        type: 'NumericLiteral',
        value: r[0],
      }
    } else if (r.BooleanLiteral) {
      yield {
        type: 'BooleanLiteral',
        value: r[0],
      }
    } else if (r.StringLiteral) {
      yield {
        type: 'StringLiteral',
        value: r[0],
      }
    } else if (r.NullLiteral) {
      yield {
        type: 'NullLiteral',
        value: null,
      }
    } else if (r.Identifier) {
      yield {
        type: 'Identifier',
        name: r[0],
      }
    } else if (r.Keywords) {
      yield {
        type: r[0],
      }
    } else if (r.Punctuator) {
      yield {
        type: r[0],
      }
    } else {
      throw new Error('unexpected token ' + r[0])
    }
  }

  yield {
    type: 'EOF',
  }
}

const source = `
for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      let cell = document.createElement('div')
      cell.classList.add('cell')
      cell.innerText =
        pattern[i * 3 + j] == 2 ? 'X' : pattern[i * 3 + j] === 1 ? 'O' : ''
      cell.addEventListener('click', () => userMove(j, i))
      board.appendChild(cell)
    }
  
    board.appendChild(document.createElement('br'))
  }
`
