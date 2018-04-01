import { patterns } from './patterns';
import { Filter } from './filter';
import { Helpers } from './helpers';

export class RepeatHtml {
    filter: Filter;
    originalElements: any[];
    repeatAttributeName: string;
    selector: string;
    _scope: any;

    constructor(config: any = {}) {
        this.repeatAttributeName = config.attrName || 'repeat';
        this._scope = config.scope || {};
        this.originalElements = null;

        this.filter = new Filter(
            this._scope,
            this.repeatAttributeName,
            this.refresh.bind(this)
        );

        this.selector = '[data-' + this.repeatAttributeName + ']';

        if (config.compile || config.compile === undefined) {
            this.init(false, false);
        }
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
    scope(varName: string, data, funcBacks?) {
        if (data === undefined) {
            return this._scope[varName];
        }

        this._scope[varName] = this._scope[varName] || {};
        this._scope[varName].data = data;
        this._scope[varName].originalData = data;

        if (typeof funcBacks === 'function') {
            this._scope[varName].funcBackAfter = funcBacks;
        } else if (Helpers.isOfType(funcBacks, 'array')) {
            this._scope[varName].funcBackAfter = funcBacks[0];
            this._scope[varName].funcBack = funcBacks[1];
        } else if (typeof funcBacks === 'object') {
            this._scope[varName].funcBackAfter = funcBacks.after;
            this._scope[varName].funcBack = funcBacks.funcBack;
        }

        this.refresh(varName);

        if (this._scope[varName].funcBackAfter) {
            this._scope[varName].funcBackAfter.call(this, data);
        }

        return this;
    }

    /**
     * Aplicar accion de repetir
     * @public
     * @method
     */
    refresh(varName, element?) {
        let hasDataRepeatAttribute =
            document.querySelectorAll(this.selector).length > 0;

        if (hasDataRepeatAttribute) {
            this.init(false, false);
        }

        this.reRender(varName, element);

        //clear();
        return this;
    }

    /**
     * Repitado de los datos
     * @private
     * @method
     */
    reRender(varName, element) {
        let elements = this.originalElements;
        let repeatData = null;
        let elementData;
        let elementsRepeatContent = document.createDocumentFragment();

        let funcBackArgs = [];
        let modelData = this._scope[varName];

        for (let i = 0; i < elements.length; i++) {
            elementData = elements[i];

            if (
                element &&
                element.dataset.filter !== elementData.element.dataset.filter
            ) {
                continue;
            }

            repeatData = this.resolveQuery(
                elementData.element.dataset[this.repeatAttributeName]
            );

            if (!repeatData.datas || varName !== repeatData.varName) {
                continue;
            }

            let elementHTML = elementData.element.innerHTML;

            elementData.childs.forEach((child, index) => {
                if (index === 0) {
                    return;
                }

                elementData.parentElement.removeChild(child);
            });

            elementData.childs.splice(1, elementData.childs.length);

            repeatData.datas.forEach(data => {
                let elementClon = elementData.elementClone.cloneNode(false);

                elementClon.innerHTML = Helpers.renderTemplate(elementHTML, {
                    [repeatData.varsIterate]: data
                });

                elementsRepeatContent.appendChild(elementClon);
                elementData.childs.push(elementClon);

                if (modelData.funcBack) {
                    funcBackArgs.push([data, elementClon]);
                }
            });

            Helpers.insertAfter(elementsRepeatContent, elementData.childs[0]);
            elementsRepeatContent = document.createDocumentFragment();
        }

        if (!!varName && modelData.funcBack) {
            funcBackArgs.forEach(args => {
                modelData.funcBack.apply(this, args);
            });
        }
    }

    /**
     * Metodo de entrada o salida del scope
     * @private
     * @method
     */
    init(isRefresh, findParents) {
        let elements: any = document.querySelectorAll(
            this.selector + (findParents ? '' : ' ' + this.selector)
        );
        let element = null;
        let repeatData = null;
        let lenElements = 0;
        let elementsRepeatContent = document.createDocumentFragment();

        if (!this.originalElements) {
            this.originalElements = [];
        }

        for (let i = 0; i < elements.length; i++) {
            element = elements[i].element || elements[i];

            repeatData = this.resolveQuery(
                element.dataset[this.repeatAttributeName]
            );

            if (!repeatData.datas) {
                continue;
            }

            let elementHtml = element.innerHTML;

            let elementCopy = element.cloneNode(true),
                commentStart = document.createComment(
                    'RepeatHTML: start( ' +
                        element.dataset[this.repeatAttributeName] +
                        ' )'
                );

            elementCopy.removeAttribute('data-' + this.repeatAttributeName);
            elementCopy.removeAttribute('data-filter');

            if (!isRefresh) {
                //Almacenar cada elemento original en una arreglo
                this.originalElements.push({
                    element: element.cloneNode(true),
                    elementClone: elementCopy,
                    parentElement: element.parentElement,
                    childs: [commentStart]
                });

                lenElements = this.originalElements.length;
            }

            elementsRepeatContent.appendChild(commentStart);

            //Comentario delimitador de inicio
            repeatData.datas.forEach(data => {
                let elementCloned = elementCopy.cloneNode(false);

                elementCloned.innerHTML = Helpers.renderTemplate(elementHtml, {
                    [repeatData.varsIterate]: data
                });

                elementsRepeatContent.appendChild(elementCloned);

                if (!isRefresh) {
                    this.originalElements[lenElements - 1].childs.push(
                        elementCloned
                    );
                }
            });

            element.parentElement.replaceChild(elementsRepeatContent, element);
            elementsRepeatContent = document.createDocumentFragment();
        }

        if (
            document.querySelectorAll(this.selector).length > 0 &&
            !findParents
        ) {
            return this.init(isRefresh, true);
        }
    }

    /**
     * Resuelve la cadena de texto del repeat a dos propiedades
     * @private
     * @method
     */
    resolveQuery(query) {
        query = query.split(patterns.splitQuery);

        if (query[0].trim() === '' && !query[1]) {
            return {
                varsIterate: null,
                datas: null,
                varName: null
            };
        }

        return {
            varsIterate: query[0].split(patterns.splitQueryVars),
            datas: this.parseData.call(this, query[1].trim()),
            varName: query[1].trim()
        };
    }

    /**
     * Codifica los datos de entrada dependiendo del tipo, array o string
     * @private
     * @method
     */
    parseData(strData) {
        if (this._scope[strData]) {
            return this.filter.apply(strData);
        }

        if (
            patterns.isArraySintax.ini.test(strData) &&
            patterns.isArraySintax.end.test(strData)
        ) {
            return eval(strData);
        }

        return null;
    }
}
