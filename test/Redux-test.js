const redux = require('redux');
const tap = require('tap');

/**
 * mostly validating basic functionality with redux
 */

const INC = 'INC';
const DEC = 'DEC';
const SAME = 'SAME';
const INITIAL_STATE = {value: 0};
const state = (pState, action) => {
    var update = {};
    var value = pState ? pState.value : 0;
    update.value = value;

    switch (action.type) {
        case INC:
            update.value = ++value;
            break;

        case DEC:
            update.value = --value;
            break;

        case SAME:
            // do not change value -- a noop
            break;
    }

    return Object.assign({}, pState || INITIAL_STATE, update);
};

tap.test('redux', (reduxTap) => {

    reduxTap.test('initial state', (initialTap) => {
        const store = redux.createStore(state);

        var myState = store.getState();

        initialTap.isEqual(myState.value, 0, 'value starts at 0');

        initialTap.end();
    });

    reduxTap.test('INC', (INCtap) => {

        const store = redux.createStore(state);
        store.dispatch({type: INC});

        var myState = store.getState();

        INCtap.isEqual(myState.value, 1, 'value increments to 1');

        INCtap.end();
    });

    reduxTap.end();
});
