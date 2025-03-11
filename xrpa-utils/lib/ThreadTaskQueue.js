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

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadTaskQueue = exports.ThreadQueueEnded = void 0;
class ThreadQueueEnded extends Error {
    constructor() {
        super('Thread queue ended');
    }
}
exports.ThreadQueueEnded = ThreadQueueEnded;
class ThreadTaskQueue {
    constructor() {
        this.tasks = [];
        this.isEnded = false;
        this.promise = null;
        this.resolve = null;
    }
    get count() { return this.tasks.length; }
    enqueue(task) {
        this.tasks.push(task);
        this.wakeUp();
    }
    end() {
        this.isEnded = true;
        this.wakeUp();
    }
    async dequeue() {
        while (!this.isEnded && this.tasks.length === 0) {
            await this.wait();
        }
        if (this.isEnded && this.tasks.length === 0) {
            throw new ThreadQueueEnded();
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.tasks.shift();
    }
    wakeUp() {
        this.resolve?.();
        this.resolve = null;
        this.promise = null;
    }
    wait() {
        if (!this.promise) {
            this.promise = new Promise(resolve => {
                this.resolve = resolve;
            });
        }
        return this.promise;
    }
    QueuedTasks() {
        return this.tasks;
    }
}
exports.ThreadTaskQueue = ThreadTaskQueue;
//# sourceMappingURL=ThreadTaskQueue.js.map
