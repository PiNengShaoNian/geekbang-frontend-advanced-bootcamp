import { Element } from '../week2/parser'

const getStyle = (element: Element) => {
  if (!element.style) {
    element.style = {}
  }

  for (const prop of Object.keys(element.computedStyle!)) {
    element.style[prop] = element.computedStyle![prop].value
    if ((element.style[prop] ?? '').toString().match(/px$/)) {
      element.style[prop] = parseInt(element.style[prop] + '')
    }

    if ((element.style[prop] ?? '').toString().match(/^[0-9\.]+$/)) {
      element.style[prop] = parseInt(element.style[prop] + '')
    }
  }

  return element.style
}

export const layout = (element: Element) => {
  if (!element.computedStyle) return

  const elementStyle = getStyle(element)

  if (elementStyle.display !== 'flex') return

  const items = element.children.filter((e) => e.type === 'element')

  items.sort(
    (a, b) =>
      ((a.style?.order as number) ?? 0) - ((b.style?.order as number) ?? 0)
  )
  ;['width', 'height'].forEach((size) => {
    if (elementStyle[size] === 'auto' || elementStyle[size] === '') {
      elementStyle[size] = null
    }
  })

  if (!elementStyle.flexDirection || elementStyle.flexDirection === 'auto') {
    elementStyle.flexDirection = 'row'
  }

  if (!elementStyle.alignItems || elementStyle.alignItems === 'auto') {
    elementStyle.flexDirection = 'stretch'
  }

  if (!elementStyle.justifyContent || elementStyle.justifyContent === 'auto') {
    elementStyle.justifyContent = 'flex-start'
  }

  if (!elementStyle.flexWrap || elementStyle.flexWrap === 'auto') {
    elementStyle.flexWrap = 'nowrap'
  }
  if (!elementStyle.alignContent || elementStyle.alignContent === 'auto') {
    elementStyle.flexWrap = 'stretch'
  }

  let mainSize: 'width' | 'height'
  let mainStart: 'left' | 'top' | 'right' | 'bottom'
  let mainEnd: 'right' | 'bottom' | 'left' | 'top'
  let mainSign: 1 | -1
  let mainBase: number
  let crossSize: 'width' | 'height'
  let crossStart: 'left' | 'top' | 'bottom' | 'right'
  let crossEnd: 'left' | 'top' | 'bottom' | 'right'
  let corssSign: 1 | -1
  let crossBase

  if (elementStyle.flexDirection === 'row') {
    mainSize = 'width'
    mainStart = 'left'
    mainEnd = 'right'
    mainSign = 1
    mainBase = 0

    crossSize = 'height'
    crossStart = 'top'
    crossEnd = 'bottom'
  } else if (elementStyle.flexDirection === 'row-reverse') {
    mainSize = 'width'
    mainStart = 'right'
    mainEnd = 'left'
    mainSign = -1
    mainBase = (elementStyle.width as number) ?? 0

    crossSize = 'height'
    crossStart = 'top'
    crossEnd = 'bottom'
  } else if (elementStyle.flexDirection === 'column') {
    mainSize = 'height'
    mainStart = 'top'
    mainEnd = 'bottom'
    mainSign = 1
    mainBase = 0

    crossSize = 'width'
    crossStart = 'left'
    crossEnd = 'right'
  } else {
    // (elementStyle.flexDirection === 'column-reverse')
    mainSize = 'height'
    mainStart = 'bottom'
    mainEnd = 'top'
    mainSign = -1
    mainBase = (elementStyle.height as number) ?? 0

    crossSize = 'width'
    crossStart = 'left'
    crossEnd = 'right'
  }

  if (elementStyle.flexWrap === 'wrap-reverse') {
    const temp = crossStart
    crossStart = crossEnd
    crossEnd = temp
    corssSign = -1
  } else {
    crossBase = 0
    corssSign = 1
  }
}
