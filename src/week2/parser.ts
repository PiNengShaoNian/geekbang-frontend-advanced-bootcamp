import css, { AtRule, Rule } from 'css'
import { layout } from '../week3/layout'

type char = string
type MachineState = (c: char) => MachineState

type TextToken = {
  type: 'text'
  content: string
}
type EOFToken = {
  type: 'EOF'
}
type CommonToken = {
  type: 'startTag' | 'endTag'
  tagName: string
  selfClosing?: boolean
  attributes?: Record<string, string>
}
type Token = TextToken | CommonToken | EOFToken
type Attribute = {
  name: string
  value: string
}

type Specificity = [number, number, number, number]

export type Element = {
  type: string
  children: Element[]
  attributes?: { name: string; value: string }[]
  tagName: string
  parent: null | Element
  content?: string
  computedStyle?: {
    [key: string]: {
      value: string
      priority: Specificity
    }
  }
  style?: {
    [key: string]: number | string | null
  }
}

const EOF = 'EOF'

let currentToken: null | Token = null
let currentAttribute: null | Attribute = null
let currentTextNode: null | Element = null
const rules: Array<Rule | Comment | AtRule> = []
const stack: Element[] = [
  {
    type: 'document',
    children: [],
    tagName: 'DOCUMENT',
    parent: null,
  },
]

const addAttribute = () => {
  const x = currentToken as CommonToken
  if (!x.attributes) {
    x.attributes = {}
  }
  x.attributes[currentAttribute!.name] = currentAttribute!.value
}

const addCSSRules = (cssText: string): void => {
  rules.push(...(css.parse(cssText).stylesheet?.rules ?? []))
}

const match = (element: Element, selector: string): boolean => {
  if (!selector) return false

  if (selector[0] === '#') {
    const idAttr = element.attributes?.find((v) => v.name === 'id')
    if (!idAttr) return false

    return '#' + idAttr.value === selector
  } else if (selector[0] === '.') {
    const classAttr = element.attributes?.find((v) => v.name === 'class')
    if (!classAttr) return false

    return '.' + classAttr.value === selector
  } else {
    if (element.tagName === selector) return true
  }
  return false
}

const specificity = (selector: string): Specificity => {
  const ans: Specificity = [0, 0, 0, 0]

  const selectorParts = selector.split(' ')

  for (const part of selectorParts) {
    if (part[0] === '#') {
      ++ans[1]
    } else if (part[0] === '.') {
      ++ans[2]
    } else {
      ++ans[3]
    }
  }

  return ans
}

const compare = (a: Specificity, b: Specificity): number => {
  if (a[0] - b[0]) return a[0] - b[0]
  if (a[1] - b[1]) return a[1] - b[1]
  if (a[2] - b[2]) return a[2] - b[2]

  return a[3] - b[3]
}

const computeCSS = (element: Element): void => {
  const elements = stack.slice().reverse()

  for (const rule of rules) {
    if ('selectors' in rule) {
      const selectorParts = rule.selectors?.[0]?.split(' ').reverse() ?? []
      if (!match(element, selectorParts[0])) continue

      let matched = false

      let j = 1

      for (let i = 0; i < elements.length; ++i) {
        if (match(elements[i], selectorParts[j])) {
          j++
        }
      }

      if (j >= selectorParts.length) {
        matched = true
      }

      if (!rule.declarations || !matched) continue

      if (!element.computedStyle) {
        element.computedStyle = {}
      }

      for (const d of rule.declarations) {
        if ('property' in d) {
          const sp = specificity(rule.selectors?.[0] ?? '')
          if (!element.computedStyle[d.property!]) {
            element.computedStyle[d.property!] = {} as any
          }

          if (!element.computedStyle[d.property!].priority) {
            element.computedStyle[d.property!].priority = sp
            element.computedStyle[d.property!].value = d.value!
          } else if (compare(element.computedStyle[d.property!].priority, sp)) {
            element.computedStyle[d.property!].priority = sp
            element.computedStyle[d.property!].value = d.value!
          }
        }
      }
    }
  }
}

const emit = (token: Token): void => {
  const top = stack[stack.length - 1]

  if (token.type === 'startTag') {
    const element: Element = {
      type: 'element',
      children: [],
      attributes: [],
      tagName: token.tagName,
      parent: null,
    }

    if (token.attributes) {
      for (const x of Object.keys(token.attributes)) {
        element.attributes?.push({
          name: x,
          value: token.attributes[x],
        })
      }
    }

    computeCSS(element)

    top.children.push(element)
    element.parent = top

    if (!token.selfClosing) {
      stack.push(element)
    }

    currentTextNode = null
  } else if (token.type === 'endTag') {
    if (top.tagName !== token.tagName) {
      throw new Error("Tag start end doesn't match!")
    } else {
      if (top.tagName === 'style') {
        addCSSRules(top.children[0].content!)
      }
      layout(top)
      stack.pop()
    }
    currentTextNode = null
  } else if (token.type === 'text') {
    if (currentTextNode === null) {
      currentTextNode = {
        type: 'text',
        content: '',
        parent: top,
      } as Element
      top.children.push(currentTextNode)
    }

    currentTextNode.content += token.content
  }
}

const endState = () => {
  //   throw new Error('Not Implement')
  return endState
}

const data: MachineState = (c) => {
  if (c === '<') {
    return tagOpen
  } else if (c === EOF) {
    emit({
      type: 'EOF',
    })
    return endState
  } else {
    emit({
      type: 'text',
      content: c,
    })
    return data
  }
}

const tagOpen: MachineState = (c) => {
  if (c === '/') {
    return endTagOpen
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'startTag',
      tagName: '',
    }
    return tagName(c)
  } else {
    emit({
      type: 'text',
      content: 'c',
    })
    return endState
  }
}

const endTagOpen: MachineState = (c) => {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'endTag',
      tagName: '',
    }

    return tagName(c)
  } else if (c === '>') {
    throw new Error('Not Implement')
  } else if (c === EOF) {
    throw new Error('Not Implement')
  } else {
    throw new Error('Not Implement')
  }
}

const beforeAttributeName: MachineState = (c) => {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/' || c === '>' || c === EOF) {
    return afterAttributeName(c)
  } else if (c === '=') {
    throw new Error('Not Implement')
  } else {
    currentAttribute = {
      name: '',
      value: '',
    }
    return attributeName(c)
  }
}

const attributeName: MachineState = (c) => {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
    return afterAttributeName(c)
  } else if (c === '=') {
    return beforeAttributeValue
  } else if (c === '\u0000') {
    throw new Error('Not Implement')
  } else if (c === '/"' || c === "'" || c === '<') {
    throw new Error('Not Implement')
  } else {
    currentAttribute!.name += c
    return attributeName
  }
}

const afterAttributeName: MachineState = (c) => {
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName
  } else if (c === '/') {
    return selfClosingStartTag
  } else if (c === '=') {
    return beforeAttributeValue
  } else if (c === '>') {
    addAttribute()
    emit(currentToken!)
    return data
  } else if (c === EOF) {
    throw new Error('Not Implement')
  } else {
    addAttribute()
    currentAttribute = {
      name: '',
      value: '',
    }
    return attributeName(c)
  }
}

const beforeAttributeValue: MachineState = (c) => {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === EOF) {
    return beforeAttributeValue
  } else if (c === '"') {
    return doubleQuotedAttributeValue
  } else if (c === "'") {
    return singleQuotedAttributeValue
  } else if (c === '>') {
    throw new Error('Not Implement')
  } else {
    return UnquotedAttributeValue(c)
  }
}

const singleQuotedAttributeValue: MachineState = (c) => {
  if (c === "'") {
    addAttribute()
    return afterQuotedAttributeValue
  } else if (c === '\u0000') {
    throw new Error('Not Implement')
  } else if (c == EOF) {
    throw new Error('Not Implement')
  } else {
    currentAttribute!.value += c
    return singleQuotedAttributeValue
  }
}

const afterQuotedAttributeValue: MachineState = (c) => {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/') {
    return selfClosingStartTag
  } else if (c === '>') {
    const x = currentToken as CommonToken
    if (!x.attributes) {
      x.attributes = {}
    }

    x.attributes[currentAttribute!.name] = currentAttribute!.value
    emit(currentToken!)
    return data
  } else if (c === EOF) {
    throw new Error('Not Implement')
  } else {
    currentAttribute!.value += c
    return doubleQuotedAttributeValue
  }
}

const doubleQuotedAttributeValue: MachineState = (c) => {
  if (c === '"') {
    const x = currentToken as CommonToken
    if (!x.attributes) {
      x.attributes = {}
    }

    x.attributes[currentAttribute!.name] = currentAttribute!.value
    return afterQuotedAttributeValue
  } else if (c === '\u0000') {
    throw new Error('Not Implement')
  } else if (c === EOF) {
    throw new Error('Not Implement')
  } else {
    currentAttribute!.value += c
    return doubleQuotedAttributeValue
  }
}

const UnquotedAttributeValue: MachineState = (c) => {
  if (c.match(/^[\t\n\f ]$/)) {
    addAttribute()

    return beforeAttributeName
  } else if (c === '/') {
    addAttribute()

    return selfClosingStartTag
  } else if (c === '>') {
    addAttribute()

    emit(currentToken!)
    return data
  } else if (c === '\u0000') {
    throw new Error('Not Implement')
  } else if (c === '"' || c === "'" || c === '<' || c === '=' || c === '`') {
    throw new Error('Not Implement')
  } else if (c === EOF) {
    throw new Error('Not Implement')
  } else {
    currentAttribute!.value += c
    return UnquotedAttributeValue
  }
}

const selfClosingStartTag: MachineState = (c) => {
  if (c === '>') {
    ;(currentToken as CommonToken).selfClosing = true
    emit(currentToken!)
    return data
  } else if (c === EOF) {
    throw new Error('Not Implement')
  } else {
    throw new Error('Not Implement')
  }
}

const tagName: MachineState = (c) => {
  if (c.match(`^[\t\n\f ]$`)) {
    return beforeAttributeName
  } else if (c === '/') {
    return selfClosingStartTag
  } else if (c.match(/^[A-Z]$/)) {
    ;(currentToken as CommonToken).tagName += c
    return tagName
  } else if (c === '>') {
    emit(currentToken!)
    return data
  } else {
    ;(currentToken as CommonToken).tagName += c
    return tagName
  }
}

export const parseHTML = (html: string): void => {
  let state = data

  for (const c of html) {
    state = state(c)
  }

  state = state(EOF)

  console.log(rules)
}
