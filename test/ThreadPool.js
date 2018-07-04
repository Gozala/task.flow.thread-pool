/* @flow */

import ThreadPool from "../"
import test from "blue-tape"

test("test baisc", async test => {
  test.ok(isClass(ThreadPool))
  test.ok(isFunction(ThreadPool.spawn), "exposes spawn function")
  test.ok(isFunction(ThreadPool.promise), "exposes promise function")
})

const isFunction = value => typeof value === "function"
const isClass = value =>
  isFunction(value) && Object(value.prototype).constructor === value
