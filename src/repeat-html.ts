declare let document;

const patterns = {
    keyTypeArray: /\[\s*(\d+)\s*\]+/g,
    params: /\{\s*(\d+)\s*\}+/g,
    splitQuery: /\s+in\s+/,
    findTemplateVars: /\{\{\s*([\[\]\$\.\_0-9a-zA-Z]+)\s*\}\}/g,
    splitQueryVars: /\s*,\s*/,
    isArraySintax: {
        ini: /(?=^\s*\[)/,
        end: /(?=\]\s*$)/
    },
    filters: {
        like: /\s+like\s+/,
        as: /\s+as\s+/
    },
    hasSelectorCss: /^(#|\.)\S/
};

/**
 * @constructor RepeatHTML
 * @param {Object} config - Configuracion inicial para la instancia
 */
export class RepeatHTML {
    _originalElements: any;
    _scope: any;
    _filters: {};
    REPEAT_ATTR_NAME: any;

    constructor(config) {
        config = config || {};

        this.REPEAT_ATTR_NAME = config.attrName || 'repeat';
        this._filters = {};
        this._scope = config.scope || {};
        this._originalElements = null;

        searchFilters.call(this);

        if (config.compile || config.compile === undefined) {
            init.call(this, false, false);
        }
    }

    /**
     * Metodo de entrada o salida de datos del _scope
     * @public
     * @method
     *
     * @param {string} varName - Nombre del dato a almacenar dentro del scope
     * @param {Object[]} data - Informacion o datos a almacenar
     * @param {Object|Function|Array} funcBacks - Funciones que se ejecutaran al actualizar el modelo de datos
     */
    scope(varName, data, funcBacks) {
        if (typeof varName !== 'string') {
            return this;
        }

        if (data === undefined) {
            return this._scope[varName];
        }

        this._scope[varName] = this._scope[varName] || {};
        this._scope[varName].data = data;
        this._scope[varName].originalData = data;

        if (typeof funcBacks === 'function')
            this._scope[varName].funcBackAfter = funcBacks;
        else if (isOfType(funcBacks, 'array')) {
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
     * Filtrar la lista de datos dependiendo del parametro dado
     * @public
     * @method
     */
    filter(varName, filtro, element) {
        if (varName === undefined) {
            return false;
        }

        let self = this;
        let _filter = null;

        filtro = filtro.trim();

        if (
            patterns.filters.as.test(filtro) ||
            patterns.hasSelectorCss.test(filtro.replace(/^%|%$/g, ''))
        ) {
            _filter = filtro.split(patterns.filters.as);

            let prop = _filter[0];
            let selector = _filter[1];

            if (!selector) {
                selector = prop;
                prop = null;
            }

            let elem = document.getElementById(
                selector.replace(/#|^%|%$/g, '')
            );

            if (!elem) {
                return self;
            }

            let hasPercentIni = /^%/g.test(selector) ? '^' : '';
            let hasPercentFin = /%$/g.test(selector) ? '$' : '';

            filtro = elem.value; //para llamarlo una primera vez

            elem.addEventListener('keyup', function() {
                let _this = this;

                self._scope[varName].data = self._scope[
                    varName
                ].originalData.filter(function(data) {
                    let patron = new RegExp(
                        hasPercentIni + _this.value + hasPercentFin,
                        'gi'
                    );

                    if (prop) {
                        return patron.test(data[prop]);
                    }

                    for (const _prop in data) {
                        if (patron.test(data[_prop])) {
                            return true;
                        }
                    }
                });

                self.refresh(varName, element);
            });

            return self;
        } else if (patterns.filters.like.test(filtro)) {
            return; //Ignoremos el resto por el momento
            // _filter = filtro.split(patterns.filters.like);
            // filtro = _filter[1];
        }

        //TODO WTF!?
        return;

        // if (_filter) var prop = _filter[0];

        // if (filtro) {
        //     filtro = filtro.replace(/^%/g, '^');

        //     this._filters[varName] = function(data) {
        //         let patron = new RegExp(filtro, 'gi');

        //         //Despues puede convertirse en array para multiple filtros
        //         if (prop) {
        //             return patron.test(data[prop]);
        //         }

        //         for (let prop in data) {
        //             if (patron.test(data[prop])) {
        //                 return true;
        //             }
        //         }
        //     };
        // }

        // return this;
    }

    /**
     * Filtrar la lista de datos dependiendo del parametro dado
     * @public
     * @method
     */
    applyFilter(varName) {
        if (!varName || !this._filters[varName])
            return this._scope[varName].data;

        return this._scope[varName].data.filter(this._filters[varName]);
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
            init.call(this, false, false);
        }

        reRender.call(this, varName, element);

        //clear();
        return this;
    }
}

function searchFilters() {
    let self = this;
    let queryFilters = document.querySelectorAll('[data-filter]');
    let queryRepeat = '';
    let len = queryFilters.length;

    if (len <= 0) return;

    let i;
    let filters;
    let element = null;

    for (i = 0; (element = queryFilters[i]); i++) {
        queryRepeat = element.dataset[self.REPEAT_ATTR_NAME].split(
            patterns.splitQuery
        );

        filters = element.dataset.filter.split(patterns.splitQueryVars);

        filters.forEach(function(filter) {
            self.filter(queryRepeat[1], filter, element);
        });
    }
}

/**
 * Repitado de los datos
 * @private
 * @method
 */
function reRender(varName, element) {
    let self = this;
    let elements = self._originalElements;
    let elementHTML = '';
    let repeatData = null;
    let i;
    let len = elements.length;
    let elementData;
    let elementsRepeatContent = document.createDocumentFragment();

    let funcBackArgs = [];
    let modelData = self._scope[varName];

    for (i = 0; i < len; i++) {
        elementData = elements[i];

        if (element)
            if (element.dataset.filter !== elementData.element.dataset.filter)
                continue;

        repeatData = resolveQuery.call(
            self,
            elementData.element.dataset[self.REPEAT_ATTR_NAME]
        );

        if (!repeatData.datas || varName !== repeatData.varName) continue;

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

            if (modelData.funcBack) funcBackArgs.push([data, elementCloned]);
        });

        insertAfter(elementsRepeatContent, elementData.childs[0]);
        elementsRepeatContent = document.createDocumentFragment();
    }

    if (!!varName && modelData.funcBack) {
        funcBackArgs.forEach(function(args) {
            modelData.funcBack.apply(self, args);
        });
    }
}

/**
 * Metodo de entrada o salida del scope
 * @private
 * @method
 */
function init(isRefresh, findParents) {
    let selector = '[data-' + this.REPEAT_ATTR_NAME + ']';

    let self = this;
    let elements = document.querySelectorAll(
        selector + (findParents ? '' : ' ' + selector)
    );
    let element = null;
    let elementHTML = '';
    let repeatData = null;
    let i;
    let len;
    let lenElements = 0;
    let elementsRepeatContent = document.createDocumentFragment();

    if (!self._originalElements) {
        self._originalElements = [];
    }

    for (i = 0, len = elements.length; i < len; i++) {
        element = elements[i].element || elements[i];

        repeatData = resolveQuery.call(
            self,
            element.dataset[self.REPEAT_ATTR_NAME]
        );

        if (repeatData.datas) {
            elementHTML = element.innerHTML;

            let elementCopy = element.cloneNode(true),
                commentStart = document.createComment(
                    'RepeatHTML: start( ' +
                        element.dataset[self.REPEAT_ATTR_NAME] +
                        ' )'
                );

            elementCopy.removeAttribute('data-' + self.REPEAT_ATTR_NAME);
            elementCopy.removeAttribute('data-filter');

            if (!isRefresh) {
                //Almacenar cada elemento original en una arreglo
                self._originalElements.push({
                    element: element.cloneNode(true),
                    elementClone: elementCopy,
                    parentElement: element.parentElement,
                    childs: [commentStart]
                });

                lenElements = self._originalElements.length;
            }

            elementsRepeatContent.appendChild(commentStart);

            //Comentario delimitador de inicio
            repeatData.datas.forEach(function(data) {
                let objData = {};
                let elementCloned = elementCopy.cloneNode(false);

                objData[repeatData.varsIterate] = data;

                elementCloned.innerHTML = renderTemplate(elementHTML, objData);

                elementsRepeatContent.appendChild(elementCloned);

                if (!isRefresh) {
                    self._originalElements[lenElements - 1].childs.push(
                        elementCloned
                    );
                }
            });

            element.parentElement.replaceChild(elementsRepeatContent, element);

            elementsRepeatContent = document.createDocumentFragment();
        }
    }

    if (document.querySelectorAll(selector).length > 0 && !findParents) {
        return init.call(self, isRefresh, true);
    }
}

/**
 * Resuelve la cadena de texto del repeat a dos propiedades
 * @private
 * @method
 */
function resolveQuery(query) {
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
        datas: parseData.call(this, query[1].trim()),
        varName: query[1].trim()
    };
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

            if (finder) return finder;
            else return find;
        });
}

/**
 * Codifica los datos de entrada dependiendo del tipo, array o string
 * @private
 * @method
 */
function parseData(strData) {
    if (this._scope[strData]) return this.applyFilter(strData);

    if (
        patterns.isArraySintax.ini.test(strData) &&
        patterns.isArraySintax.end.test(strData)
    )
        return eval(strData);

    return null;
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
