import { scan } from './lexer.js'

const syntax: Record<string, string[][]> = {
  Program: [['StatementList', 'EOF']],
  StatementList: [['Statement'], ['StatementList', 'Statement']],
  Statement: [
    ['ExpressionStatement'],
    ['IfStatement'],
    ['VariableDeclaration'],
    ['FunctionDeclaration'],
  ],
  IfStatement: [['if', '(', 'Expression', ')', 'Statement']],
  VariableDeclaration: [
    ['var', 'Identifier', ';'],
    ['let', 'Identifier', ';'],
  ],
  FunctionDeclaration: [
    ['function', 'Identifier', '(', ')', '{', 'StatementList', '}'],
  ],
  ExpressionStatement: [['Expression', ';']],
  Expression: [['AdditiveExpression']],
  AdditiveExpression: [
    ['MultiplicativeExpression'],
    ['AdditiveExpression', '+', 'MultiplicativeExpression'],
    ['AdditiveExpression', '-', 'MultiplicativeExpression'],
  ],
  MultiplicativeExpression: [
    ['PrimaryExpression'],
    ['MultiplicativeExpression', '*', 'PrimaryExpression'],
    ['MultiplicativeExpression', '/', 'PrimaryExpression'],
  ],
  PrimaryExpression: [['(', 'Expression', ')'], ['Literal'], ['Identifier']],
  Literal: [['Number']],
}

interface SyntaxState {
  $isEnd?: boolean
  $reduceType?: string
  $reduceLength?: number
  type?: string
  children?: SyntaxState[]
  [key: string]: any
}

const idToState = new Map<number, SyntaxState>()
const stateToId = new Map<SyntaxState, number>()
let id = 0

const addState = (state: SyntaxState) => {
  if (stateToId.has(state)) return
  idToState.set(id, state)
  stateToId.set(state, id)
  ++id
}

const closure = (state: SyntaxState) => {
  addState(state)
  const queue: string[] = []
  for (const symbol of Object.keys(state)) {
    if (symbol.startsWith('$')) continue

    queue.push(symbol)
  }

  while (queue.length) {
    const symbol = queue.shift()!

    if (syntax[symbol]) {
      for (const rule of syntax[symbol]) {
        if (!state[rule[0]]) {
          queue.push(rule[0])
        }

        let current: SyntaxState = state
        for (const part of rule) {
          if (!current[part]) {
            current[part] = {}
          }
          current = current[part]
        }
        current.$reduceType = symbol
        current.$reduceLength = rule.length
      }
    }
  }

  for (const symbol of Object.keys(state)) {
    if (symbol.startsWith('$')) return

    if (!stateToId.has(state[symbol])) {
      closure(state[symbol])
    }
  }
}

const parse = (source: string) => {
  let stack: SyntaxState[] = [start]
  const reduce = () => {
    const state = stack[stack.length - 1]

    if (state.$reduceType && typeof state.$reduceType === 'string') {
      const children: SyntaxState[] = []

      for (let i = 0; i < state.$reduceLength!; ++i) {
        children.push(stack.pop()!)
      }

      shift({
        type: state.$reduceType,
        children: children.reverse(),
      })
    }
  }
  const shift = (symbol: SyntaxState) => {
    let state = stack[stack.length - 1]

    if ((symbol.type as string) in state) {
      stack.push(symbol)
    } else {
      reduce()
      shift(symbol)
    }
  }

  for (const symbol of scan(source)) {
    shift(symbol)
  }
}

let end = {
  $isEnd: true,
}
let start = {
  Program: end,
}
const source = `
var a;
`
closure(start)
console.log(start)
parse(source)
