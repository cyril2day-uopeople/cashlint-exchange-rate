import { describe, expect, it, vi } from 'vitest'

import {
  bind,
  err,
  fold,
  isErr,
  isOk,
  map,
  mapError,
  ok,
  sequence,
  type Result,
} from './result'

describe('result constructors', () => {
  it('creates an ok result', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 })
  })

  it('creates an err result', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' })
  })

  it('accepts null as a success value', () => {
    expect(ok(null)).toEqual({ ok: true, value: null })
  })

  it('accepts undefined as a success value', () => {
    expect(ok(undefined)).toEqual({ ok: true, value: undefined })
  })
})

describe('result guards', () => {
  it('identifies ok results', () => {
    const result: Result<number, string> = ok(7)

    expect(isOk(result)).toBe(true)
    expect(isErr(result)).toBe(false)

    if (!isOk(result)) {
      throw new Error('expected ok result')
    }

    expect(result.value).toBe(7)
  })

  it('identifies err results', () => {
    const result: Result<number, string> = err('missing')

    expect(isOk(result)).toBe(false)
    expect(isErr(result)).toBe(true)

    if (!isErr(result)) {
      throw new Error('expected err result')
    }

    expect(result.error).toBe('missing')
  })
})

describe('map', () => {
  it('transforms the success value', () => {
    expect(map(ok(5), (value) => value * 2)).toEqual(ok(10))
  })

  it('passes through errors unchanged', () => {
    const transform = vi.fn((value: number) => value * 2)

    expect(map(err('oops'), transform)).toEqual(err('oops'))
    expect(transform).not.toHaveBeenCalled()
  })
})

describe('mapError', () => {
  it('passes through success values unchanged', () => {
    const transform = vi.fn((error: string) => error.toUpperCase())

    expect(mapError(ok(5), transform)).toEqual(ok(5))
    expect(transform).not.toHaveBeenCalled()
  })

  it('transforms the error value', () => {
    expect(mapError(err('oops'), (error) => error.toUpperCase())).toEqual(
      err('OOPS'),
    )
  })
})

describe('bind', () => {
  it('chains success to success', () => {
    expect(bind(ok(5), (value) => ok(value * 2))).toEqual(ok(10))
  })

  it('chains success to failure', () => {
    expect(bind(ok(5), () => err('fail'))).toEqual(err('fail'))
  })

  it('short-circuits on error', () => {
    const transform = vi.fn((value: number) => ok(value * 2))

    expect(bind(err('nope'), transform)).toEqual(err('nope'))
    expect(transform).not.toHaveBeenCalled()
  })
})

describe('fold', () => {
  it('calls the success handler for ok results', () => {
    const onError = vi.fn(() => 'error')
    const onSuccess = vi.fn((value: number) => `value:${value}`)

    expect(fold(ok(5), onError, onSuccess)).toBe('value:5')
    expect(onError).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledWith(5)
  })

  it('calls the error handler for err results', () => {
    const onError = vi.fn((error: string) => `error:${error}`)
    const onSuccess = vi.fn(() => 'value')

    expect(fold(err('boom'), onError, onSuccess)).toBe('error:boom')
    expect(onError).toHaveBeenCalledWith('boom')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('sequence', () => {
  it('returns ok for an empty array', () => {
    expect(sequence([])).toEqual(ok([]))
  })

  it('collects success values in order', () => {
    expect(sequence([ok(1), ok(2), ok(3)])).toEqual(ok([1, 2, 3]))
  })

  it('returns the first error', () => {
    expect(sequence([ok(1), err('first'), err('second')])).toEqual(
      err('first'),
    )
  })
})

describe('monad laws', () => {
  it('satisfies left identity', () => {
    const f = (value: number): Result<number, string> => ok(value + 3)

    expect(bind(ok(4), f)).toEqual(f(4))
  })

  it('satisfies right identity', () => {
    const result: Result<number, string> = err('blocked')
    const identity = <T>(value: T): Result<T, string> => ok(value)

    expect(bind(result, identity)).toEqual(result)
  })

  it('satisfies associativity', () => {
    const result: Result<number, string> = ok(4)
    const f = (value: number): Result<number, string> => ok(value + 1)
    const g = (value: number): Result<number, string> =>
      value % 2 === 0 ? ok(value * 2) : err('odd')

    expect(bind(bind(result, f), g)).toEqual(
      bind(result, (value) => bind(f(value), g)),
    )
  })
})