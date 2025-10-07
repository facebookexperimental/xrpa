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


import { DataMapDefinition, StdVectorArrayType, UnityCoordinateSystem, UnrealCoordinateSystem } from "../../index";
import { BuiltinType } from "../../shared/BuiltinTypes";
import { StructWithAccessorType } from "../../shared/StructWithAccessorType";
import { ArrayTypeSpec, TypeMap } from "../../shared/TypeDefinition";
import { genClassDefinition } from "./CppCodeGenImpl";
import { CppModuleDefinition } from "./CppModuleDefinition";

const dataStoreName = "TestDataStore";

function createTestModule(typeMap: TypeMap = {}, localArrayType?: ArrayTypeSpec) {
  const datamap: DataMapDefinition = {
    coordinateSystem: UnrealCoordinateSystem,
    typeMap,
    typeBuckDeps: [],
    localArrayType,
  };

  const moduleDef = new CppModuleDefinition("TestModule", datamap, "./");

  const dataStore = moduleDef.addDataStore({
    dataset: "Test",
    isModuleProgramInterface: true,
    typeMap: datamap.typeMap,
    datamodel: datamodel => {
      datamodel.setStoredCoordinateSystem(UnityCoordinateSystem);
    },
  });

  return { moduleDef, dataStore };
}

function verify<T>(val: T | undefined | null): T {
  expect(val === undefined).toBe(false);
  expect(val === null).toBe(false);
  return val as T;
}

test("Boolean", () => {
  const testModule = createTestModule();
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Boolean));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("bool myFoo = false");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("bool myFoo = false");
  expect(foo.declareLocalVar("", null, "myFoo", 1)).toStrictEqual("bool myFoo = true");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = false;"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 1)).toStrictEqual(["myFoo = true;"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Boolean",
    byteCount: 4,
  });
});

test("Count", () => {
  const testModule = createTestModule();
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Count));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("int myFoo = 0");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("int myFoo = 0");
  expect(foo.declareLocalVar("", null, "myFoo", 10)).toStrictEqual("int myFoo = 10");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = 0;"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 10)).toStrictEqual(["myFoo = 10;"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Count",
    byteCount: 4,
  });
});

test("Timestamp", () => {
  const testModule = createTestModule();
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Timestamp));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("std::chrono::microseconds myFoo{0}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("std::chrono::microseconds myFoo{0}");
  expect(foo.declareLocalVar("", null, "myFoo", 10)).toStrictEqual("std::chrono::microseconds myFoo{10}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = std::chrono::microseconds{0};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 10)).toStrictEqual(["myFoo = std::chrono::microseconds{10};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Timestamp",
    byteCount: 8,
  });
});

test("HiResTimestamp", () => {
  const testModule = createTestModule();
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.HiResTimestamp));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("std::chrono::nanoseconds myFoo{0}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("std::chrono::nanoseconds myFoo{0}");
  expect(foo.declareLocalVar("", null, "myFoo", 10)).toStrictEqual("std::chrono::nanoseconds myFoo{10}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = std::chrono::nanoseconds{0};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 10)).toStrictEqual(["myFoo = std::chrono::nanoseconds{10};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "HiResTimestamp",
    byteCount: 8,
  });
});

test("Enum", () => {
  const testModule = createTestModule();
  const foo = testModule.dataStore.datamodel.addEnum("FooEnum", ["One", "Two", "Three"]);

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore::FooEnum myFoo = TestDataStore::FooEnum::One");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("FooEnum myFoo = FooEnum::One");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo", "Two")).toStrictEqual("FooEnum myFoo = FooEnum::Two");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = TestDataStore::FooEnum::One;"]);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual("static_cast<uint32_t>(myFoo)");
  expect(foo.convertValueToLocal("", null, "myFoo").toString("")).toStrictEqual("static_cast<TestDataStore::FooEnum>(myFoo)");

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "enum class FooEnum: uint32_t {",
    "  One = 0,",
    "  Two = 1,",
    "  Three = 2,",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "FooEnum",
    byteCount: 4,
    enumValues: {
      One: 0,
      Two: 1,
      Three: 2,
    },
  });
});

test("Enum with local mapping", () => {
  const testModule = createTestModule({
    FooEnum: {
      typename: "MyFoo",
      fieldMap: {
        One: "TheOne",
        Two: "TwoWho",
        Three: "MeThree",
      },
    },
  });
  const foo = testModule.dataStore.datamodel.addEnum("FooEnum", ["One", "Two", "Three"]);

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("MyFoo myFoo = MyFoo::TheOne");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("MyFoo myFoo = MyFoo::TheOne");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo", "Two")).toStrictEqual("MyFoo myFoo = MyFoo::TwoWho");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = MyFoo::TheOne;"]);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual("static_cast<uint32_t>(myFoo)");
  expect(foo.convertValueToLocal("", null, "myFoo").toString("")).toStrictEqual("static_cast<MyFoo>(myFoo)");

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "FooEnum",
    byteCount: 4,
    enumValues: {
      One: 0,
      Two: 1,
      Three: 2,
    },
  });
});

test("Struct", () => {
  const testModule = createTestModule();
  const foo = testModule.dataStore.datamodel.addStruct("FooStruct", {
    bar: {
      type: BuiltinType.Count,
      description: "",
      defaultValue: 5,
    },
    baz: {
      type: BuiltinType.Boolean,
      description: "",
      defaultValue: true,
    },
    num: testModule.dataStore.datamodel.addEnum("FooEnum", ["One", "Two", "Three"]),
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore::FooStruct myFoo{5, true, TestDataStore::FooEnum::One}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("FooStruct myFoo{5, true, FooEnum::One}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = TestDataStore::FooStruct{5, true, TestDataStore::FooEnum::One};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSFooStruct {",
    " public:",
    "  static FooStruct readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    int32_t bar = memAccessor.readValue<int32_t>(offset);",
    "    int32_t baz = memAccessor.readValue<int32_t>(offset);",
    "    uint32_t num = memAccessor.readValue<uint32_t>(offset);",
    "    return FooStruct{bar, (baz == 1 ? true : false), static_cast<FooEnum>(num)};",
    "  }",
    "",
    "  static void writeValue(const FooStruct& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<int32_t>(val.bar, offset);",
    "    memAccessor.writeValue<int32_t>((val.baz ? 1 : 0), offset);",
    "    memAccessor.writeValue<uint32_t>(static_cast<uint32_t>(val.num), offset);",
    "  }",
    "};"
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "class FooStruct {",
    " public:",
    "  int bar;",
    "  bool baz;",
    "  FooEnum num;",
    "};",
  ]);

  expect(foo.getHashData()).toStrictEqual({
    name: "FooStruct",
    byteCount: 12,
    fields: {
      bar: "Count",
      baz: "Boolean",
      num: "FooEnum",
    },
  });
});

test("Struct with local struct type mapping", () => {
  // remaps FooStruct to testo::MyStruct, with field renaming and reordering
  const testModule = createTestModule({
    FooStruct: {
      typename: "testo::MyStruct",
      fieldMap: {
        MyBaz: "baz",
        MyBar: "bar",
      }
    },
  });

  const foo = testModule.dataStore.datamodel.addStruct("FooStruct", {
    bar: {
      type: verify(testModule.dataStore.datamodel.getType(BuiltinType.Count)),
      description: "",
      defaultValue: 5,
    },
    baz: {
      type: verify(testModule.dataStore.datamodel.getType(BuiltinType.Boolean)),
      description: "",
      defaultValue: true,
    },
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("testo::MyStruct myFoo{true, 5}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("testo::MyStruct myFoo{true, 5}");
  expect(foo.declareLocalVar("testo", null, "myFoo")).toStrictEqual("MyStruct myFoo{true, 5}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = testo::MyStruct{true, 5};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSFooStruct {",
    " public:",
    "  static testo::MyStruct readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    int32_t bar = memAccessor.readValue<int32_t>(offset);",
    "    int32_t baz = memAccessor.readValue<int32_t>(offset);",
    "    return testo::MyStruct{(baz == 1 ? true : false), bar};",
    "  }",
    "",
    "  static void writeValue(testo::MyStruct val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<int32_t>(val.MyBar, offset);",
    "    memAccessor.writeValue<int32_t>((val.MyBaz ? 1 : 0), offset);",
    "  }",
    "};"
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "FooStruct",
    byteCount: 8,
    fields: {
      bar: "Count",
      baz: "Boolean",
    },
  });
});

test("Struct of semantic types with local type mapping", () => {
  const testModule = createTestModule({
    Vector3: {
      typename: "OVR::Vector3f",
    },
    Quaternion: {
      typename: "OVR::Quatf",
    },
    Pose: {
      typename: "OVR::Posef",
      fieldMap: {
        Rotation: "orientation",
        Translation: "position",
      }
    },
  });
  const foo = testModule.dataStore.datamodel.addStruct("Pose", {
    position: {
      type: verify(testModule.dataStore.datamodel.getType(BuiltinType.Vector3)),
      description: "",
      defaultValue: undefined,
    },
    orientation: {
      type: verify(testModule.dataStore.datamodel.getType(BuiltinType.Quaternion)),
      description: "",
      defaultValue: undefined,
    },
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR::Posef myFoo{OVR::Quatf{0.f, 0.f, 0.f, 1.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR::Posef myFoo{OVR::Quatf{0.f, 0.f, 0.f, 1.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = OVR::Posef{OVR::Quatf{0.f, 0.f, 0.f, 1.f}, OVR::Vector3f{0.f, 0.f, 0.f}};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSPose {",
    " public:",
    "  static OVR::Posef readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    OVR::Vector3f position = DSVector3::readValue(memAccessor, offset);",
    "    OVR::Quatf orientation = DSQuaternion::readValue(memAccessor, offset);",
    "    return OVR::Posef{orientation, position};",
    "  }",
    "",
    "  static void writeValue(const OVR::Posef& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    DSVector3::writeValue(val.Translation, memAccessor, offset);",
    "    DSQuaternion::writeValue(val.Rotation, memAccessor, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Pose",
    byteCount: 28,
    fields: {
      position: "Vector3",
      orientation: "Quaternion",
    },
  });
});

test("Distance", () => {
  const testModule = createTestModule();
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Distance));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("float myFoo = 0.f");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("float myFoo = 0.f");
  expect(foo.declareLocalVar("", null, "myFoo", 1)).toStrictEqual("float myFoo = 100.f"); // note the unit change from meter to centimeter

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = 0.f;"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 1)).toStrictEqual(["myFoo = 100.f;"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSDistance {",
    " public:",
    "  static float readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float value = memAccessor.readValue<float>(offset);",
    "    return value * 100.f;",
    "  }",
    "",
    "  static void writeValue(float val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val / 100.f, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Distance",
    byteCount: 4,
    fields: {
      value: "float",
    },
  });
});

test("Vector3", () => {
  const testModule = createTestModule({
    Vector3: {
      typename: "OVR::Vector3f",
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Vector3));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 0.f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 0.f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0])).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 100.f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = OVR::Vector3f{0.f, 0.f, 0.f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0])).toStrictEqual(["myFoo = OVR::Vector3f{0.f, 0.f, 100.f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSVector3 {",
    " public:",
    "  static OVR::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float x = memAccessor.readValue<float>(offset);",
    "    float y = memAccessor.readValue<float>(offset);",
    "    float z = memAccessor.readValue<float>(offset);",
    "    return OVR::Vector3f{z * 100.f, x * 100.f, y * 100.f};",
    "  }",
    "",
    "  static void writeValue(const OVR::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val.y / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.z / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.x / 100.f, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Vector3",
    byteCount: 12,
    fields: {
      x: "float",
      y: "float",
      z: "float",
    },
  });
});

test("Vector3 with field map", () => {
  const testModule = createTestModule({
    Vector3: {
      typename: "OVR::Vector3f",
      fieldMap: {
        X: "x",
        Y: "y",
        Z: "z",
      }
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Vector3));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 0.f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 0.f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0])).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 100.f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = OVR::Vector3f{0.f, 0.f, 0.f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0])).toStrictEqual(["myFoo = OVR::Vector3f{0.f, 0.f, 100.f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSVector3 {",
    " public:",
    "  static OVR::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float x = memAccessor.readValue<float>(offset);",
    "    float y = memAccessor.readValue<float>(offset);",
    "    float z = memAccessor.readValue<float>(offset);",
    "    return OVR::Vector3f{z * 100.f, x * 100.f, y * 100.f};",
    "  }",
    "",
    "  static void writeValue(const OVR::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val.Y / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.Z / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.X / 100.f, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Vector3",
    byteCount: 12,
    fields: {
      x: "float",
      y: "float",
      z: "float",
    },
  });
});

test("Quaternion with OVR field map", () => {
  const testModule = createTestModule({
    Quaternion: {
      typename: "OVR::Quatf",
      fieldMap: {
        X: "x",
        Y: "y",
        Z: "z",
        W: "w",
      }
    },
  });

  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Quaternion));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR::Quatf myFoo{0.f, 0.f, 0.f, 1.f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR::Quatf myFoo{0.f, 0.f, 0.f, 1.f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0, 0])).toStrictEqual("OVR::Quatf myFoo{0.f, 0.f, 1.f, 0.f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = OVR::Quatf{0.f, 0.f, 0.f, 1.f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0, 0])).toStrictEqual(["myFoo = OVR::Quatf{0.f, 0.f, 1.f, 0.f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSQuaternion {",
    " public:",
    "  static OVR::Quatf readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float x = memAccessor.readValue<float>(offset);",
    "    float y = memAccessor.readValue<float>(offset);",
    "    float z = memAccessor.readValue<float>(offset);",
    "    float w = memAccessor.readValue<float>(offset);",
    "    return OVR::Quatf{z, x, y, w};",
    "  }",
    "",
    "  static void writeValue(const OVR::Quatf& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val.Y, offset);",
    "    memAccessor.writeValue<float>(val.Z, offset);",
    "    memAccessor.writeValue<float>(val.X, offset);",
    "    memAccessor.writeValue<float>(val.W, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Quaternion",
    byteCount: 16,
    fields: {
      x: "float",
      y: "float",
      z: "float",
      w: "float",
    },
  });
});

test("Quaternion with Eigen field map", () => {
  const testModule = createTestModule({
    Quaternion: {
      typename: "Eigen::Quaternionf",
      headerFile: "<Eigen/Eigen>",
      fieldMap: {
        "w()": "w",
        "x()": "x",
        "y()": "y",
        "z()": "z",
      },
    },
  });

  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Quaternion));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("Eigen::Quaternionf myFoo{1.f, 0.f, 0.f, 0.f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Eigen::Quaternionf myFoo{1.f, 0.f, 0.f, 0.f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0, 0])).toStrictEqual("Eigen::Quaternionf myFoo{0.f, 0.f, 0.f, 1.f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = Eigen::Quaternionf{1.f, 0.f, 0.f, 0.f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0, 0])).toStrictEqual(["myFoo = Eigen::Quaternionf{0.f, 0.f, 0.f, 1.f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSQuaternion {",
    " public:",
    "  static Eigen::Quaternionf readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float x = memAccessor.readValue<float>(offset);",
    "    float y = memAccessor.readValue<float>(offset);",
    "    float z = memAccessor.readValue<float>(offset);",
    "    float w = memAccessor.readValue<float>(offset);",
    "    return Eigen::Quaternionf{w, z, x, y};",
    "  }",
    "",
    "  static void writeValue(const Eigen::Quaternionf& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val.y(), offset);",
    "    memAccessor.writeValue<float>(val.z(), offset);",
    "    memAccessor.writeValue<float>(val.x(), offset);",
    "    memAccessor.writeValue<float>(val.w(), offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Quaternion",
    byteCount: 16,
    fields: {
      x: "float",
      y: "float",
      z: "float",
      w: "float",
    },
  });
});

test("UnitVector3", () => {
  const testModule = createTestModule({
    UnitVector3: {
      typename: "OVR::Vector3f",
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.UnitVector3));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR::Vector3f myFoo{1.f, 0.f, 0.f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR::Vector3f myFoo{1.f, 0.f, 0.f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0])).toStrictEqual("OVR::Vector3f myFoo{0.f, 0.f, 1.f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = OVR::Vector3f{1.f, 0.f, 0.f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0])).toStrictEqual(["myFoo = OVR::Vector3f{0.f, 0.f, 1.f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSUnitVector3 {",
    " public:",
    "  static OVR::Vector3f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float x = memAccessor.readValue<float>(offset);",
    "    float y = memAccessor.readValue<float>(offset);",
    "    float z = memAccessor.readValue<float>(offset);",
    "    return OVR::Vector3f{z, x, y};",
    "  }",
    "",
    "  static void writeValue(const OVR::Vector3f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val.y, offset);",
    "    memAccessor.writeValue<float>(val.z, offset);",
    "    memAccessor.writeValue<float>(val.x, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "UnitVector3",
    byteCount: 12,
    fields: {
      x: "float",
      y: "float",
      z: "float",
    },
  });
});

test("Matrix4x4 with field map", () => {
  const testModule = createTestModule({
    Matrix4x4: {
      typename: "Eigen::Matrix4f",
      fieldMap: {
        "coeff(0, 0)": "col0_row0",
        "coeff(1, 0)": "col0_row1",
        "coeff(2, 0)": "col0_row2",
        "coeff(3, 0)": "col0_row3",
        "coeff(0, 1)": "col1_row0",
        "coeff(1, 1)": "col1_row1",
        "coeff(2, 1)": "col1_row2",
        "coeff(3, 1)": "col1_row3",
        "coeff(0, 2)": "col2_row0",
        "coeff(1, 2)": "col2_row1",
        "coeff(2, 2)": "col2_row2",
        "coeff(3, 2)": "col2_row3",
        "coeff(0, 3)": "col3_row0",
        "coeff(1, 3)": "col3_row1",
        "coeff(2, 3)": "col3_row2",
        "coeff(3, 3)": "col3_row3",
      },
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Matrix4x4));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("Eigen::Matrix4f myFoo{1.f, 0.f, 0.f, 0.f, 0.f, 1.f, 0.f, 0.f, 0.f, 0.f, 1.f, 0.f, 0.f, 0.f, 0.f, 1.f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Eigen::Matrix4f myFoo{1.f, 0.f, 0.f, 0.f, 0.f, 1.f, 0.f, 0.f, 0.f, 0.f, 1.f, 0.f, 0.f, 0.f, 0.f, 1.f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = Eigen::Matrix4f{1.f, 0.f, 0.f, 0.f, 0.f, 1.f, 0.f, 0.f, 0.f, 0.f, 1.f, 0.f, 0.f, 0.f, 0.f, 1.f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSMatrix4x4 {",
    " public:",
    "  static Eigen::Matrix4f readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    float col0_row0 = memAccessor.readValue<float>(offset);",
    "    float col0_row1 = memAccessor.readValue<float>(offset);",
    "    float col0_row2 = memAccessor.readValue<float>(offset);",
    "    float col0_row3 = memAccessor.readValue<float>(offset);",
    "    float col1_row0 = memAccessor.readValue<float>(offset);",
    "    float col1_row1 = memAccessor.readValue<float>(offset);",
    "    float col1_row2 = memAccessor.readValue<float>(offset);",
    "    float col1_row3 = memAccessor.readValue<float>(offset);",
    "    float col2_row0 = memAccessor.readValue<float>(offset);",
    "    float col2_row1 = memAccessor.readValue<float>(offset);",
    "    float col2_row2 = memAccessor.readValue<float>(offset);",
    "    float col2_row3 = memAccessor.readValue<float>(offset);",
    "    float col3_row0 = memAccessor.readValue<float>(offset);",
    "    float col3_row1 = memAccessor.readValue<float>(offset);",
    "    float col3_row2 = memAccessor.readValue<float>(offset);",
    "    float col3_row3 = memAccessor.readValue<float>(offset);",
    "    return Eigen::Matrix4f{col2_row2, col2_row0, col2_row1, col2_row3, col0_row2, col0_row0, col0_row1, col0_row3, col1_row2, col1_row0, col1_row1, col1_row3, col3_row2 * 100.f, col3_row0 * 100.f, col3_row1 * 100.f, col3_row3};",
    "  }",
    "",
    "  static void writeValue(const Eigen::Matrix4f& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<float>(val.coeff(1, 1), offset);",
    "    memAccessor.writeValue<float>(val.coeff(2, 1), offset);",
    "    memAccessor.writeValue<float>(val.coeff(0, 1), offset);",
    "    memAccessor.writeValue<float>(val.coeff(3, 1), offset);",
    "    memAccessor.writeValue<float>(val.coeff(1, 2), offset);",
    "    memAccessor.writeValue<float>(val.coeff(2, 2), offset);",
    "    memAccessor.writeValue<float>(val.coeff(0, 2), offset);",
    "    memAccessor.writeValue<float>(val.coeff(3, 2), offset);",
    "    memAccessor.writeValue<float>(val.coeff(1, 0), offset);",
    "    memAccessor.writeValue<float>(val.coeff(2, 0), offset);",
    "    memAccessor.writeValue<float>(val.coeff(0, 0), offset);",
    "    memAccessor.writeValue<float>(val.coeff(3, 0), offset);",
    "    memAccessor.writeValue<float>(val.coeff(1, 3) / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.coeff(2, 3) / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.coeff(0, 3) / 100.f, offset);",
    "    memAccessor.writeValue<float>(val.coeff(3, 3), offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Matrix4x4",
    byteCount: 64,
    fields: {
      col0_row0: "float",
      col0_row1: "float",
      col0_row2: "float",
      col0_row3: "float",
      col1_row0: "float",
      col1_row1: "float",
      col1_row2: "float",
      col1_row3: "float",
      col2_row0: "float",
      col2_row1: "float",
      col2_row2: "float",
      col2_row3: "float",
      col3_row0: "float",
      col3_row1: "float",
      col3_row2: "float",
      col3_row3: "float",
    },
  });
});

test("FixedArray", () => {
  const testModule = createTestModule({
    Distance3: {
      typename: "OVR::Vector3f",
    },
  });
  const foo = testModule.dataStore.datamodel.addFixedArray(
    verify(testModule.dataStore.datamodel.getType(BuiltinType.Distance3)),
    4,
  );

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore::Distance3_4 myFoo{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Distance3_4 myFoo{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = TestDataStore::Distance3_4{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSDistance3_4 {",
    " public:",
    "  static Distance3_4 readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    OVR::Vector3f value0 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value1 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value2 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value3 = DSDistance3::readValue(memAccessor, offset);",
    "    return Distance3_4{value0, value1, value2, value3};",
    "  }",
    "",
    "  static void writeValue(const Distance3_4& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    DSDistance3::writeValue(val.value0, memAccessor, offset);",
    "    DSDistance3::writeValue(val.value1, memAccessor, offset);",
    "    DSDistance3::writeValue(val.value2, memAccessor, offset);",
    "    DSDistance3::writeValue(val.value3, memAccessor, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "class Distance3_4 {",
    " public:",
    "  OVR::Vector3f value0;",
    "  OVR::Vector3f value1;",
    "  OVR::Vector3f value2;",
    "  OVR::Vector3f value3;",
    "};",
  ]);

  expect(foo.getHashData()).toStrictEqual({
    name: "Distance3_4",
    byteCount: 48,
    innerType: "Distance3",
    arraySize: 4,
  });
});

test("FixedArray in a Struct", () => {
  const testModule = createTestModule({
    Distance3: {
      typename: "OVR::Vector3f",
    },
  });
  const bar = testModule.dataStore.datamodel.addFixedArray(BuiltinType.Distance3, 4);
  const foo = testModule.dataStore.datamodel.addStruct("Foo", {
    stuff: bar,
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore::Foo myFoo{TestDataStore::Distance3_4{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Foo myFoo{Distance3_4{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = TestDataStore::Foo{TestDataStore::Distance3_4{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSFoo {",
    " public:",
    "  static Foo readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    Distance3_4 stuff = DSDistance3_4::readValue(memAccessor, offset);",
    "    return Foo{stuff};",
    "  }",
    "",
    "  static void writeValue(const Foo& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    DSDistance3_4::writeValue(val.stuff, memAccessor, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "class Foo {",
    " public:",
    "  Distance3_4 stuff;",
    "};",
  ]);

  expect(foo.getHashData()).toStrictEqual({
    name: "Foo",
    byteCount: 48,
    fields: {
      stuff: "Distance3_4",
    },
  });
});

test("FixedArray with local array type", () => {
  const testModule = createTestModule({
    Distance3: {
      typename: "OVR::Vector3f",
    },
  }, StdVectorArrayType);

  const foo = testModule.dataStore.datamodel.addFixedArray(
    verify(testModule.dataStore.datamodel.getType(BuiltinType.Distance3)),
    4,
  );

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("std::vector<OVR::Vector3f> myFoo{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("std::vector<OVR::Vector3f> myFoo{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo.resize(4);",
    "for (int i = 0; i < 4; ++i) {",
    "  myFoo[i] = OVR::Vector3f{0.f, 0.f, 0.f};",
    "}",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSDistance3_4 {",
    " public:",
    "  static std::vector<OVR::Vector3f> readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    OVR::Vector3f value0 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value1 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value2 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value3 = DSDistance3::readValue(memAccessor, offset);",
    "    return std::vector<OVR::Vector3f>{value0, value1, value2, value3};",
    "  }",
    "",
    "  static void writeValue(const std::vector<OVR::Vector3f>& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    DSDistance3::writeValue(val[0], memAccessor, offset);",
    "    DSDistance3::writeValue(val[1], memAccessor, offset);",
    "    DSDistance3::writeValue(val[2], memAccessor, offset);",
    "    DSDistance3::writeValue(val[3], memAccessor, offset);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Distance3_4",
    byteCount: 48,
    innerType: "Distance3",
    arraySize: 4,
  });
});

test("String", () => {
  const testModule = createTestModule();
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.String));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("std::string myFoo = \"\"");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("std::string myFoo = \"\"");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = \"\";",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "String",
    byteCount: 256,
  });
});


test("String in a Struct", () => {
  const testModule = createTestModule();
  const bar = verify(testModule.dataStore.datamodel.getType(BuiltinType.String));
  const foo = testModule.dataStore.datamodel.addStruct("Foo", {
    stuff: bar,
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore::Foo myFoo{\"\"}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Foo myFoo{\"\"}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = TestDataStore::Foo{\"\"};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSFoo {",
    " public:",
    "  static Foo readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    std::string stuff = memAccessor.readValue<std::string>(offset);",
    "    return Foo{std::move(stuff)};",
    "  }",
    "",
    "  static void writeValue(const Foo& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<std::string>(val.stuff, offset);",
    "  }",
    "",
    "  static int32_t dynSizeOfValue(const Foo& val) {",
    "    return Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(val.stuff);",
    "  }",
    "};",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "class Foo {",
    " public:",
    "  std::string stuff;",
    "};",
  ]);

  expect(foo.getHashData()).toStrictEqual({
    name: "Foo",
    byteCount: 256,
    fields: {
      stuff: "String",
    },
  });
});

test("Reference", () => {
  const testModule = createTestModule();
  const bar = testModule.dataStore.datamodel.addCollection({
    name: "Bar",
    maxCount: 10,
    fields: {
      field1: BuiltinType.Boolean,
    },
  });
  const foo = testModule.dataStore.datamodel.addReference(bar);

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual('Xrpa::ObjectUuid myFoo{0ULL, 0ULL}');

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(['myFoo = Xrpa::ObjectUuid{0ULL, 0ULL};']);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual('myFoo.get() ? myFoo->getXrpaId() : Xrpa::ObjectUuid()');

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Reference<Bar>",
    byteCount: 16,
  });
});

test("Collection", () => {
  const testModule = createTestModule();
  const foo = testModule.dataStore.datamodel.addCollection({
    name: "Foo",
    maxCount: 10,
    fields: {
      bar: {
        type: BuiltinType.Count,
        description: "",
        defaultValue: 5,
      },
      baz: {
        type: BuiltinType.Boolean,
        description: "",
        defaultValue: true,
      },
      click: testModule.dataStore.datamodel.addMessageStruct("ClickMessage", {}, 10),
      add: testModule.dataStore.datamodel.addMessageStruct("AddMessage", {
        count: BuiltinType.Count,
      }, 10),
    },
  });
  testModule.dataStore.addOutputReconciler({
    type: foo,
  });

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);

  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify(foo.genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class FooReader : public Xrpa::ObjectAccessorInterface {",
    " public:",
    "  FooReader() {}",
    "",
    "  explicit FooReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}",
    "",
    "  int getBar() {",
    "    return memAccessor_.readValue<int32_t>(readOffset_);",
    "  }",
    "",
    "  bool getBaz() {",
    "    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);",
    "  }",
    "",
    "  inline bool checkBarChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 1;",
    "  }",
    "",
    "  inline bool checkBazChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 2;",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset readOffset_;",
    "};",
    "",
  ]);

  expect(genClassDefinition(verify(foo.genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class FooWriter : public FooReader {",
    " public:",
    "  FooWriter() {}",
    "",
    "  explicit FooWriter(const Xrpa::MemoryAccessor& memAccessor) : FooReader(memAccessor) {}",
    "",
    "  static FooWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {",
    "    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);",
    "    changeEvent.setCollectionId(collectionId);",
    "    changeEvent.setObjectId(id);",
    "    return FooWriter(changeEvent.accessChangeData());",
    "  }",
    "",
    "  static FooWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {",
    "    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);",
    "    changeEvent.setCollectionId(collectionId);",
    "    changeEvent.setObjectId(id);",
    "    changeEvent.setFieldsChanged(fieldsChanged);",
    "    return FooWriter(changeEvent.accessChangeData());",
    "  }",
    "",
    "  void setBar(int value) {",
    "    memAccessor_.writeValue<int32_t>(value, writeOffset_);",
    "  }",
    "",
    "  void setBaz(bool value) {",
    "    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset writeOffset_;",
    "};",
    "",
  ]);

  const fields = foo.getAllFields();

  expect(fields.click.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.click.type.getHashData()).toStrictEqual({
    name: "ClickMessage",
    byteCount: 0,
    fields: {},
  });

  expect(fields.add.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(fields.add.type.getHashData()).toStrictEqual({
    name: "AddMessage",
    byteCount: 4,
    fields: {
      count: "Count",
    },
  });

  expect(genClassDefinition(verify((fields.add.type as StructWithAccessorType).genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class AddMessageReader : public Xrpa::ObjectAccessorInterface {",
    " public:",
    "  AddMessageReader() {}",
    "",
    "  explicit AddMessageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}",
    "",
    "  int getCount() {",
    "    return memAccessor_.readValue<int32_t>(readOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset readOffset_;",
    "};",
    "",
  ]);

  expect(genClassDefinition(verify((fields.add.type as StructWithAccessorType).genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class AddMessageWriter : public AddMessageReader {",
    " public:",
    "  AddMessageWriter() {}",
    "",
    "  explicit AddMessageWriter(const Xrpa::MemoryAccessor& memAccessor) : AddMessageReader(memAccessor) {}",
    "",
    "  void setCount(int value) {",
    "    memAccessor_.writeValue<int32_t>(value, writeOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset writeOffset_;",
    "};",
    "",
  ]);

  expect(foo.getHashData()).toStrictEqual({
    name: "Foo",
    byteCount: 8,
    fields: {
      bar: "Count",
      baz: "Boolean",
      click: "ClickMessage",
      add: "AddMessage",
    },
    collectionId: 0,
  });
});

test("Collection from Interface", () => {
  const testModule = createTestModule();
  const iBase = testModule.dataStore.datamodel.addInterface({
    name: "IBase",
    fields: {
      jam: BuiltinType.Distance,
      flick: testModule.dataStore.datamodel.addMessageStruct("FlickMessage", {}, 10),
    },
  });
  const foo = testModule.dataStore.datamodel.addCollection({
    name: "Foo",
    maxCount: 10,
    interfaceType: iBase,
    fields: {
      bar: {
        type: BuiltinType.Count,
        description: "",
        defaultValue: 5,
      },
      baz: {
        type: BuiltinType.Boolean,
        description: "",
        defaultValue: true,
      },
      dest: iBase,
      click: testModule.dataStore.datamodel.addMessageStruct("ClickMessage", {}, 10),
      add: testModule.dataStore.datamodel.addMessageStruct("AddMessage", {
        count: BuiltinType.Count,
        source: iBase,
      }, 10),
    },
  });
  testModule.dataStore.addOutputReconciler({
    type: foo,
  });

  expect(iBase.genTypeDefinition(null)).toStrictEqual(null);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);

  expect(iBase.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify(foo.genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class FooReader : public Xrpa::ObjectAccessorInterface {",
    " public:",
    "  FooReader() {}",
    "",
    "  explicit FooReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}",
    "",
    "  float getJam() {",
    "    return DSDistance::readValue(memAccessor_, readOffset_);",
    "  }",
    "",
    "  int getBar() {",
    "    return memAccessor_.readValue<int32_t>(readOffset_);",
    "  }",
    "",
    "  bool getBaz() {",
    "    return (memAccessor_.readValue<int32_t>(readOffset_) == 1 ? true : false);",
    "  }",
    "",
    "  Xrpa::ObjectUuid getDest() {",
    "    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);",
    "  }",
    "",
    "  inline bool checkJamChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 1;",
    "  }",
    "",
    "  inline bool checkBarChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 2;",
    "  }",
    "",
    "  inline bool checkBazChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 4;",
    "  }",
    "",
    "  inline bool checkDestChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 8;",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset readOffset_;",
    "};",
    "",
  ]);

  expect(genClassDefinition(verify(foo.genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class FooWriter : public FooReader {",
    " public:",
    "  FooWriter() {}",
    "",
    "  explicit FooWriter(const Xrpa::MemoryAccessor& memAccessor) : FooReader(memAccessor) {}",
    "",
    "  static FooWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {",
    "    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);",
    "    changeEvent.setCollectionId(collectionId);",
    "    changeEvent.setObjectId(id);",
    "    return FooWriter(changeEvent.accessChangeData());",
    "  }",
    "",
    "  static FooWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {",
    "    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);",
    "    changeEvent.setCollectionId(collectionId);",
    "    changeEvent.setObjectId(id);",
    "    changeEvent.setFieldsChanged(fieldsChanged);",
    "    return FooWriter(changeEvent.accessChangeData());",
    "  }",
    "",
    "  void setJam(float value) {",
    "    DSDistance::writeValue(value, memAccessor_, writeOffset_);",
    "  }",
    "",
    "  void setBar(int value) {",
    "    memAccessor_.writeValue<int32_t>(value, writeOffset_);",
    "  }",
    "",
    "  void setBaz(bool value) {",
    "    memAccessor_.writeValue<int32_t>((value ? 1 : 0), writeOffset_);",
    "  }",
    "",
    "  void setDest(const Xrpa::ObjectUuid& value) {",
    "    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset writeOffset_;",
    "};",
    "",
  ]);

  const fields = foo.getAllFields();

  expect(fields.click.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify((fields.add.type as StructWithAccessorType).genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class AddMessageReader : public Xrpa::ObjectAccessorInterface {",
    " public:",
    "  AddMessageReader() {}",
    "",
    "  explicit AddMessageReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}",
    "",
    "  int getCount() {",
    "    return memAccessor_.readValue<int32_t>(readOffset_);",
    "  }",
    "",
    "  Xrpa::ObjectUuid getSource() {",
    "    return Xrpa::ObjectUuid::readValue(memAccessor_, readOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset readOffset_;",
    "};",
    "",
  ]);

  expect(genClassDefinition(verify((fields.add.type as StructWithAccessorType).genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class AddMessageWriter : public AddMessageReader {",
    " public:",
    "  AddMessageWriter() {}",
    "",
    "  explicit AddMessageWriter(const Xrpa::MemoryAccessor& memAccessor) : AddMessageReader(memAccessor) {}",
    "",
    "  void setCount(int value) {",
    "    memAccessor_.writeValue<int32_t>(value, writeOffset_);",
    "  }",
    "",
    "  void setSource(const Xrpa::ObjectUuid& value) {",
    "    Xrpa::ObjectUuid::writeValue(value, memAccessor_, writeOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset writeOffset_;",
    "};",
    "",
  ]);

  expect(iBase.getHashData()).toStrictEqual({
    name: "IBase",
    byteCount: 4,
    fields: {
      jam: "Distance",
      flick: "FlickMessage",
    },
  });

  expect(foo.getHashData()).toStrictEqual({
    name: "Foo",
    byteCount: 28,
    collectionId: 0,
    fields: {
      jam: "Distance",
      bar: "Count",
      baz: "Boolean",
      dest: "Reference<IBase>",
      flick: "FlickMessage",
      click: "ClickMessage",
      add: "AddMessage",
    },
  });
});

test("Collection containing Strings", () => {
  const testModule = createTestModule();
  const foo = testModule.dataStore.datamodel.addCollection({
    name: "Foo",
    maxCount: 10,
    fields: {
      bar: BuiltinType.String,
      baz: testModule.dataStore.datamodel.addStruct("StringWrap", {
        str: BuiltinType.String,
        levenshtein: BuiltinType.Scalar,
      }),
    },
  });
  testModule.dataStore.addOutputReconciler({
    type: foo,
  });

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);

  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify(foo.genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class FooReader : public Xrpa::ObjectAccessorInterface {",
    " public:",
    "  FooReader() {}",
    "",
    "  explicit FooReader(const Xrpa::MemoryAccessor& memAccessor) : Xrpa::ObjectAccessorInterface(memAccessor) {}",
    "",
    "  std::string getBar() {",
    "    return memAccessor_.readValue<std::string>(readOffset_);",
    "  }",
    "",
    "  StringWrap getBaz() {",
    "    return DSStringWrap::readValue(memAccessor_, readOffset_);",
    "  }",
    "",
    "  inline bool checkBarChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 1;",
    "  }",
    "",
    "  inline bool checkBazChanged(uint64_t fieldsChanged) const {",
    "    return fieldsChanged & 2;",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset readOffset_;",
    "};",
    "",
  ]);

  expect(genClassDefinition(verify(foo.genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "class FooWriter : public FooReader {",
    " public:",
    "  FooWriter() {}",
    "",
    "  explicit FooWriter(const Xrpa::MemoryAccessor& memAccessor) : FooReader(memAccessor) {}",
    "",
    "  static FooWriter create(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint32_t changeByteCount, uint64_t timestamp) {",
    "    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);",
    "    changeEvent.setCollectionId(collectionId);",
    "    changeEvent.setObjectId(id);",
    "    return FooWriter(changeEvent.accessChangeData());",
    "  }",
    "",
    "  static FooWriter update(Xrpa::TransportStreamAccessor* accessor, int32_t collectionId, const Xrpa::ObjectUuid& id, uint64_t fieldsChanged, uint32_t changeByteCount) {",
    "    auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);",
    "    changeEvent.setCollectionId(collectionId);",
    "    changeEvent.setObjectId(id);",
    "    changeEvent.setFieldsChanged(fieldsChanged);",
    "    return FooWriter(changeEvent.accessChangeData());",
    "  }",
    "",
    "  void setBar(const std::string& value) {",
    "    memAccessor_.writeValue<std::string>(value, writeOffset_);",
    "  }",
    "",
    "  void setBaz(const StringWrap& value) {",
    "    DSStringWrap::writeValue(value, memAccessor_, writeOffset_);",
    "  }",
    "",
    " private:",
    "  Xrpa::MemoryOffset writeOffset_;",
    "};",
    "",
  ]);

  const fields = foo.getAllFields();

  expect(fields.baz.type.genTypeDefinition(null)).toStrictEqual([
    "class DSStringWrap {",
    " public:",
    "  static StringWrap readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    std::string str = memAccessor.readValue<std::string>(offset);",
    "    float levenshtein = DSScalar::readValue(memAccessor, offset);",
    "    return StringWrap{std::move(str), levenshtein};",
    "  }",
    "",
    "  static void writeValue(const StringWrap& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<std::string>(val.str, offset);",
    "    DSScalar::writeValue(val.levenshtein, memAccessor, offset);",
    "  }",
    "",
    "  static int32_t dynSizeOfValue(const StringWrap& val) {",
    "    return Xrpa::MemoryAccessor::dynSizeOfValue<std::string>(val.str);",
    "  }",
    "};",
  ]);

  expect(fields.baz.type.getHashData()).toStrictEqual({
    name: "StringWrap",
    byteCount: 260,
    fields: {
      str: "String",
      levenshtein: "Scalar",
    },
  });

  expect(foo.getHashData()).toStrictEqual({
    name: "Foo",
    byteCount: 516,
    fields: {
      bar: "String",
      baz: "StringWrap",
    },
    collectionId: 0,
  });
});
