// @flow

import type { Task, Future, Thread, Park } from "@task.flow/type"
import Pool from "pool.flow"
import type { Lifecycle } from "pool.flow"

export interface ThreadManager extends Thread {
  run(Task<empty, void>): void;
  kill(): void;
}

class PromiseFuture<x, a> implements Future<empty, void> {
  static pool: Pool<PromiseFuture<x, a>> = new Pool()

  resolve: a => void
  reject: x => void
  future: Future<x, a>
  isOk = true
  value = undefined
  static new(resolve: a => void, reject: x => void, future: Future<x, a>) {
    const self = this.pool.new(this)
    self.resolve = resolve
    self.reject = reject
    self.future = future
    return self
  }
  delete() {
    delete this.resolve
    delete this.reject
    delete this.future
    PromiseFuture.pool.delete(this)
  }
  recycle(lifecycle) {}
  poll() {
    const result = this.future.poll()
    if (result == null) {
      return result
    } else {
      if (result.isOk) {
        this.resolve(result.value)
      } else {
        this.reject(result.error)
      }
      this.delete()
      return this
    }
  }
  abort() {
    this.future.abort()
    this.delete()
  }
}

export default class ThreadPool implements ThreadManager {
  static pool: Pool<ThreadPool> = new Pool()
  isParked: boolean
  future: Future<empty, void>
  lifecycle: Park
  recycle(lifecycle: Park) {
    this.lifecycle = lifecycle
  }
  delete() {
    delete this.future
    ThreadPool.pool.delete(this)
  }
  run(task: Task<empty, void>): void {
    this.future = task.spawn(this)
    this.work()
  }
  static new(): ThreadManager {
    return ThreadPool.pool.new(ThreadPool)
  }
  static spawn(task: Task<empty, void>): void {
    ThreadPool.new().run(task)
  }
  static promise<x, a>(task: Task<x, a>): Promise<a> {
    return new Promise((resolve, reject) => {
      const thread = ThreadPool.pool.new(ThreadPool)
      thread.future = PromiseFuture.new(resolve, reject, task.spawn(thread))
      thread.work()
    })
  }
  kill() {
    this.future.abort()
    this.delete()
  }
  work() {
    const result = this.future.poll()
    if (result != null) {
      this.delete()
    } else {
      this.isParked = true
    }
  }
  park(): Park {
    return this.lifecycle
  }
  unpark(park: Park): void {
    if (this.lifecycle === park) {
      this.awake()
    } else {
      throw Error("Thread is no longer avaliable")
    }
  }
  async awake() {
    if (this.isParked) {
      this.isParked = false
      await Promise.resolve()
      this.work()
    }
  }
}
