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


export type StringFilter = string & {
    __type: 'StringFilter';
};
export declare function strStartsWith(prefix: string): StringFilter;
export declare function strEndsWith(suffix: string): StringFilter;
export declare function strContains(substr: string): StringFilter;
export declare function strEquals(str: string): StringFilter;

