import { Helpers } from './helpers';
import { IScopeData, ScopeType } from './contracts/scope-data.interface';

export class Scope {
    private _scope: ScopeType;

    constructor(scope) {
        this._scope = scope || {};
    }

    /**
     * @param {string} varName Identifier for data into scope object
     * @param {any} data Info to storaged
     * @param {Object|Function|Array} [funcBacks] Callbacks for events of the model
     * @returns {this}
     */
    add(varName: string, data, funcBacks?): this {
        let scope = this._scope[varName] || <IScopeData>{};
        scope.data = data;
        scope.originalData = data;
        scope.funcBackAfter = () => {};
        scope.funcBack = () => {};

        if (typeof funcBacks === 'function') {
            scope.funcBackAfter = funcBacks;
        } else if (Helpers.isOfType(funcBacks, 'array')) {
            scope.funcBackAfter = funcBacks[0];
            scope.funcBack = funcBacks[1];
        } else if (typeof funcBacks === 'object') {
            scope.funcBackAfter = funcBacks.after;
            scope.funcBack = funcBacks.funcBack;
        }

        this._scope[varName] = scope;

        return this;
    }

    get(variableName) {
        return this._scope[variableName];
    }
}
