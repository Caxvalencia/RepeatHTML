export const patterns = {
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
