const tap = require('tap');
import Store from '../lib';

const INC = 'INC';
const BAR = 'BAR';
const ADD = 'ADD';

const ADD_METHOD = (start, action) => ({value: start.value + action.add});

tap.test('Store', (storeTest) => {

    storeTest.test('constructor', (conTest) => {

        conTest.test('no arguments', (noArgTest) => {

            var natStore = new Store();

            noArgTest.same(natStore.initial, {}, 'without parameters initial state is empty object');

            noArgTest.end();
        });

        conTest.test('initial argument', (argTest) => {

            var atStore = new Store({foo: 'bar'});

            argTest.same(atStore.initial, {foo: 'bar'});

            argTest.end();
        });

        conTest.test('bad argument', (badTest) => {

            var batStore;
            try {
                batStore = new Store('foo', 'bar');
            } catch (err) {
                badTest.same(err.message, 'must pass object to Store');
            }

            badTest.notOk(batStore, 'store was not created because error was thrown');

            badTest.end();
        });

        conTest.end();
    });

    storeTest.test('#state', (stateTest) => {

        var stStore = new Store({value: 0});

        stStore.addAction(INC, (start) => ({value: start.value + 1}));

        var state = stStore.stateFn();

        stateTest.same(state(null, {type: 'NOOP'}), {value: 0});

        var action = {};
        action.type = INC;
        stateTest.same(state(null, action), {value: 1});

        stateTest.test('(with action params)', (stateArgTest) => {
            // this test uses parameters from the input action
            var satStore = new Store({value: 0});

            satStore.addAction(ADD, ADD_METHOD);

            var wapState = satStore.stateFn();

            stateArgTest.same(wapState(null, {add: 4, type: ADD}), {value: 4});

            stateArgTest.end();
        });

        stateTest.end();
    });

    storeTest.test('#store', (getStateTest) => {

        var gstStore = new Store({value: 0, foo: BAR});

        gstStore.addAction(ADD, ADD_METHOD);

        getStateTest.same(gstStore.getState(), {value: 0, foo: BAR});

        getStateTest.end();
    });

    storeTest.test('#dispatch', (dispatchTest) => {

        var dStore = new Store({value: 0, foo: BAR});

        dStore.addAction(ADD, ADD_METHOD);

        dStore.dispatch(ADD, {add: 5});

        dispatchTest.same(dStore.getState(), {value: 5, foo: BAR});

        dStore.dispatch(ADD, {add: 4});

        dispatchTest.same(dStore.getState(), {value: 9, foo: BAR});

        dispatchTest.test('lazy dispatch', lazyDispatchTest => {

            var store = new Store({value: 0, foo: BAR});

            store.addAction(ADD, ADD_METHOD);

            store.dispatch(ADD, 'add', 5);

            lazyDispatchTest.same(store.getState(), {value: 5, foo: BAR});

            store.dispatch(ADD, 'add', 4);

            lazyDispatchTest.same(store.getState(), {value: 9, foo: BAR});

            lazyDispatchTest.end();
        });

        dispatchTest.end();
    });

    storeTest.test('nested stores', (nestedTest) => {

        var start = {
            one: new Store({value: 0}).addAction(ADD, ADD_METHOD)
        };

        var nStore = new Store(start);

        nestedTest.same(nStore.getState(), {one: {value: 0}});

        nStore.dispatch(`one.${ADD}`, {add: 5});

        nestedTest.same(nStore.getState(), {one: {value: 5}});

        nestedTest.end();
    });

    storeTest.test('subscribe', (subTest) => {

        var subStore = new Store({value: 0, foo: BAR});

        subStore.addAction(ADD, ADD_METHOD);

        var dispatchCount = 0;

        subStore.dispatch(ADD, 'value', 2);

        subTest.equal(dispatchCount, 0);

        var u = subStore.subscribe(() => ++dispatchCount);

        subStore.dispatch(ADD, 'value', 4);

        subTest.equal(dispatchCount, 1);

        u();

        subStore.dispatch(ADD, 'value', 8);

        subTest.equal(dispatchCount, 1);

        subTest.test('nested stores', (nestedTest) => {

            var ntDispatchCount = 0;

            var start = {
                one: new Store({value: 0}).addAction(ADD, ADD_METHOD)
            };

            var store = new Store(start);

            store.subscribe(() => ++ntDispatchCount);

            store.dispatch(`one.${ADD}`, {add: 5});

            nestedTest.equal(ntDispatchCount, 1);

            nestedTest.end();
        });

        subTest.end();
    });

    storeTest.end();

});
