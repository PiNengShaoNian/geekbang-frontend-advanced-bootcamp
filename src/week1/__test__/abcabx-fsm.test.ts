import { end, start } from '../abcabx-fsm'

test('abcabx-fsm', () => {
  {
    const str = 'abcabx'
    let state = start
    for (const c of str) {
      state = state(c)
    }

    expect(state).toBe(end)
  }

  {
    const str = 'dabcabx'
    let state = start
    for (const c of str) {
      state = state(c)
    }

    expect(state).toBe(end)
  }

  {
    const str = 'dabcab'
    let state = start
    for (const c of str) {
      state = state(c)
    }

    expect(state).not.toBe(end)
  }
})
