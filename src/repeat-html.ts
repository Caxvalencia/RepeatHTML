import { patterns } from './patterns';

declare let document;

/**
 * @constructor RepeatHTML
 * @param {Object} config - Configuracion inicial para la instancia
 */
export class RepeatHtml {
    _originalElements: any;
    _scope: any;
    _filters;
    REPEAT_ATTR_NAME: any;

    constructor(config: any = {}) {
        this.REPEAT_ATTR_NAME = config.attrName || 'repeat';
        this._filters = {};
        this._scope = config.scope || {};
        this._originalElements = null;

        this.searchFilters();

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
        } else if (isOfType(funcBacks, 'array')) {
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
     * @param {any} variableName
     * @param {any} filterValue
     * @param {any} element
     * @returns
     */
    filter(variableName: string, filterValue, element) {
        filterValue = filterValue.trim();

        if (this.validateFilter(variableName, filterValue)) {
            return false;
        }

        let _filter = filterValue.split(patterns.filters.as);

        let prop = _filter[0];
        let selector = _filter[1];

        if (!selector) {
            selector = prop;
            prop = null;
        }

        let elem = document.getElementById(selector.replace(/#|^%|%$/g, ''));

        if (!elem) {
            return this;
        }

        let hasPercentInit = /^%/g.test(selector) ? '^' : '';
        let hasPercentEnd = /%$/g.test(selector) ? '$' : '';

        filterValue = elem.value; //para llamarlo una primera vez

        elem.addEventListener('keyup', event => {
            let value = event.target.value;

            this._scope[variableName].data = this._scope[
                variableName
            ].originalData.filter(function(data) {
                let pattern = new RegExp(
                    hasPercentInit + value + hasPercentEnd,
                    'gi'
                );

                if (prop) {
                    return pattern.test(data[prop]);
                }

                for (const _prop in data) {
                    if (pattern.test(data[_prop])) {
                        return true;
                    }
                }
            });

            this.refresh(variableName, element);
        });

        return this;
    }

    searchFilters() {
        let queryFilters = document.querySelectorAll('[data-filter]');

        if (queryFilters.length <= 0) {
            return;
        }

        let element = null;
        let queryRepeat = '';

        for (let i = 0; (element = queryFilters[i]); i++) {
            queryRepeat = element.dataset[this.REPEAT_ATTR_NAME].split(
                patterns.splitQuery
            );

            element.dataset.filter
                .split(patterns.splitQueryVars)
                .forEach(filter => {
                    this.filter(queryRepeat[1], filter, element);
                });
        }
    }

    /**
     * Filtrar la lista de datos dependiendo del parametro dado
     * @public
     * @method
     */
    applyFilter(varName) {
        if (!varName || !this._filters[varName]) {
            return this._scope[varName].data;
        }

        return this._scope[varName].data.filter(this._filters[varName]);
    }

    validateFilter(variableName: string, filterValue: string): boolean {
        if (variableName === undefined) {
            return false;
        }

        if (
            !patterns.filters.as.test(filterValue) &&
            !patterns.hasSelectorCss.test(filterValue.replace(/^%|%$/g, ''))
        ) {
            return false;
        }
    }

    /**
     * Aplicar accion de repetir
     * @public
     * @method
     */
    refresh(varName, element?) {
        let hasDataRepeatAttribute =
            document.querySelectorAll('[data-' + this.REPEAT_ATTR_NAME + ']')
                .length > 0;

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
        let elements = this._originalElements;
        let elementHTML = '';
        let repeatData = null;
        let i;
        let len = elements.length;
        let elementData;
        let elementsRepeatContent = document.createDocumentFragment();

        let funcBackArgs = [];
        let modelData = this._scope[varName];

        for (i = 0; i < len; i++) {
            elementData = elements[i];

            if (
                element &&
                element.dataset.filter !== elementData.element.dataset.filter
            ) {
                continue;
            }

            repeatData = this.resolveQuery.call(
                this,
                elementData.element.dataset[this.REPEAT_ATTR_NAME]
            );

            if (!repeatData.datas || varName !== repeatData.varName) {
                continue;
            }

            elementHTML = elementData.element.innerHTML;

            elementData.childs.forEach(function(child, index) {
                if (index === 0) return;
                elementData.parentElement.removeChild(child);
            });
            elementData.childs.splice(1, elementData.childs.length);

            repeatData.datas.forEach(function(data) {
                let objData = {};
                //No se necesita clonar el contenido ya que este sera reescrito
                let elementCloned = elementData.elementClone.cloneNode(false);

                objData[repeatData.varsIterate] = data;
                elementCloned.innerHTML = renderTemplate(elementHTML, objData);

                elementsRepeatContent.appendChild(elementCloned);
                elementData.childs.push(elementCloned);

                if (modelData.funcBack)
                    funcBackArgs.push([data, elementCloned]);
            });

            insertAfter(elementsRepeatContent, elementData.childs[0]);
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
        let selector = '[data-' + this.REPEAT_ATTR_NAME + ']';

        let elements = document.querySelectorAll(
            selector + (findParents ? '' : ' ' + selector)
        );
        let element = null;
        let repeatData = null;
        let i;
        let len;
        let lenElements = 0;
        let elementsRepeatContent = document.createDocumentFragment();

        if (!this._originalElements) {
            this._originalElements = [];
        }

        for (i = 0, len = elements.length; i < len; i++) {
            element = elements[i].element || elements[i];

            repeatData = this.resolveQuery.call(
                this,
                element.dataset[this.REPEAT_ATTR_NAME]
            );

            if (!repeatData.datas) {
                continue;
            }

            let elementHtml = element.innerHTML;

            let elementCopy = element.cloneNode(true),
                commentStart = document.createComment(
                    'RepeatHTML: start( ' +
                        element.dataset[this.REPEAT_ATTR_NAME] +
                        ' )'
                );

            elementCopy.removeAttribute('data-' + this.REPEAT_ATTR_NAME);
            elementCopy.removeAttribute('data-filter');

            if (!isRefresh) {
                //Almacenar cada elemento original en una arreglo
                this._originalElements.push({
                    element: element.cloneNode(true),
                    elementClone: elementCopy,
                    parentElement: element.parentElement,
                    childs: [commentStart]
                });

                lenElements = this._originalElements.length;
            }

            elementsRepeatContent.appendChild(commentStart);

            //Comentario delimitador de inicio
            repeatData.datas.forEach(data => {
                let elementCloned = elementCopy.cloneNode(false);

                elementCloned.innerHTML = renderTemplate(elementHtml, {
                    [repeatData.varsIterate]: data
                });

                elementsRepeatContent.appendChild(elementCloned);

                if (!isRefresh) {
                    this._originalElements[lenElements - 1].childs.push(
                        elementCloned
                    );
                }
            });

            element.parentElement.replaceChild(elementsRepeatContent, element);
            elementsRepeatContent = document.createDocumentFragment();
        }

        if (document.querySelectorAll(selector).length > 0 && !findParents) {
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
            return this.applyFilter(strData);
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

/**
 * Injector de datos dentro de un template(cadena de texto)
 * @private
 * @method
 */
function renderTemplate(template, datas) {
    return template
        .replace(patterns.keyTypeArray, '.$1')
        .replace(patterns.findTemplateVars, function(find, key) {
            let partsKey = key.split('.');
            let finder = datas[partsKey[0]];
            let idx;

            for (idx = 1; idx < partsKey.length; idx++) {
                finder = finder[partsKey[idx]];
            }

            if (finder) {
                return finder;
            }

            return find;
        });
}

/**
 * Utils
 */
function insertAfter(insertElement, element) {
    if (element.nextSibling) {
        element.parentNode.insertBefore(insertElement, element.nextSibling);
    } else {
        element.parentNode.appendChild(insertElement);
    }
}

function isOfType(data, compare) {
    return (
        {}.toString
            .call(data)
            .match(/\s(.+)\]$/)[1]
            .toLowerCase() === compare
    );
}
