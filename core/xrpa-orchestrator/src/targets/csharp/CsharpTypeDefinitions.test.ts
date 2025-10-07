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


import { UnityArrayType, UnityCoordinateSystem, UnrealCoordinateSystem } from "../../index";
import { BuiltinType } from "../../shared/BuiltinTypes";
import { DataMapDefinition } from "../../shared/DataMap";
import { StructWithAccessorType } from "../../shared/StructWithAccessorType";
import { ArrayTypeSpec, TypeMap } from "../../shared/TypeDefinition";
import { genClassDefinition } from "./CsharpCodeGenImpl";
import { CsharpModuleDefinition } from "./CsharpModuleDefinition";

const dataStoreName = "TestDataStore";

function createTestModule(typeMap: TypeMap = {}, localArrayType?: ArrayTypeSpec) {
  const datamap: DataMapDefinition = {
    coordinateSystem: UnityCoordinateSystem,
    typeMap, // TypeMap
    typeBuckDeps: [], // buck deps
    localArrayType,
  };

  const moduleDef = new CsharpModuleDefinition(datamap, "TestModule",  "./");

  const dataStore = moduleDef.addDataStore({
    dataset: "Test",
    isModuleProgramInterface: true,
    typeMap: datamap.typeMap,
    datamodel: datamodel => {
      datamodel.setStoredCoordinateSystem(UnrealCoordinateSystem);
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("ulong myFoo = 0UL");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("ulong myFoo = 0UL");
  expect(foo.declareLocalVar("", null, "myFoo", 10)).toStrictEqual("ulong myFoo = 10UL");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = 0UL;"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 10)).toStrictEqual(["myFoo = 10UL;"]);

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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("ulong myFoo = 0UL");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("ulong myFoo = 0UL");
  expect(foo.declareLocalVar("", null, "myFoo", 10)).toStrictEqual("ulong myFoo = 10UL");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = 0UL;"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 10)).toStrictEqual(["myFoo = 10UL;"]);

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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.FooEnum myFoo = TestDataStore.FooEnum.One");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("FooEnum myFoo = FooEnum.One");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo", "Two")).toStrictEqual("FooEnum myFoo = FooEnum.Two");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = TestDataStore.FooEnum.One;"]);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual("(uint)(myFoo)");
  expect(foo.convertValueToLocal("", null, "myFoo").toString("")).toStrictEqual("(TestDataStore.FooEnum)(uint)(myFoo)");

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public enum FooEnum : uint {",
    "  One = 0,",
    "  Two = 1,",
    "  Three = 2,",
    "}",
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("MyFoo myFoo = MyFoo.TheOne");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("MyFoo myFoo = MyFoo.TheOne");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo", "Two")).toStrictEqual("MyFoo myFoo = MyFoo.TwoWho");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = MyFoo.TheOne;"]);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual("(uint)(myFoo)");
  expect(foo.convertValueToLocal("", null, "myFoo").toString("")).toStrictEqual("(MyFoo)(uint)(myFoo)");

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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.FooStruct myFoo = new TestDataStore.FooStruct{bar = 5, baz = true, num = TestDataStore.FooEnum.One}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("FooStruct myFoo = new FooStruct{bar = 5, baz = true, num = FooEnum.One}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new TestDataStore.FooStruct{bar = 5, baz = true, num = TestDataStore.FooEnum.One};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSFooStruct {",
    "  public static FooStruct ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    int bar = memAccessor.ReadInt(offset);",
    "    int baz = memAccessor.ReadInt(offset);",
    "    uint num = memAccessor.ReadUint(offset);",
    "    return new FooStruct{bar = bar, baz = (baz == 1 ? true : false), num = (FooEnum)(uint)(num)};",
    "  }",
    "",
    "  public static void WriteValue(FooStruct val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteInt(val.bar, offset);",
    "    memAccessor.WriteInt((val.baz ? 1 : 0), offset);",
    "    memAccessor.WriteUint((uint)(val.num), offset);",
    "  }",
    "}"
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "public class FooStruct {",
    "  public int bar;",
    "  public bool baz;",
    "  public FooEnum num;",
    "}",
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
  // remaps FooStruct to testo.MyStruct, with field renaming and reordering
  const testModule = createTestModule({
    FooStruct: {
      typename: "testo.MyStruct",
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("testo.MyStruct myFoo = new testo.MyStruct{MyBaz = true, MyBar = 5}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("testo.MyStruct myFoo = new testo.MyStruct{MyBaz = true, MyBar = 5}");
  expect(foo.declareLocalVar("testo", null, "myFoo")).toStrictEqual("MyStruct myFoo = new MyStruct{MyBaz = true, MyBar = 5}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new testo.MyStruct{MyBaz = true, MyBar = 5};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSFooStruct {",
    "  public static testo.MyStruct ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    int bar = memAccessor.ReadInt(offset);",
    "    int baz = memAccessor.ReadInt(offset);",
    "    return new testo.MyStruct{MyBaz = (baz == 1 ? true : false), MyBar = bar};",
    "  }",
    "",
    "  public static void WriteValue(testo.MyStruct val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteInt(val.MyBar, offset);",
    "    memAccessor.WriteInt((val.MyBaz ? 1 : 0), offset);",
    "  }",
    "}"
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
      typename: "OVR.Vector3f",
    },
    Quaternion: {
      typename: "OVR.Quatf",
    },
    Pose: {
      typename: "OVR.Posef",
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR.Posef myFoo = new OVR.Posef{Rotation = new OVR.Quatf{x = 0f, y = 0f, z = 0f, w = 1f}, Translation = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR.Posef myFoo = new OVR.Posef{Rotation = new OVR.Quatf{x = 0f, y = 0f, z = 0f, w = 1f}, Translation = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new OVR.Posef{Rotation = new OVR.Quatf{x = 0f, y = 0f, z = 0f, w = 1f}, Translation = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSPose {",
    "  public static OVR.Posef ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    OVR.Vector3f position = DSVector3.ReadValue(memAccessor, offset);",
    "    OVR.Quatf orientation = DSQuaternion.ReadValue(memAccessor, offset);",
    "    return new OVR.Posef{Rotation = orientation, Translation = position};",
    "  }",
    "",
    "  public static void WriteValue(OVR.Posef val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    DSVector3.WriteValue(val.Translation, memAccessor, offset);",
    "    DSQuaternion.WriteValue(val.Rotation, memAccessor, offset);",
    "  }",
    "}",
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("float myFoo = 0f");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("float myFoo = 0f");
  expect(foo.declareLocalVar("", null, "myFoo", 1)).toStrictEqual("float myFoo = 0.01f"); // note the unit change from meter to centimeter

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = 0f;"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, 1)).toStrictEqual(["myFoo = 0.01f;"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSDistance {",
    "  public static float ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    float value = memAccessor.ReadFloat(offset);",
    "    return value / 100f;",
    "  }",
    "",
    "  public static void WriteValue(float val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteFloat(val * 100f, offset);",
    "  }",
    "}",
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
      typename: "OVR.Vector3f",
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Vector3));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0])).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{x = 0.01f, y = 0f, z = 0f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = new OVR.Vector3f{x = 0f, y = 0f, z = 0f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0])).toStrictEqual(["myFoo = new OVR.Vector3f{x = 0.01f, y = 0f, z = 0f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSVector3 {",
    "  public static OVR.Vector3f ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    float x = memAccessor.ReadFloat(offset);",
    "    float y = memAccessor.ReadFloat(offset);",
    "    float z = memAccessor.ReadFloat(offset);",
    "    return new OVR.Vector3f{x = y / 100f, y = z / 100f, z = x / 100f};",
    "  }",
    "",
    "  public static void WriteValue(OVR.Vector3f val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteFloat(val.z * 100f, offset);",
    "    memAccessor.WriteFloat(val.x * 100f, offset);",
    "    memAccessor.WriteFloat(val.y * 100f, offset);",
    "  }",
    "}",
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
      typename: "OVR.Vector3f",
      fieldMap: {
        X: "x",
        Y: "y",
        Z: "z",
      }
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.Vector3));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{X = 0f, Y = 0f, Z = 0f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{X = 0f, Y = 0f, Z = 0f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0])).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{X = 0.01f, Y = 0f, Z = 0f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = new OVR.Vector3f{X = 0f, Y = 0f, Z = 0f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0])).toStrictEqual(["myFoo = new OVR.Vector3f{X = 0.01f, Y = 0f, Z = 0f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSVector3 {",
    "  public static OVR.Vector3f ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    float x = memAccessor.ReadFloat(offset);",
    "    float y = memAccessor.ReadFloat(offset);",
    "    float z = memAccessor.ReadFloat(offset);",
    "    return new OVR.Vector3f{X = y / 100f, Y = z / 100f, Z = x / 100f};",
    "  }",
    "",
    "  public static void WriteValue(OVR.Vector3f val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteFloat(val.Z * 100f, offset);",
    "    memAccessor.WriteFloat(val.X * 100f, offset);",
    "    memAccessor.WriteFloat(val.Y * 100f, offset);",
    "  }",
    "}",
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

test("UnitVector3", () => {
  const testModule = createTestModule({
    UnitVector3: {
      typename: "OVR.Vector3f",
    },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.UnitVector3));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{x = 0f, y = 1f, z = 0f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{x = 0f, y = 1f, z = 0f}");
  expect(foo.declareLocalVar("", null, "myFoo", [0, 1, 0])).toStrictEqual("OVR.Vector3f myFoo = new OVR.Vector3f{x = 1f, y = 0f, z = 0f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = new OVR.Vector3f{x = 0f, y = 1f, z = 0f};"]);
  expect(foo.resetLocalVarToDefault("", null, "myFoo", false, [0, 1, 0])).toStrictEqual(["myFoo = new OVR.Vector3f{x = 1f, y = 0f, z = 0f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSUnitVector3 {",
    "  public static OVR.Vector3f ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    float x = memAccessor.ReadFloat(offset);",
    "    float y = memAccessor.ReadFloat(offset);",
    "    float z = memAccessor.ReadFloat(offset);",
    "    return new OVR.Vector3f{x = y, y = z, z = x};",
    "  }",
    "",
    "  public static void WriteValue(OVR.Vector3f val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteFloat(val.z, offset);",
    "    memAccessor.WriteFloat(val.x, offset);",
    "    memAccessor.WriteFloat(val.y, offset);",
    "  }",
    "}",
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
      typename: "Eigen.Matrix4f",
      hasInitializerConstructor: true,
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("Eigen.Matrix4f myFoo = new Eigen.Matrix4f{1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Eigen.Matrix4f myFoo = new Eigen.Matrix4f{1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = new Eigen.Matrix4f{1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f};"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSMatrix4x4 {",
    "  public static Eigen.Matrix4f ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    float col0_row0 = memAccessor.ReadFloat(offset);",
    "    float col0_row1 = memAccessor.ReadFloat(offset);",
    "    float col0_row2 = memAccessor.ReadFloat(offset);",
    "    float col0_row3 = memAccessor.ReadFloat(offset);",
    "    float col1_row0 = memAccessor.ReadFloat(offset);",
    "    float col1_row1 = memAccessor.ReadFloat(offset);",
    "    float col1_row2 = memAccessor.ReadFloat(offset);",
    "    float col1_row3 = memAccessor.ReadFloat(offset);",
    "    float col2_row0 = memAccessor.ReadFloat(offset);",
    "    float col2_row1 = memAccessor.ReadFloat(offset);",
    "    float col2_row2 = memAccessor.ReadFloat(offset);",
    "    float col2_row3 = memAccessor.ReadFloat(offset);",
    "    float col3_row0 = memAccessor.ReadFloat(offset);",
    "    float col3_row1 = memAccessor.ReadFloat(offset);",
    "    float col3_row2 = memAccessor.ReadFloat(offset);",
    "    float col3_row3 = memAccessor.ReadFloat(offset);",
    "    return new Eigen.Matrix4f{col1_row1, col1_row2, col1_row0, col1_row3, col2_row1, col2_row2, col2_row0, col2_row3, col0_row1, col0_row2, col0_row0, col0_row3, col3_row1 / 100f, col3_row2 / 100f, col3_row0 / 100f, col3_row3};",
    "  }",
    "",
    "  public static void WriteValue(Eigen.Matrix4f val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteFloat(val.coeff(2, 2), offset);",
    "    memAccessor.WriteFloat(val.coeff(0, 2), offset);",
    "    memAccessor.WriteFloat(val.coeff(1, 2), offset);",
    "    memAccessor.WriteFloat(val.coeff(3, 2), offset);",
    "    memAccessor.WriteFloat(val.coeff(2, 0), offset);",
    "    memAccessor.WriteFloat(val.coeff(0, 0), offset);",
    "    memAccessor.WriteFloat(val.coeff(1, 0), offset);",
    "    memAccessor.WriteFloat(val.coeff(3, 0), offset);",
    "    memAccessor.WriteFloat(val.coeff(2, 1), offset);",
    "    memAccessor.WriteFloat(val.coeff(0, 1), offset);",
    "    memAccessor.WriteFloat(val.coeff(1, 1), offset);",
    "    memAccessor.WriteFloat(val.coeff(3, 1), offset);",
    "    memAccessor.WriteFloat(val.coeff(2, 3) * 100f, offset);",
    "    memAccessor.WriteFloat(val.coeff(0, 3) * 100f, offset);",
    "    memAccessor.WriteFloat(val.coeff(1, 3) * 100f, offset);",
    "    memAccessor.WriteFloat(val.coeff(3, 3), offset);",
    "  }",
    "}",
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
      typename: "OVR.Vector3f",
    },
  });
  const foo = testModule.dataStore.datamodel.addFixedArray(
    verify(testModule.dataStore.datamodel.getType(BuiltinType.Distance3)),
    4,
  );

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.Distance3_4 myFoo = new TestDataStore.Distance3_4{value0 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value1 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value2 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value3 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Distance3_4 myFoo = new Distance3_4{value0 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value1 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value2 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value3 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new TestDataStore.Distance3_4{value0 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value1 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value2 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value3 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSDistance3_4 {",
    "  public static Distance3_4 ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    OVR.Vector3f value0 = DSDistance3.ReadValue(memAccessor, offset);",
    "    OVR.Vector3f value1 = DSDistance3.ReadValue(memAccessor, offset);",
    "    OVR.Vector3f value2 = DSDistance3.ReadValue(memAccessor, offset);",
    "    OVR.Vector3f value3 = DSDistance3.ReadValue(memAccessor, offset);",
    "    return new Distance3_4{value0 = value0, value1 = value1, value2 = value2, value3 = value3};",
    "  }",
    "",
    "  public static void WriteValue(Distance3_4 val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    DSDistance3.WriteValue(val.value0, memAccessor, offset);",
    "    DSDistance3.WriteValue(val.value1, memAccessor, offset);",
    "    DSDistance3.WriteValue(val.value2, memAccessor, offset);",
    "    DSDistance3.WriteValue(val.value3, memAccessor, offset);",
    "  }",
    "}",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "public class Distance3_4 {",
    "  public OVR.Vector3f value0;",
    "  public OVR.Vector3f value1;",
    "  public OVR.Vector3f value2;",
    "  public OVR.Vector3f value3;",
    "}",
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
      typename: "OVR.Vector3f",
    },
  });
  const bar = testModule.dataStore.datamodel.addFixedArray(BuiltinType.Distance3, 4);
  const foo = testModule.dataStore.datamodel.addStruct("Foo", {
    stuff: bar,
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.Foo myFoo = new TestDataStore.Foo{stuff = new TestDataStore.Distance3_4{value0 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value1 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value2 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value3 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Foo myFoo = new Foo{stuff = new Distance3_4{value0 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value1 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value2 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value3 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new TestDataStore.Foo{stuff = new TestDataStore.Distance3_4{value0 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value1 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value2 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, value3 = new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSFoo {",
    "  public static Foo ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    Distance3_4 stuff = DSDistance3_4.ReadValue(memAccessor, offset);",
    "    return new Foo{stuff = stuff};",
    "  }",
    "",
    "  public static void WriteValue(Foo val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    DSDistance3_4.WriteValue(val.stuff, memAccessor, offset);",
    "  }",
    "}",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "public class Foo {",
    "  public Distance3_4 stuff;",
    "}",
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
      typename: "OVR.Vector3f",
    },
  }, UnityArrayType);

  const foo = testModule.dataStore.datamodel.addFixedArray(
    verify(testModule.dataStore.datamodel.getType(BuiltinType.Distance3)),
    4,
  );

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("System.Collections.Generic.List<OVR.Vector3f> myFoo = new System.Collections.Generic.List<OVR.Vector3f>{new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("System.Collections.Generic.List<OVR.Vector3f> myFoo = new System.Collections.Generic.List<OVR.Vector3f>{new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, new OVR.Vector3f{x = 0f, y = 0f, z = 0f}, new OVR.Vector3f{x = 0f, y = 0f, z = 0f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo.Clear();",
    "for (int i = 0; i < 4; ++i) {",
    "  myFoo.Add(new OVR.Vector3f{x = 0f, y = 0f, z = 0f});",
    "}",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSDistance3_4 {",
    "  public static System.Collections.Generic.List<OVR.Vector3f> ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    OVR.Vector3f value0 = DSDistance3.ReadValue(memAccessor, offset);",
    "    OVR.Vector3f value1 = DSDistance3.ReadValue(memAccessor, offset);",
    "    OVR.Vector3f value2 = DSDistance3.ReadValue(memAccessor, offset);",
    "    OVR.Vector3f value3 = DSDistance3.ReadValue(memAccessor, offset);",
    "    return new System.Collections.Generic.List<OVR.Vector3f>{value0, value1, value2, value3};",
    "  }",
    "",
    "  public static void WriteValue(System.Collections.Generic.List<OVR.Vector3f> val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    DSDistance3.WriteValue(val[0], memAccessor, offset);",
    "    DSDistance3.WriteValue(val[1], memAccessor, offset);",
    "    DSDistance3.WriteValue(val[2], memAccessor, offset);",
    "    DSDistance3.WriteValue(val[3], memAccessor, offset);",
    "  }",
    "}",
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("string myFoo = \"\"");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("string myFoo = \"\"");

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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.Foo myFoo = new TestDataStore.Foo{stuff = \"\"}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Foo myFoo = new Foo{stuff = \"\"}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new TestDataStore.Foo{stuff = \"\"};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "public class DSFoo {",
    "  public static Foo ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    string stuff = memAccessor.ReadString(offset);",
    "    return new Foo{stuff = stuff};",
    "  }",
    "",
    "  public static void WriteValue(Foo val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {",
    "    memAccessor.WriteString(val.stuff, offset);",
    "  }",
    "",
    "  public static int DynSizeOfValue(Foo val) {",
    "    return Xrpa.MemoryAccessor.DynSizeOfString(val.stuff);",
    "  }",
    "}",
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual([
    "public class Foo {",
    "  public string stuff;",
    "}",
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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual('Xrpa.ObjectUuid myFoo = new Xrpa.ObjectUuid{ID0 = 0UL, ID1 = 0UL}');

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(['myFoo = new Xrpa.ObjectUuid{ID0 = 0UL, ID1 = 0UL};']);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual('myFoo?.GetXrpaId() ?? new Xrpa.ObjectUuid()');

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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.Foo myFoo = new TestDataStore.Foo{bar = 5, baz = true}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Foo myFoo = new Foo{bar = 5, baz = true}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new TestDataStore.Foo{bar = 5, baz = true};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);

  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify(foo.genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "public class FooReader : Xrpa.ObjectAccessorInterface {",
    "  private Xrpa.MemoryOffset _readOffset = new();",
    "",
    "  public FooReader() {}",
    "",
    "  public FooReader(Xrpa.MemoryAccessor memAccessor) {",
    "    SetAccessor(memAccessor);",
    "  }",
    "",
    "  public int GetBar() {",
    "    return _memAccessor.ReadInt(_readOffset);",
    "  }",
    "",
    "  public bool GetBaz() {",
    "    return (_memAccessor.ReadInt(_readOffset) == 1 ? true : false);",
    "  }",
    "",
    "  public bool CheckBarChanged(ulong fieldsChanged) {",
    "    return (fieldsChanged & 1) != 0;",
    "  }",
    "",
    "  public bool CheckBazChanged(ulong fieldsChanged) {",
    "    return (fieldsChanged & 2) != 0;",
    "  }",
    "}",
    "",
  ]);

  expect(genClassDefinition(verify(foo.genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "public class FooWriter : FooReader {",
    "  private Xrpa.MemoryOffset _writeOffset = new();",
    "",
    "  public FooWriter() {}",
    "",
    "  public FooWriter(Xrpa.MemoryAccessor memAccessor) {",
    "    SetAccessor(memAccessor);",
    "  }",
    "",
    "  public static FooWriter Create(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, int changeByteCount, ulong timestamp) {",
    "    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionChangeEventAccessor>((int)Xrpa.CollectionChangeType.CreateObject, changeByteCount, timestamp);",
    "    changeEvent.SetCollectionId(collectionId);",
    "    changeEvent.SetObjectId(id);",
    "    return new FooWriter(changeEvent.AccessChangeData());",
    "  }",
    "",
    "  public static FooWriter Update(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, ulong fieldsChanged, int changeByteCount) {",
    "    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionUpdateChangeEventAccessor>((int)Xrpa.CollectionChangeType.UpdateObject, changeByteCount);",
    "    changeEvent.SetCollectionId(collectionId);",
    "    changeEvent.SetObjectId(id);",
    "    changeEvent.SetFieldsChanged(fieldsChanged);",
    "    return new FooWriter(changeEvent.AccessChangeData());",
    "  }",
    "",
    "  public void SetBar(int value) {",
    "    _memAccessor.WriteInt(value, _writeOffset);",
    "  }",
    "",
    "  public void SetBaz(bool value) {",
    "    _memAccessor.WriteInt((value ? 1 : 0), _writeOffset);",
    "  }",
    "}",
    "",
  ]);

  const fields = foo.getAllFields();

  expect(fields.click.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify((fields.add.type as StructWithAccessorType).genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "public class AddMessageReader : Xrpa.ObjectAccessorInterface {",
    "  private Xrpa.MemoryOffset _readOffset = new();",
    "",
    "  public AddMessageReader() {}",
    "",
    "  public AddMessageReader(Xrpa.MemoryAccessor memAccessor) {",
    "    SetAccessor(memAccessor);",
    "  }",
    "",
    "  public int GetCount() {",
    "    return _memAccessor.ReadInt(_readOffset);",
    "  }",
    "}",
    "",
  ]);

  expect(genClassDefinition(verify((fields.add.type as StructWithAccessorType).genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "public class AddMessageWriter : AddMessageReader {",
    "  private Xrpa.MemoryOffset _writeOffset = new();",
    "",
    "  public AddMessageWriter() {}",
    "",
    "  public AddMessageWriter(Xrpa.MemoryAccessor memAccessor) {",
    "    SetAccessor(memAccessor);",
    "  }",
    "",
    "  public void SetCount(int value) {",
    "    _memAccessor.WriteInt(value, _writeOffset);",
    "  }",
    "}",
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
      click: testModule.dataStore.datamodel.addMessageStruct("ClickMessage", {}, 10),
      add: testModule.dataStore.datamodel.addMessageStruct("AddMessage", {
        count: BuiltinType.Count,
      }, 10),
    },
  });

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TestDataStore.Foo myFoo = new TestDataStore.Foo{jam = 0f, bar = 5, baz = true}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("Foo myFoo = new Foo{jam = 0f, bar = 5, baz = true}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = new TestDataStore.Foo{jam = 0f, bar = 5, baz = true};",
  ]);

  expect(iBase.genTypeDefinition(null)).toStrictEqual(null);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);

  expect(iBase.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(genClassDefinition(verify(foo.genReadAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "public class FooReader : Xrpa.ObjectAccessorInterface {",
    "  private Xrpa.MemoryOffset _readOffset = new();",
    "",
    "  public FooReader() {}",
    "",
    "  public FooReader(Xrpa.MemoryAccessor memAccessor) {",
    "    SetAccessor(memAccessor);",
    "  }",
    "",
    "  public float GetJam() {",
    "    return DSDistance.ReadValue(_memAccessor, _readOffset);",
    "  }",
    "",
    "  public int GetBar() {",
    "    return _memAccessor.ReadInt(_readOffset);",
    "  }",
    "",
    "  public bool GetBaz() {",
    "    return (_memAccessor.ReadInt(_readOffset) == 1 ? true : false);",
    "  }",
    "",
    "  public bool CheckJamChanged(ulong fieldsChanged) {",
    "    return (fieldsChanged & 1) != 0;",
    "  }",
    "",
    "  public bool CheckBarChanged(ulong fieldsChanged) {",
    "    return (fieldsChanged & 2) != 0;",
    "  }",
    "",
    "  public bool CheckBazChanged(ulong fieldsChanged) {",
    "    return (fieldsChanged & 4) != 0;",
    "  }",
    "}",
    "",
  ]);

  expect(genClassDefinition(verify(foo.genWriteAccessorDefinition(dataStoreName, null)))).toStrictEqual([
    "public class FooWriter : FooReader {",
    "  private Xrpa.MemoryOffset _writeOffset = new();",
    "",
    "  public FooWriter() {}",
    "",
    "  public FooWriter(Xrpa.MemoryAccessor memAccessor) {",
    "    SetAccessor(memAccessor);",
    "  }",
    "",
    "  public static FooWriter Create(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, int changeByteCount, ulong timestamp) {",
    "    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionChangeEventAccessor>((int)Xrpa.CollectionChangeType.CreateObject, changeByteCount, timestamp);",
    "    changeEvent.SetCollectionId(collectionId);",
    "    changeEvent.SetObjectId(id);",
    "    return new FooWriter(changeEvent.AccessChangeData());",
    "  }",
    "",
    "  public static FooWriter Update(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, ulong fieldsChanged, int changeByteCount) {",
    "    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionUpdateChangeEventAccessor>((int)Xrpa.CollectionChangeType.UpdateObject, changeByteCount);",
    "    changeEvent.SetCollectionId(collectionId);",
    "    changeEvent.SetObjectId(id);",
    "    changeEvent.SetFieldsChanged(fieldsChanged);",
    "    return new FooWriter(changeEvent.AccessChangeData());",
    "  }",
    "",
    "  public void SetJam(float value) {",
    "    DSDistance.WriteValue(value, _memAccessor, _writeOffset);",
    "  }",
    "",
    "  public void SetBar(int value) {",
    "    _memAccessor.WriteInt(value, _writeOffset);",
    "  }",
    "",
    "  public void SetBaz(bool value) {",
    "    _memAccessor.WriteInt((value ? 1 : 0), _writeOffset);",
    "  }",
    "}",
    "",
  ]);

  const fields = foo.getAllFields();

  expect(fields.click.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genTypeDefinition(null)).toStrictEqual(null);

  expect(fields.add.type.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

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
    byteCount: 12,
    collectionId: 0,
    fields: {
      jam: "Distance",
      bar: "Count",
      baz: "Boolean",
      flick: "FlickMessage",
      click: "ClickMessage",
      add: "AddMessage",
    },
  });
});
