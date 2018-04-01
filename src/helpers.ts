import { patterns } from './patterns';

export class Helpers {
    /**
     * Injector de datos dentro de un template
     * @private
     * @method
     */
    static renderTemplate(template, data) {
        return template
            .replace(patterns.keyTypeArray, '.$1')
            .replace(patterns.findTemplateVars, (find, key) => {
                let partsKey = key.split('.');
                let finder = data[partsKey[0]];
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

    static insertAfter(insertElement, element) {
        if (element.nextSibling) {
            element.parentNode.insertBefore(insertElement, element.nextSibling);
            return;
        }

        element.parentNode.appendChild(insertElement);
    }

    static isOfType(data, compare) {
        return (
            {}.toString
                .call(data)
                .match(/\s(.+)\]$/)[1]
                .toLowerCase() === compare
        );
    }
}
