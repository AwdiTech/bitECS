import { strictEqual } from 'assert';
import {
	exitQuery,
	Types,
	createWorld,
	addEntity,
	removeEntity,
	resetGlobals,
	addComponent,
	removeComponent,
	defineComponent,
	Changed,
	defineQuery,
	enterQuery,
	Not,
	defineEnterQueue,
	defineExitQueue,
	registerQuery,
	query,
	SYMBOLS,
} from '../../src/index.js';
import { describe, it, afterEach, expect } from 'vitest';

describe('Query Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('should define a query and return matching eids', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);
		const eid = addEntity(world);
		addComponent(world, TestComponent, eid);

		let ents = query(world);

		strictEqual(ents.length, 1);
		strictEqual(ents[0], 0);

		removeEntity(world, eid);

		ents = query(world);
		strictEqual(ents.length, 0);
	});

	it('should define a query with Not and return matching eids', () => {
		const world = createWorld();
		const Foo = defineComponent({ value: Types.f32 });
		const notFooQuery = defineQuery([Not(Foo)]);

		const eid0 = addEntity(world);

		let ents = notFooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], eid0);

		addComponent(world, Foo, eid0);

		ents = notFooQuery(world);
		strictEqual(ents.length, 0);

		const eid1 = addEntity(world);

		ents = notFooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], eid1);

		removeEntity(world, eid1);

		ents = notFooQuery(world);
		strictEqual(ents.length, 0);
	});

	it('should correctly populate Not queries when adding/removing components', () => {
		const world = createWorld();

		const Foo = defineComponent();
		const Bar = defineComponent();

		const fooQuery = defineQuery([Foo]);
		const notFooQuery = defineQuery([Not(Foo)]);

		const fooBarQuery = defineQuery([Foo, Bar]);
		const notFooBarQuery = defineQuery([Not(Foo), Not(Bar)]);

		const eid0 = addEntity(world);
		const eid1 = addEntity(world);
		const eid2 = addEntity(world);

		/* initial state */

		// foo query should have nothing
		let ents = fooQuery(world);
		strictEqual(ents.length, 0);

		// notFoo query should have eid 0, 1, and 2
		ents = notFooQuery(world);
		strictEqual(ents.length, 3);
		strictEqual(ents[0], 0);
		strictEqual(ents[1], 1);
		strictEqual(ents[2], 2);

		/* add components */

		addComponent(world, Foo, eid0);

		addComponent(world, Bar, eid1);

		addComponent(world, Foo, eid2);
		addComponent(world, Bar, eid2);

		// now fooQuery should have eid 0 & 2
		ents = fooQuery(world);
		strictEqual(ents.length, 2);
		strictEqual(ents[0], 0);
		strictEqual(ents[1], 2);

		// fooBarQuery should only have eid 2
		ents = fooBarQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 2);

		// notFooBarQuery should have nothing
		ents = notFooBarQuery(world);
		strictEqual(ents.length, 0);

		// and notFooQuery should have eid 1
		ents = notFooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 1);

		/* remove components */

		removeComponent(world, Foo, eid0);

		// now fooQuery should only have eid 2
		ents = fooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 2);

		// notFooQuery should have eid 0 & 1
		ents = notFooQuery(world);
		strictEqual(ents.length, 2);
		strictEqual(ents[0], 1);
		strictEqual(ents[1], 0);

		// fooBarQuery should still only have eid 2
		ents = fooBarQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 2);

		// notFooBarQuery should only have eid 0
		ents = notFooBarQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 0);

		/* remove more components */

		removeComponent(world, Foo, eid2);
		removeComponent(world, Bar, eid2);

		// notFooBarQuery should have eid 0 & 2
		ents = notFooBarQuery(world);
		strictEqual(ents.length, 2);
		strictEqual(ents[0], 0);
		strictEqual(ents[1], 2);

		// and notFooQuery should have eid 1, 0, & 2
		ents = notFooQuery(world);
		strictEqual(ents.length, 3);
		strictEqual(ents[0], 1);
		strictEqual(ents[1], 0);
		strictEqual(ents[2], 2);
	});

	it('should define a query with Changed and return matching eids whose component state has changed', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([Changed(TestComponent)]);
		const eid1 = addEntity(world);
		const eid2 = addEntity(world);
		addComponent(world, TestComponent, eid1);
		addComponent(world, TestComponent, eid2);

		let ents = query(world);
		strictEqual(ents.length, 0);

		TestComponent.value[eid1]++;

		ents = query(world);

		strictEqual(ents.length, 1);
		strictEqual(ents[0], eid1);
	});

	it('should define a query for an array component with Changed and return matching eids whose component state has changed', () => {
		const world = createWorld();
		const ArrayComponent = defineComponent({ value: [Types.f32, 3] });
		const query = defineQuery([Changed(ArrayComponent)]);
		const eid1 = addEntity(world);
		const eid2 = addEntity(world);
		addComponent(world, ArrayComponent, eid1);
		addComponent(world, ArrayComponent, eid2);

		let ents = query(world);
		strictEqual(ents.length, 0);

		ArrayComponent.value[eid1][1]++;

		ents = query(world);

		strictEqual(ents.length, 1);
		strictEqual(ents[0], eid1);
	});

	it('should return entities from enter/exitQuery who entered/exited the query', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);
		const enteredQuery = enterQuery(query);
		const exitedQuery = exitQuery(query);

		const eid = addEntity(world);
		addComponent(world, TestComponent, eid);

		const entered = enteredQuery(world);
		strictEqual(entered.length, 1);
		strictEqual(entered[0], 0);

		let ents = query(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 0);

		removeEntity(world, eid);

		ents = query(world);
		strictEqual(ents.length, 0);

		const exited = exitedQuery(world);
		strictEqual(exited.length, 1);
		strictEqual(exited[0], 0);
	});

	it("shouldn't pick up entities in enterQuery after adding a component a second time", () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);
		const enteredQuery = enterQuery(query);

		const eid = addEntity(world);
		addComponent(world, TestComponent, eid);

		const entered = enteredQuery(world);
		strictEqual(entered.length, 1);

		addComponent(world, TestComponent, eid);

		const entered2 = enteredQuery(world);
		strictEqual(entered2.length, 0);
	});

	it('should define independent enter queues', () => {
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);

		const enteredQueryA = defineEnterQueue(query);
		const enteredQueryB = defineEnterQueue(query);

		// This tests creating the world after the query and queues have been defined.
		const world = createWorld();

		const eidA = addEntity(world);
		const eidB = addEntity(world);
		addComponent(world, TestComponent, eidA);

		let enteredA = enteredQueryA(world);

		strictEqual(enteredA.length, 1);

		addComponent(world, TestComponent, eidB);

		enteredA = enteredQueryA(world);
		let enteredB = enteredQueryB(world);

		strictEqual(enteredA.length, 1);
		strictEqual(enteredB.length, 2);
	});

	it('should define independent exit queues', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);

		const exitedQueryA = defineExitQueue(query);
		const exitedQueryB = defineExitQueue(query);

		const eidA = addEntity(world);
		const eidB = addEntity(world);
		addComponent(world, TestComponent, eidA);
		addComponent(world, TestComponent, eidB);

		let exitedA = exitedQueryA(world);

		strictEqual(exitedA.length, 0);

		removeComponent(world, TestComponent, eidA);

		exitedA = exitedQueryA(world);
		let exitedB = exitedQueryB(world);

		strictEqual(exitedA.length, 1);
		strictEqual(exitedB.length, 1);
	});

	it('should optionally not drain queues when read', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });

		const query = defineQuery([TestComponent]);
		const enteredQuery = defineEnterQueue(query);

		const eid = addEntity(world);
		addComponent(world, TestComponent, eid);

		let entered = enteredQuery(world, false);
		strictEqual(entered.length, 1);

		entered = enteredQuery(world, false);
		strictEqual(entered.length, 1);

		entered = enteredQuery(world, true);
		strictEqual(entered.length, 1);

		entered = enteredQuery(world, false);
		strictEqual(entered.length, 0);
	});

	it('should work inline no matter the order of components', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const FooComponent = defineComponent({ value: Types.f32 });
		const BarComponent = defineComponent({ value: Types.f32 });

		const eid = addEntity(world);

		let eids = query(world, [TestComponent, FooComponent, BarComponent]);
		strictEqual(eids.length, 0);

		addComponent(world, TestComponent, eid);
		addComponent(world, FooComponent, eid);
		addComponent(world, BarComponent, eid);

		eids = query(world, [TestComponent, BarComponent, FooComponent]);

		strictEqual(eids.length, 1);

		eids = query(world, [FooComponent, TestComponent, BarComponent]);

		strictEqual(eids.length, 1);

		// Should only be one hash even though the order of components is different.
		expect(world[SYMBOLS.$queriesHashMap].size).toBe(1);
	});
});
