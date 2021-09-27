type char = string

type MachineState = (c: char) => MachineState

export const start: MachineState = (c: string) => {
  if (c === 'a') return foundFirstA
  else return start
}

const foundFirstA: MachineState = (c: char) => {
  if (c === 'b') return foundFirstB
  else return start(c)
}

const foundFirstB: MachineState = (c: char) => {
  if (c === 'c') return foundC
  else return start(c)
}

const foundC: MachineState = (c: char) => {
  if (c === 'a') return foundSecondA
  else return start(c)
}

const foundSecondA = (c: char) => {
  if (c === 'b') return foundSecondB
  else return start(c)
}

const foundSecondB = (c: char) => {
  if (c === 'x') return end
  else return start(c)
}

export const end = (_: char) => {
  return end
}
