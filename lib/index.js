var redux = require('redux');
const NESTED = /^([^.]*)\.(.+)$/;
const _______PING = '_______PING'; // ping is a "noop" action that is used to update subscribers when a child state is acted on.

class Action {
    constructor(pStore, pName, pFn) {
        this.store = pStore;
        this.name = pName;
        this.fn = pFn;
        this._frozen = false;
    }

    update(action, state) {
        return this.fn(action, state);
    }
}

class Store {
    constructor(initial) {
        if (initial && !(typeof initial === 'object')) {
            throw new Error('must pass object to Store');
        }
        this.initial = initial || {};

        this._actions = new Map();
        this._unsubs = [];
        this.addAction(_______PING, () => {
            }
        )
        ;
    }

    get store() {
        if (!this._store) {
            this._store = redux.createStore(this.stateFn());
        }

        return this._store;
    }

    getState(raw) {
        return raw ? this.store.getState() : this.toJSON();
    }

    clear(key) {
        this._actions.delete(key);
    }

    subscribe(handler) {
        const unsub = this.store.subscribe(handler);

        this._unsubs.push(unsub);
        return unsub;
    }

    /**
     * remove all the listeners to state change
     * recurse to any sub-states.
     */
    destroy() {
        for (var unsub of this._unsubs) {
            unsub();
        }

        var state = this.getState(true);

        for (var prop in state) {
            if (state[prop] instanceof Store) {
                state[prop].destroy();
            }
        }
        this._frozen = true;
    }

    toJSON() {
        if (this._frozen) {
            return null;
        }

        var out = Object.assign({}, this.store.getState());
        for (var prop in out) {
            if (!(prop && out.hasOwnProperty(prop))) {
                continue;
            }

            var value = out[prop];
            if (value instanceof Store) {
                out[prop] = value.toJSON();
            }
        }

        return out;
    }

    dispatch(action, pData, value) {
        if (this._frozen) {
            throw new Error('state is destroyed; can no longer dispatch');
        }
        var data = pData;
        if (typeof pData === 'string' && arguments.length > 2) {
            data = {};
            data[pData] = value;
        }
        var update;
        if (typeof action === 'string') {
            update = Object.assign({}, data, {type: action});
        } else if (action && typeof action === 'object') {
            update = action;
        } else {
            throw new Error('bad action');
        }

        if (NESTED.test(update.type)) {
            var match = NESTED.exec(update.type);
            const key = match[1];
            const nValue = this.getState(true)[key];
            if (nValue instanceof Store) {
                const subType = match[2];
                update.type = subType;
                nValue.dispatch(update);
                this.dispatch(_______PING); // to alert subsrcribers
                return;
            }
        }
        this.store.dispatch(update);

        return this;
    }

    set initial(i) {
        this._initial = i;
    }

    get initial() {
        return this._initial;
    }

    addAction(name, transformFn) {
        if (this._frozen) {
            throw new Error('state is destroyed; can no longer add actions');
        }
        const action = new Action(this, name, transformFn);
        this._actions.set(name, action);
        return this;
    }


    stateFn() {
        return (pState, action) => {
            var start = Object.assign({}, pState || this.initial);
            // cloning start state so that action updates cannot inadvertantly mutate the input

            if (this._actions.has(action.type)) {
                return Object.assign(start, this._actions.get(action.type).update(start, action));
            } else {
                return Object.assign(start);
            }
        }
            ;
    }
}

export default Store;
