import twig = require('twig');

export type ViewFunction = (input: any) => string;

interface ViewDirectory {
    [name: string]: TemplateBlocks;
}

interface TemplateBlocks {
    [name: string]: any;
}

interface TemplateDirectory {
    [name: string]: twig.Template;
}

var _views: ViewDirectory = {};
var _templates: TemplateDirectory = {};
var _original: TemplateDirectory = {};

/**
 * Registers a new view function (a function that generates html from any input)
 *
 * @param name
 * @param fun
 */
export function registerViewFunction(name: string, fun: twig.Template): void {
    // get blocks
    var blocks: TemplateBlocks = {};

    // parse tokens
    fun.tokens.forEach((token) => {
        if (token.type == 'logic') {
            token = token.token;

            if (token.type == 'Twig.logic.type.block') {
                blocks[token.block] = token.output;
            }
        }
    });

    // save for later
    _views[name] = blocks;
    _templates[name] = fun;
    _original[name] = fun.tokens;
}

/**
 * Renders an block of an view
 *
 * @param view view name
 * @param block block name
 * @param data data for the view
 * @param blocks pre rendererd blocks
 */
export function renderBlock(view: string, block: string, data: any = {}, blocks: any = {}): string {
    if (typeof _views[view][block] == 'undefined') {
        return "";
    }

    _templates[view].tokens = _views[view][block];

    return _templates[view].render(data, {
        blocks: blocks
    });
}

/**
 * Renders an view as an master
 *
 * @param master
 * @param data
 * @param blocks
 */
export function renderMaster(master: string, data: any, blocks: any): string {
    _templates[master].tokens = _original[master];

    return _templates[master].render(data, {
        blocks: blocks
    });
}