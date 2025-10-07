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


import { UnityCoordinateSystem, UnrealArrayType, UnrealCoordinateSystem } from "../../index";
import { BuiltinType } from "../../shared/BuiltinTypes";
import { DataMapDefinition } from "../../shared/DataMap";
import { StructWithAccessorType } from "../../shared/StructWithAccessorType";
import { ArrayTypeSpec, TypeMap } from "../../shared/TypeDefinition";
import { genClassDefinition } from "../cpp/CppCodeGenImpl";
import { UepluginModuleDefinition } from "./UepluginModuleDefinition";

const dataStoreName = "TestDataStore";

function createTestModule(typeMap: TypeMap = {}, localArrayType?: ArrayTypeSpec) {
  const datamap: DataMapDefinition = {
    coordinateSystem: UnrealCoordinateSystem,
    typeMap, // TypeMap
    typeBuckDeps: [], // buck deps
    localArrayType,
  };

  const moduleDef = new UepluginModuleDefinition("TestModule", datamap, ".", {});

  const dataStore = moduleDef.addDataStore({
    dataset: "Test",
    isModuleProgramInterface: false,
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

test("Enum", () => {
  const testModule = createTestModule();
  const foo = testModule.dataStore.datamodel.addEnum("FooEnum", ["One", "Two", "Three"]);

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("ETestFooEnum myFoo = ETestFooEnum::One");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("ETestFooEnum myFoo = ETestFooEnum::One");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo", "Two")).toStrictEqual("ETestFooEnum myFoo = ETestFooEnum::Two");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(["myFoo = ETestFooEnum::One;"]);

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);
  expect(foo.genTargetSpecificTypeDefinition(dataStoreName, null)).toStrictEqual([
    "UENUM(BlueprintType)",
    "enum class ETestFooEnum: uint8 {",
    '  One = 0             UMETA(DisplayName="One"),',
    '  Two = 1             UMETA(DisplayName="Two"),',
    '  Three = 2           UMETA(DisplayName="Three"),',
    "};",
  ]);

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

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("FTestFooStruct myFoo{5, true}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("FTestFooStruct myFoo{5, true}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = FTestFooStruct{5, true};",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSFooStruct {",
    " public:",
    "  static FTestFooStruct readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    int32_t bar = memAccessor.readValue<int32_t>(offset);",
    "    int32_t baz = memAccessor.readValue<int32_t>(offset);",
    "    return FTestFooStruct{bar, (baz == 1 ? true : false)};",
    "  }",
    "",
    "  static void writeValue(FTestFooStruct val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    memAccessor.writeValue<int32_t>(val.bar, offset);",
    "    memAccessor.writeValue<int32_t>((val.baz ? 1 : 0), offset);",
    "  }",
    "};"
  ]);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);
  expect(foo.genTargetSpecificTypeDefinition(dataStoreName, null)).toStrictEqual([
    "USTRUCT(BlueprintType)",
    "struct FTestFooStruct {",
    "  GENERATED_BODY()",
    "",
    "  UPROPERTY(EditAnywhere, BlueprintReadWrite)",
    "  int bar = 5;",
    "",
    "  UPROPERTY(EditAnywhere, BlueprintReadWrite)",
    "  bool baz = true;",
    "",
    "};",
  ]);

  expect(foo.getHashData()).toStrictEqual({
    name: "FooStruct",
    byteCount: 8,
    fields: {
      bar: "Count",
      baz: "Boolean",
    },
  });
});

test("Reference to collection", () => {
  const testModule = createTestModule();
  const bar = testModule.dataStore.datamodel.addCollection({
    name: "Bar",
    maxCount: 10,
    fields: {
      field1: BuiltinType.Boolean
    },
  });
  testModule.dataStore.addOutputReconciler({
    type: bar,
    componentProps: {
      basetype: "SceneComponent",
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

test("Reference to interface", () => {
  const testModule = createTestModule();
  const bar = testModule.dataStore.datamodel.addInterface({
    name: "IBar",
    fields: {
      field1: BuiltinType.Boolean,
    },
  });
  const fooCollection = testModule.dataStore.datamodel.addCollection({
    name: "Foo",
    maxCount: 10,
    interfaceType: bar,
    fields: {
      click: testModule.dataStore.datamodel.addMessageStruct("ClickMessage", {}, 10),
    },
  });
  testModule.dataStore.addOutputReconciler({
    type: fooCollection,
    componentProps: {
      basetype: "SceneComponent",
    },
  });

  const foo = testModule.dataStore.datamodel.addReference(bar);
  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual('Xrpa::ObjectUuid myFoo{0ULL, 0ULL}');

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual(['myFoo = Xrpa::ObjectUuid{0ULL, 0ULL};']);

  expect(foo.convertValueFromLocal("", null, "myFoo").toString("")).toStrictEqual('myFoo.get() ? myFoo->getXrpaId() : Xrpa::ObjectUuid()');

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "Reference<IBar>",
    byteCount: 16,
  });
});

test("FixedArray with local array type", () => {
  const testModule = createTestModule({
    Distance3: {
      typename: "OVR::Vector3f",
    },
  }, UnrealArrayType);

  const foo = testModule.dataStore.datamodel.addFixedArray(
    verify(testModule.dataStore.datamodel.getType(BuiltinType.Distance3)),
    4,
  );

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("TArray<OVR::Vector3f> myFoo{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("TArray<OVR::Vector3f> myFoo{OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}, OVR::Vector3f{0.f, 0.f, 0.f}}");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo.SetNum(4);",
    "for (int i = 0; i < 4; ++i) {",
    "  myFoo[i] = OVR::Vector3f{0.f, 0.f, 0.f};",
    "}",
  ]);

  expect(foo.genTypeDefinition(null)).toStrictEqual([
    "class DSDistance3_4 {",
    " public:",
    "  static TArray<OVR::Vector3f> readValue(const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
    "    OVR::Vector3f value0 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value1 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value2 = DSDistance3::readValue(memAccessor, offset);",
    "    OVR::Vector3f value3 = DSDistance3::readValue(memAccessor, offset);",
    "    return TArray<OVR::Vector3f>{value0, value1, value2, value3};",
    "  }",
    "",
    "  static void writeValue(const TArray<OVR::Vector3f>& val, const Xrpa::MemoryAccessor& memAccessor, Xrpa::MemoryOffset& offset) {",
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

test("String with local string type", () => {
  const testModule = createTestModule({
    String: { typename: "FString", headerFile: "Engine.h", conversionOperator: "FStringAdaptor" },
  });
  const foo = verify(testModule.dataStore.datamodel.getType(BuiltinType.String));

  expect(foo.declareLocalVar("", null, "myFoo")).toStrictEqual("FString myFoo = \"\"");
  expect(foo.declareLocalVar(dataStoreName, null, "myFoo")).toStrictEqual("FString myFoo = \"\"");

  expect(foo.resetLocalVarToDefault("", null, "myFoo")).toStrictEqual([
    "myFoo = \"\";",
  ]);

  expect(`${foo.convertValueToLocal("", null, "myFoo")}`).toStrictEqual("FStringAdaptor(myFoo)");

  expect(foo.genTypeDefinition(null)).toStrictEqual(null);
  expect(foo.genLocalTypeDefinition(dataStoreName, null)).toStrictEqual(null);

  expect(foo.getHashData()).toStrictEqual({
    name: "String",
    byteCount: 256,
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
    componentProps: {
      basetype: "SceneComponent",
    },
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
      flick: "FlickMessage",
      bar: "Count",
      baz: "Boolean",
      dest: "Reference<IBase>",
      click: "ClickMessage",
      add: "AddMessage",
    },
  });
});
