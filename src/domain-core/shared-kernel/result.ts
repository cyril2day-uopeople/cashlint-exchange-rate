export type Ok<T> = {
  readonly ok: true
  readonly value: T
}

export type Err<E> = {
  readonly ok: false
  readonly error: E
}

export type Result<T, E> = Ok<T> | Err<E>

export function ok<T>(value: T): Ok<T> {
  return {
    ok: true,
    value,
  }
}

export function err<E>(error: E): Err<E> {
  return {
    ok: false,
    error,
  }
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok
}

export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value))
  }

  return result
}

export function mapError<T, E1, E2>(
  result: Result<T, E1>,
  fn: (error: E1) => E2,
): Result<T, E2> {
  if (isErr(result)) {
    return err(fn(result.error))
  }

  return result
}

export function bind<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value)
  }

  return result
}

export function fold<T, E, R>(
  result: Result<T, E>,
  onError: (error: E) => R,
  onSuccess: (value: T) => R,
): R {
  if (isOk(result)) {
    return onSuccess(result.value)
  }

  return onError(result.error)
}

export function sequence<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []

  for (const result of results) {
    if (isErr(result)) {
      return result
    }

    values.push(result.value)
  }

  return ok(values)
}