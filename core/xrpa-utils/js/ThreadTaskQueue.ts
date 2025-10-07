/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


export class ThreadQueueEnded extends Error {
  constructor() {
    super('Thread queue ended');
  }
}

export class ThreadTaskQueue<T> {
  private tasks: T[] = [];
  private isEnded = false;

  public get count(): number { return this.tasks.length; }

  private promise: Promise<void> | null = null;
  private resolve: (() => void) | null = null;

  public enqueue(task: T): void {
    this.tasks.push(task);
    this.wakeUp();
  }

  public end() {
    this.isEnded = true;
    this.wakeUp();
  }

  public async dequeue(): Promise<T> {
    while (!this.isEnded && this.tasks.length === 0) {
      await this.wait();
    }
    if (this.isEnded && this.tasks.length === 0) {
      throw new ThreadQueueEnded();
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.tasks.shift()!;
  }

  private wakeUp() {
    this.resolve?.();
    this.resolve = null;
    this.promise = null;
  }

  private wait(): Promise<void> {
    if (!this.promise) {
      this.promise = new Promise(resolve => {
        this.resolve = resolve;
      });
    }
    return this.promise;
  }

  QueuedTasks(): Iterable<T> {
    return this.tasks;
  }

}
