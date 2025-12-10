# Copyright (c) Meta Platforms, Inc. and affiliates.
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

from setuptools import Extension, setup

xrpa_atomics = Extension(
    "xrpa_atomics",
    sources=["xrpa_atomics.c"],
    extra_compile_args=["-O3"],
)

setup(
    name="xrpa_atomics",
    version="1.0",
    description="Atomic operations for XRPA shared memory",
    ext_modules=[xrpa_atomics],
)
