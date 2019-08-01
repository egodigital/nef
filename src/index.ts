/**
 * This file is part of the @egodigital/nef distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * @egodigital/nef is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * @egodigital/nef is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import { ClassCatalog } from './catalogs/ClassCatalog';
import { asArray } from './util';


/**
 * A composable part catalog.
 */
export interface ComposablePartCatalog {
    /**
     * Returns the list of classes.
     * 
     * @return {Promise<any[]>} The promise with the loaded classes.
     */
    getClasses(): Promise<any[]>;
    /**
     * Returns the list of classes.
     * 
     * @return {any[]} The loaded classes.
     */
    getClassesSync(): any[];
}

/**
 * An export defintion.
 */
export interface ExportDefintion {
    /**
     * The export key.
     */
    key: ServiceKey;
}

interface ExportInstance {
    instance: any;
    service: ServiceKey;
}

/**
 * An import definition.
 */
export interface ImportDefintion {
    /**
     * The property.
     */
    property: PropertyKey;
    /**
     * The key of export definition.
     */
    service: ServiceKey;
}

/**
 * A key for an exported service.
 */
export type ServiceKey = any;


const EXPORTS = Symbol('EXPORTS');  // key for string @Export() definitions
const IMPORTS = Symbol('IMPORTS');  // key for string @Import() definitions
const IMPORT_MANYS = Symbol('IMPORT_MANYS');  // key for string @ImportMany() definitions
const VALUE_NOT_CREATED = Symbol('VALUE_NOT_CREATED');


export function Export(key?: ServiceKey): ClassDecorator;
export function Export(...args: any[]): any {
    return (target: Function) => {
        let keyToUse: any;
        if (args.length < 1) {
            keyToUse = target;
        } else {
            keyToUse = args[0];
        }

        if (_.isNil(target[EXPORTS])) {
            target[EXPORTS] = [];
        }

        const EXPORT_DEF: ExportDefintion = {
            key: keyToUse,
        };

        target[EXPORTS].push(
            EXPORT_DEF
        );
    };
}

export function Import(service: ServiceKey): any;
export function Import(...args: any[]): any {
    return function (target: any, key: PropertyKey) {
        if (_.isNil(target.constructor.prototype[IMPORTS])) {
            target.constructor.prototype[IMPORTS] = [];
        }

        const IMPORT_DEF: ImportDefintion = {
            property: key,
            service: args[0],
        };

        target.constructor.prototype[IMPORTS].push(
            IMPORT_DEF
        );
    };
}

export function ImportMany(service: ServiceKey): any;
export function ImportMany(...args: any[]): any {
    return function (target: any, key: PropertyKey) {
        if (_.isNil(target.constructor.prototype[IMPORT_MANYS])) {
            target.constructor.prototype[IMPORT_MANYS] = [];
        }

        const IMPORT_DEF: ImportDefintion = {
            property: key,
            service: args[0],
        };

        target.constructor.prototype[IMPORT_MANYS].push(
            IMPORT_DEF
        );
    };
}


/**
 * A container, that composes instances.
 */
export class CompositionContainer {
    private readonly _CATALOGS: ComposablePartCatalog[] = [];
    private _instances: ExportInstance[] | symbol = VALUE_NOT_CREATED;

    /**
     * Adds one or more catalogs.
     *
     * @param {ComposablePartCatalog[]} [catalogs] One or more catalogs.
     *
     * @return {this}
     */
    public addCatalogs(...catalogs: ComposablePartCatalog[]): this {
        if (catalogs) {
            catalogs.forEach(c => {
                if (c) {
                    this._CATALOGS.push(c);
                }
            });
        }

        return this;
    }

    /**
     * Adds a class (catalog).
     *
     * @param {any} cls The class to add.
     *
     * @return {this}
     */
    public addClasses(...classes: any[]): this {
        return this.addCatalogs
            .apply(this, classes.map(c => new ClassCatalog(c)));
    }

    /**
     * Composes all @Export() instances.
     *
     * @param {any} obj The object, where to write the instances to.
     */
    public async compose(obj: any): Promise<void> {
        let instances: ExportInstance[];
        if (_.isSymbol(this._instances)) {
            // load classes from catalogs
            const LOADED_CLASSES: any[] = [];
            for (const CAT of this._CATALOGS) {
                const CLASSES = asArray(await CAT.getClasses());

                CLASSES.forEach(cls => {
                    if (_.isFunction(cls.constructor)) {
                        LOADED_CLASSES.push(cls);
                    }
                });
            }

            instances = [];
            this.fillInstances(instances, LOADED_CLASSES);

            this._instances = instances;
            this.handleInstanceList(instances);
        } else {
            instances = this._instances as ExportInstance[];
        }

        this.handleImports(obj);
        this.handleImportManys(obj);
    }

    /**
     * Composes all @Export() instances.
     *
     * @param {any} obj The object, where to write the instances to.
     * 
     * @return {this}
     */
    public composeSync(obj: any): this {
        let instances: ExportInstance[];
        if (_.isSymbol(this._instances)) {
            // load classes from catalogs
            const LOADED_CLASSES: any[] = [];
            for (const CAT of this._CATALOGS) {
                const CLASSES = asArray(CAT.getClassesSync());

                CLASSES.forEach(cls => {
                    if (_.isFunction(cls.constructor)) {
                        LOADED_CLASSES.push(cls);
                    }
                });
            }

            instances = [];
            this.fillInstances(instances, LOADED_CLASSES);

            this._instances = instances;
            this.handleInstanceList(instances);
        } else {
            instances = this._instances as ExportInstance[];
        }

        this.handleImports(obj);
        this.handleImportManys(obj);

        return this;
    }

    private fillInstances(instances: any[], classes: any[]) {
        for (const CLS of classes) {
            const EXPORT_DEFS = asArray<ExportDefintion>(CLS[EXPORTS]);

            EXPORT_DEFS.forEach(e => {
                const NEW_INSTANCE: any = new (Function.prototype.bind.apply(
                    CLS, [CLS].concat(
                        // constructor params
                    ))
                );

                instances.push({
                    instance: NEW_INSTANCE,
                    service: e.key,
                });
            });
        }
    }

    private fillMatchingExports(
        importDef: ImportDefintion,
        matchingExports: ExportInstance[]
    ) {
        (this._instances as ExportInstance[]).filter(ei => {
            return ei.service === importDef.service;
        }).forEach(ei => {
            matchingExports.push(ei);
        });
    }

    private handleImports(obj: any) {
        const IMPORT_DEFS = asArray<ImportDefintion>(obj[IMPORTS]);

        IMPORT_DEFS.forEach(id => {
            const MATCHING_EXPORTS: ExportInstance[] = [];
            this.fillMatchingExports(id, MATCHING_EXPORTS);

            if (MATCHING_EXPORTS.length < 1) {
                throw new Error(`No exported instance found for '${id.service}'`);
            }
            if (MATCHING_EXPORTS.length > 1) {
                throw new Error(`More than one exported instance found for '${id.service}'`);
            }

            obj[id.property] = MATCHING_EXPORTS[0].instance;
        });
    }

    private handleImportManys(obj: any) {
        const IMPORT_DEFS = asArray<ImportDefintion>(obj[IMPORT_MANYS]);

        IMPORT_DEFS.forEach(id => {
            const MATCHING_EXPORTS: ExportInstance[] = [];
            this.fillMatchingExports(id, MATCHING_EXPORTS);

            obj[id.property] = MATCHING_EXPORTS.map(me => {
                return me.instance;
            });
        });
    }

    private handleInstanceList(instances: any[]) {
        instances.forEach(i => {
            this.handleImports(i);
            this.handleImportManys(i);
        });
    }
}


export * from './catalogs/ClassCatalog';