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


export const EXCLUDE_NAMESPACE = "EXCLUDE_NAMESPACE";

export function nsQualifyWithSeparator(nsSep: string, qualifiedName: string, inNamespace: string): string {
  if (inNamespace === EXCLUDE_NAMESPACE) {
    const idx = qualifiedName.lastIndexOf(nsSep);
    if (idx < 0) {
      return qualifiedName;
    }
    return qualifiedName.slice(idx + nsSep.length);
  }

  if (!inNamespace) {
    return qualifiedName;
  }

  const nameSplit = qualifiedName.split(nsSep);
  const namespaceSplit = inNamespace.split(nsSep);
  const qCount = Math.min(nameSplit.length - 1, namespaceSplit.length);
  for (let i = 0; i < qCount; ++i) {
    if (nameSplit[i] !== namespaceSplit[i]) {
      return nameSplit.slice(i).join(nsSep);
    }
  }

  return nameSplit.slice(qCount).join(nsSep);
}

export function nsJoinWithSeparator(nsSep: string, names: string[]): string {
  return names.filter(str => Boolean(str)).join(nsSep);
}

export function nsExtractWithSeparator(nsSep: string, qualifiedName: string, nonNamespacePartCount = 0): string {
  qualifiedName = qualifiedName.split("<")[0];
  const nameSplit = qualifiedName.split(nsSep).slice(0, -(1 + nonNamespacePartCount));
  return nameSplit.join(nsSep);
}
