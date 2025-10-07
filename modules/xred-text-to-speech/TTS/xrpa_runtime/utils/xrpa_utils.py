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


def xrpa_debug_bounds_assert(
    offset: int, required_size: int, total_size: int, min_range: int = 0
):
    access_end = offset + required_size
    if required_size < 0 or offset < min_range or access_end > total_size:
        msg = f"Memory access violation: [{offset}, {access_end}] reaches outside of range [{min_range}, {total_size}]"
        raise RuntimeError(msg)


def xrpa_debug_assert(condition: bool, msg: str = "Assertion failed"):
    if not condition:
        raise RuntimeError(msg)
