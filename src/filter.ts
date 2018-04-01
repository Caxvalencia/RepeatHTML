import { patterns } from './patterns';

export class Filter {
    protected callback: Function;
    protected scope: any;
    protected repeatAttributeName: string;

    constructor(scope, repeatAttributeName: string, callback) {
        this.scope = scope;
        this.repeatAttributeName = repeatAttributeName;
        this.callback = callback;
        this.findFilters();
    }

    /**
     * @param {string} variableName
     * @param {string} filterValue
     * @param {HTMLElement} element
     * @returns
     */
    filter(variableName: string, filterValue: string, element: HTMLElement) {
        filterValue = filterValue.trim();

        if (this.validate(variableName, filterValue)) {
            return false;
        }

        let _filter = filterValue.split(patterns.filters.as);

        let prop = _filter[0];
        let selector = _filter[1];

        if (!selector) {
            selector = prop;
            prop = null;
        }

        let elem: any = document.getElementById(
            selector.replace(/#|^%|%$/g, '')
        );

        if (!elem) {
            return this;
        }

        let hasPercentInit = /^%/g.test(selector) ? '^' : '';
        let hasPercentEnd = /%$/g.test(selector) ? '$' : '';

        filterValue = elem.value; //para llamarlo una primera vez

        elem.addEventListener('keyup', event => {
            let value = event.target.value;

            this.scope[variableName].data = this.scope[
                variableName
            ].originalData.filter(data => {
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

            this.callback(variableName, element);
        });

        return this;
    }

    /**
     * @param variableName
     * @param filterValue
     */
    validate(variableName: string, filterValue: string): boolean {
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

    private findFilters() {
        let queryFilters: NodeListOf<Element> = document.querySelectorAll(
            '[data-filter]'
        );

        let element: any;
        let queryRepeat: string;

        for (let i = 0; (element = queryFilters[i]); i++) {
            queryRepeat = element.dataset[this.repeatAttributeName].split(
                patterns.splitQuery
            );

            element.dataset.filter
                .split(patterns.splitQueryVars)
                .forEach(filter => {
                    this.filter(queryRepeat[1], filter, element);
                });
        }
    }
}
