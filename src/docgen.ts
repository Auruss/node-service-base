// Let the loader load everything
import fs = require("fs");
import child_process = require('child_process');
import loader = require("./loader");
import controller = require("./controller");

// Create hooks
controller.BaseController.prototype.addAction = function(type: string, path: string, action: string) {
    function getFnName(fn): string {
        var f = typeof fn == 'function';
        var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
        return (!f && 'not a function') || (s && s[1] || 'anonymous');
    }

    if (typeof this["__actions"] == 'undefined') {
        this["__actions"] = [];
        this["__actionFun"] = [];
    }

    this["__actions"].push(path);
    this["__actionFun"].push(action);
};


console.log("Running in Node v" + process.version);
loader.loadController('api');


/**
 * JSON Format for a group / controller
 */
interface APIAction {
    path: string;
    shortDescription: string;
}
interface APIGroup {
    name: string;
    actions?: APIAction[];
}

// Parse all controllers
loader.Controllers.forEach((controller) => {
    var int = controller.getInternals();

    // generate typedoc data
    //child_process.execSync("typedoc src/controller/" + int.path.replace('.js', '.ts') + " typings.d.ts --json doc/groups/temp/" + int.name + ".json");

    // grab generated typedoc data
    var typedoc = <TypeDoc.RootObject>require("../../doc/groups/temp/" + int.name + ".json");

    // generate json object
    var group: APIGroup = {
        name: int.name,
    };
    group.actions = [];
    controller['__actions'].forEach((path: string, index: number) => {
        var short = "No description";

        // grab comments from typedoc
        typedoc.children.forEach((child) => {
           if (child.name == '"controller/'+int.path.replace('.js', '')+'"') {
               child.children[0].children.forEach((funs) => {
                   if (funs.name == controller["__actionFun"][index]) {
                       short = funs.signatures[0].comment.shortText;
                   }
               });
           }
        });

        group.actions.push({ path: path, shortDescription: short });
    });

    // save json object
    fs.writeFileSync("doc/groups/" + int.name + ".json", JSON.stringify(group, null, '\t'));
});

// AUTO GENERATED INTERFACES
declare module TypeDoc {

    export interface Flags {
    }

    export interface Flags2 {
        isExternal: boolean;
        isExported: boolean;
    }

    export interface Flags3 {
        isExternal: boolean;
        isExported: boolean;
    }

    export interface Comment {
        shortText: string;
    }

    export interface Flags4 {
        isPrivate: boolean;
        isExternal: boolean;
        isExported: boolean;
    }

    export interface Type {
        type: string;
        name: string;
        id: number;
        isArray?: boolean;
    }

    export interface Flags5 {
    }

    export interface Comment2 {
        shortText: string;
    }

    export interface Flags6 {
    }

    export interface Flags7 {
    }

    export interface Flags8 {
    }

    export interface Flags9 {
    }

    export interface Type3 {
        type: string;
        name: string;
        id: number;
    }

    export interface Parameter2 {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags9;
        type: Type3;
    }

    export interface Type4 {
        type: string;
        name: string;
        id: number;
    }

    export interface Signature2 {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags8;
        parameters: Parameter2[];
        type: Type4;
    }

    export interface Declaration {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags7;
        signatures: Signature2[];
    }

    export interface Type2 {
        type: string;
        name: string;
        declaration: Declaration;
        id?: number;
    }

    export interface Comment3 {
        text: string;
    }

    export interface Parameter {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags6;
        type: Type2;
        comment: Comment3;
    }

    export interface Type5 {
        type: string;
        name: string;
        id?: number;
    }

    export interface Flags10 {
    }

    export interface TypeParameter {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags10;
    }

    export interface InheritedFrom {
        type: string;
        name: string;
        id: number;
    }

    export interface Overwrites {
        type: string;
        name: string;
        id: number;
    }

    export interface Signature {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags5;
        comment: Comment2;
        parameters: Parameter[];
        type: Type5;
        typeParameter: TypeParameter[];
        inheritedFrom: InheritedFrom;
        overwrites: Overwrites;
    }

    export interface InheritedFrom2 {
        type: string;
        name: string;
        id: number;
    }

    export interface Overwrites2 {
        type: string;
        name: string;
        id: number;
    }

    export interface Child3 {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags4;
        type: Type;
        signatures: Signature[];
        inheritedFrom: InheritedFrom2;
        overwrites: Overwrites2;
    }

    export interface Group {
        title: string;
        kind: number;
        children: number[];
    }

    export interface ExtendedBy {
        type: string;
        name: string;
        id: number;
    }

    export interface ExtendedType {
        type: string;
        name: string;
        id: number;
    }

    export interface Type6 {
        type: string;
        name: string;
        id: number;
    }

    export interface Child2 {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags3;
        comment: Comment;
        children: Child3[];
        groups: Group[];
        extendedBy: ExtendedBy[];
        extendedTypes: ExtendedType[];
        type: Type6;
        defaultValue: string;
    }

    export interface Group2 {
        title: string;
        kind: number;
        children: number[];
    }

    export interface Child {
        id: number;
        name: string;
        kind: number;
        kindString: string;
        flags: Flags2;
        originalName: string;
        children: Child2[];
        groups: Group2[];
    }

    export interface Group3 {
        title: string;
        kind: number;
        children: number[];
    }

    export interface RootObject {
        id: number;
        name: string;
        kind: number;
        flags: Flags;
        children: Child[];
        groups: Group3[];
    }

}
