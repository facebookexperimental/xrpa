# Copyright (c) Meta Platforms, Inc. and affiliates.
# @generated
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


class StringEmbedding:
    def __init__(self, src_string):
        self._src_string = src_string
        self._processed_string = ""
        self._embedded_values = {}
        self._xrpa_fields_changed_handler = None
        self._is_dirty = False

    def set_embedding_value(self, key, value):
        value_str = str(value)
        if key not in self._embedded_values or self._embedded_values[key] != value_str:
            self._embedded_values[key] = value_str
            self._is_dirty = True
            if self._xrpa_fields_changed_handler:
                self._xrpa_fields_changed_handler(1)

    def get_value(self):
        if self._is_dirty:
            result = self._src_string
            for key, value in self._embedded_values.items():
                result = result.replace(key, value)
            self._processed_string = result
            self._is_dirty = False
        return self._processed_string

    def on_xrpa_fields_changed(self, handler):
        self._xrpa_fields_changed_handler = handler
        if self._is_dirty and self._xrpa_fields_changed_handler:
            self._xrpa_fields_changed_handler(1)
