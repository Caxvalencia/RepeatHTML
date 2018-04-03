import { Helpers } from './helpers';

export class Scope {
    private _scope: {
        data: any;
        originalData: any;
        funcBackAfter: Function;
        funcBack: Function;
    };

    constructor(scope) {
        this._scope = scope || {};
    }

    /**
     * Metodo de entrada o salida de datos del _scope
     * @public
     * @method
     *
     * @param {string} varName - Nombre del dato a almacenar dentro del scope
     * @param {any[]} data - Informacion o datos a almacenar
     * @param {Object|Function|Array} funcBacks - Funciones que se ejecutaran al actualizar el modelo de datos
     */
    add(varName: string, data, funcBacks?) {
        this._scope[varName] = this._scope[varName] || {};
        this._scope[varName].data = data;
        this._scope[varName].originalData = data;
        this._scope[varName].funcBackAfter = () => {};
        this._scope[varName].funcBack = () => {};

        if (typeof funcBacks === 'function') {
            this._scope[varName].funcBackAfter = funcBacks;
        } else if (Helpers.isOfType(funcBacks, 'array')) {
            this._scope[varName].funcBackAfter = funcBacks[0];
            this._scope[varName].funcBack = funcBacks[1];
        } else if (typeof funcBacks === 'object') {
            this._scope[varName].funcBackAfter = funcBacks.after;
            this._scope[varName].funcBack = funcBacks.funcBack;
        }

        return this;
    }

    get(variableName) {
        return this._scope[variableName];
    }
}
