import fs = require('fs');
import controller = require('./controller');

// typescript hack to use dynamic require(...)
var requirejs: any;

/**
 * Dynamially loads all controllers and models
 */
export function init() {
    // typescript hack to use dynamic require(...)
    requirejs = require;
}

/**
 * Gets all files in the directory
 * @param path
 */
export function scanDirectory(path: string, ext: string = 'js'): string[] {
    var basePath: string = require("app-root-path");
    var raw = fs.readdirSync(basePath + "/" + path);
    var output = [];

    raw.forEach((dir) => {
        var extension = dir.split('.').pop();
        if (extension == ext) {
            output.push(dir);
        }
    });

    return output;
}

export var Controllers: controller.BaseController[] = [];

class TypeHackClass extends controller.BaseController {

}

/**
 * Dynamically loads all controllers and publish them
 */
export function loadController() {
    var dirs = scanDirectory("dev/src/controller/");

    dirs.forEach((dir: string) => {
        var moduleName = dir.substr(0, dir.indexOf('.'));
        var module: string = "./controller/" + moduleName;

        var mod = requirejs(module);

        var controller: TypeHackClass = new mod.Controller();
        var base = <controller.BaseController>controller;
        base.internalInit({
            name: moduleName.toLowerCase(),
            path: dir
        });

        controller.setup();

        Controllers.push(controller);
    });
}

/**
 * Dynamically loads all models and publish them
 */
export function loadModels() {
    var dirs = scanDirectory('dev/src/model/');

    dirs.forEach((dir: string) => {
        var moduleName = dir.substr(0, dir.indexOf('.'));
        var module: string = "./model/" + moduleName;

        var model = requirejs(module);

        console.log(moduleName);
    });
}

import twig = require('twig');
import views = require('./views');

/**
 * Dynamically loads all
 * @param folder
 */
export function loadViews(folder: string) {
    var dirs = scanDirectory("src/views/" + folder, 'twig');

    dirs.forEach((dir: string) => {
        var viewName = dir.substr(0, dir.indexOf('.'));
        var view: string = "src/views/" + folder + '/' + viewName + '.twig';
        var fileContent = fs.readFileSync(view).toString();

        var template = twig.twig({
            data: fileContent
        });

        views.registerViewFunction(viewName, template);
    });
}