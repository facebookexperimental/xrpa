/*
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

using System;
using System.Collections.Generic;

namespace Xrpa
{
    public class StringEmbedding
    {
        private string srcString_;
        private string processedString_;
        private Dictionary<string, string> embeddedValues_ = new Dictionary<string, string>();
        private Action<ulong> xrpaFieldsChangedHandler_ = null;
        private bool isDirty_ = false;

        public StringEmbedding(string str)
        {
            srcString_ = str;
        }

        public void SetEmbeddingValue<T>(string key, T value)
        {
            SetEmbeddingValue(key, value.ToString());
        }

        public void SetEmbeddingValue(string key, bool value)
        {
            SetEmbeddingValue(key, value ? "true" : "false");
        }

        public void SetEmbeddingValue(string key, string value)
        {
            if (!embeddedValues_.TryGetValue(key, out var existingValue) || existingValue != value)
            {
                embeddedValues_[key] = value;
                isDirty_ = true;
                xrpaFieldsChangedHandler_?.Invoke(1);
            }
        }

        public string GetValue()
        {
            if (isDirty_)
            {
                string result = srcString_;
                foreach (var kvp in embeddedValues_)
                {
                    result = result.Replace(kvp.Key, kvp.Value);
                }
                processedString_ = result;
                isDirty_ = false;
            }
            return processedString_;
        }

        public void OnXrpaFieldsChanged(Action<ulong> handler)
        {
            xrpaFieldsChangedHandler_ = handler;
            if (isDirty_ && xrpaFieldsChangedHandler_ != null)
            {
                xrpaFieldsChangedHandler_(1);
            }
        }
    }
}
