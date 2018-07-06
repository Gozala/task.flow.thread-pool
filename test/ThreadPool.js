/* @flow */

import type { Thread, Future } from "@task.flow/type"
import ThreadPool from "../"
import test from "blue-tape"

test("test baisc", async test => {
  test.ok(isClass(ThreadPool))
  test.ok(isFunction(ThreadPool.spawn), "exposes spawn function")
  test.ok(isFunction(ThreadPool.promise), "exposes promise function")
})

test("test spawn", async test => {
  let park = null
  let owner = null
  let state = {
    spawn: 0,
    poll: 0,
    abort: 0
  }

  ThreadPool.spawn({
    spawn(thread): Future<empty, void> {
      state.spawn++
      owner = thread
      test.pass("spawn of the task was called")
      return {
        poll() {
          if (state.poll == 0) {
            park = thread.park()
            state.poll++
          } else {
            state.poll++
            return {
              isOk: true,
              value: undefined
            }
          }
        },
        abort() {
          state.abort++
        }
      }
    }
  })

  await sleep(10)
  test.isEquivalent(state, {
    spawn: 1,
    poll: 1,
    abort: 0
  })

  if (!owner) {
    test.fail("No thread handle was passed")
  } else if (!park) {
    test.fail("thread was not parked")
  } else {
    owner.unpark(park)
  }

  await sleep(10)
  test.isEquivalent(state, {
    spawn: 1,
    poll: 2,
    abort: 0
  })
})

const sleep = time => new Promise(end => setTimeout(end, time))

const isFunction = value => typeof value === "function"
const isClass = value =>
  isFunction(value) && Object(value.prototype).constructor === value
