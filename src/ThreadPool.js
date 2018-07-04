// @flow

import type { Task, Future, Thread, Park } from "@task.flow/type"
import Pool from "pool.flow"
import type { Lifecycle } from "pool.flow"

export interface ThreadManager extends Thread {
  run(Task<empty, void>): void;
  kill(): void;
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
    return new Promise((resolve, reject) =>
      ThreadPool.spawn(task.map(resolve).recover(reject))
    )
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
