# @task.flow/thread-pool

[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]

Thread pool scheduler for [task.flow][] tasks. You will need to use this or an alternative scheduler to run tasks.

## Usage

```js
import Task from "task.flow"
import ThreadPool from "@task.flow/thread-pool"

const get = (url: string): Task<HTTPError, ArrayBuffer> =>
  Task.io(
    (succeed, fail) => {
      var request = new XMLHttpRequest()
      request.addEventListener("load", () => {
        succeed(request.response)
      })
      request.addEventListener("error", () => {
        fail(new HTTPError(request))
      })
      request.responseType = "arraybuffer"
      request.open("GET", url)
      request.send()
      return request
    },
    request => {
      request.abort()
    }
  )

// Note: Type checker only allows spawning Task<empty, void> so following won't
// type check.
// ThreadPool.spawn(get(myURL))

const task = get(myURL)
  .chain(content => {
    console.log("Completed HTTP GET:", content)
    return Task.succeed()
  })
  .capture(error => {
    console.error("Failed HTTP GET", error)
    return Task.succeed()
  })

ThreadPool.spawn(task)
```

## Install

    npm install @task.flow/thread-pool

[task.flow]: https://github.com/Gozala/task.flow
[travis.icon]: https://travis-ci.org/Gozala/task.flow.thread-pool.svg?branch=master
[travis.url]: https://travis-ci.org/Gozala/task.flow.thread-pool
[version.icon]: https://img.shields.io/npm/v/@task.flow/thread-pool.svg
[downloads.icon]: https://img.shields.io/npm/dm/@task.flow/thread-pool.svg
[package.url]: https://npmjs.org/package/@task.flow/thread-pool
[downloads.image]: https://img.shields.io/npm/dm/@task.flow/thread-pool.svg
[downloads.url]: https://npmjs.org/package/@task.flow/thread-pool
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier
