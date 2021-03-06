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
import { ApplicationCatalog } from './catalogs/ApplicationCatalog';
import { ClassCatalog } from './catalogs/ClassCatalog';
import { DirectoryCatalog } from './catalogs/DirectoryCatalog';
import { FileCatalog } from './catalogs/FileCatalog';
import { ModuleCatalog } from './catalogs/ModuleCatalog';
import { asArray, toStringSafe } from './util';


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
 * A disposable object.
 */
export interface Disposable {
    /**
     * Frees all resources of that object.
     */
    dispose(): any;
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


/**
 * Marks a class as exportable.
 *
 * @param {ServiceKey} [key] The custom service key. Default: class
 * 
 * @return {any} The decorator function.
 */
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

/**
 * Marks a property to load an exported service.
 *
 * @param {ServiceKey} service The service key.
 * 
 * @return {any} The decorator function.
 */
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

/**
 * Marks a property to load an exported services.
 *
 * @param {ServiceKey} service The service key.
 * 
 * @return {any} The decorator function.
 */
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
export class CompositionContainer implements Disposable {
    private readonly _CATALOGS: ComposablePartCatalog[] = [];
    private _instances: ExportInstance[] | symbol = VALUE_NOT_CREATED;

    /**
     * Adds one or more processes. If you process is defined, the current one is taken.
     *
     * @param {NodeJS.Process[]} [processes] One or more processes to add.
     * 
     * @return {this}
     */
    public addApplications(...processes: NodeJS.Process[]): this {
        if (!processes.length) {
            processes = [process];
        }

        return this.addCatalogs(
            ...processes.filter(p => !_.isNil(p))
                .map(p => new ApplicationCatalog({
                    application: p,
                }))
        );
    }

    /**
     * Adds one or more catalogs.
     *
     * @param {ComposablePartCatalog[]} [catalogs] One or more catalogs.
     *
     * @return {this}
     */
    public addCatalogs(...catalogs: ComposablePartCatalog[]): this {
        catalogs.filter(c => !_.isNil(c)).forEach(c => {
            this._CATALOGS.push(c);
        });

        return this;
    }

    /**
     * Adds one or more class (catalogs).
     *
     * @param {any[]} [classes] The classes to add.
     *
     * @return {this}
     */
    public addClasses(...classes: any[]): this {
        return this.addCatalogs(
            ...classes.filter(c => !_.isNil(c))
                .map(c => new ClassCatalog(c))
        );
    }

    /**
     * Adds one or more directories.
     *
     * @param {string[]} [dirs] The directories (paths) to add.
     *
     * @return {this}
     */
    public addDirectories(...dirs: string[]): this {
        return this.addCatalogs(
            ...dirs.map(d => toStringSafe(d))
                .filter(d => '' !== d.trim())
                .map(d => new DirectoryCatalog(d))
        );
    }

    /**
     * Adds one or more files.
     *
     * @param {string[]} [files] The files (paths) to add.
     *
     * @return {this}
     */
    public addFiles(...files: string[]): this {
        return this.addCatalogs(
            ...files.map(f => toStringSafe(f))
                .filter(f => '' !== f.trim())
                .map(f => new FileCatalog(f))
        );
    }

    /**
     * Adds one or more module (catalogs).
     *
     * @param {any[]} [mods] The modules to add.
     *
     * @return {this}
     */
    public addModules(...mods: any[]): this {
        return this.addCatalogs(
            ...mods.filter(m => !_.isNil(m))
                .map(m => new ModuleCatalog(m))
        );
    }

    /**
     * Composes all @Export() instances.
     *
     * @param {any[]} [objs] One or more object, where to write the instances to.
     */
    public async compose(...objs: any[]): Promise<void> {
        // keep sure we already have an
        // initialized value in 'this._instances'
        await this.getGlobalExportInstances();

        this.handleDecoratorsOfObjectList(objs);
    }

    /**
     * Composes all @Export() instances.
     *
     *  @param {any[]} [objs] One or more object, where to write the instances to.
     * 
     * @return {this}
     */
    public composeSync(...objs: any[]): this {
        // keep sure we already have an
        // initialized value in 'this._instances'
        this.getGlobalExportInstancesSync();

        this.handleDecoratorsOfObjectList(objs);

        return this;
    }

    /** @inheritdoc */
    public dispose() {
        // dispose all instances

        const INSTANCES = this._instances;
        if (Array.isArray(INSTANCES)) {
            while (INSTANCES.length) {
                const I = INSTANCES.pop();

                if (!_.isNil(I.instance)) {
                    if (_.isFunction(I.instance.dispose)) {
                        I.instance.dispose();
                    }
                }
            }
        }

        this._instances = null;
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

    /**
     * Returns all services by key.
     *
     * @param {ServiceKey} service The service key.
     *
     * @return {Promise<TService[]>} The promise with the services.
     */
    public async getAllServices<TService = any>(service: ServiceKey): Promise<TService[]> {
        await this.getGlobalExportInstances();

        return this.getAllServicesInner(service);
    }

    /**
     * Returns all services by key.
     *
     * @param {ServiceKey} service The service key.
     *
     * @return {TService[]} The services.
     */
    public getAllServicesSync<TService = any>(service: ServiceKey): TService[] {
        this.getGlobalExportInstancesSync();

        return this.getAllServicesInner(service);
    }

    private getAllServicesInner(service: ServiceKey): any[] {
        const MATCHING_EXPORTS: ExportInstance[] = [];
        this.fillMatchingExports({
            property: null,
            service: service,
        }, MATCHING_EXPORTS);

        return MATCHING_EXPORTS.map(me => me.instance);
    }

    private async getGlobalExportInstances(): Promise<ExportInstance[]> {
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
            this.handleDecoratorsOfObjectList(
                instances.map(ei => ei.instance)
            );
        } else {
            instances = this._instances as ExportInstance[];
        }

        return instances;
    }

    private getGlobalExportInstancesSync(): ExportInstance[] {
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
            this.handleDecoratorsOfObjectList(
                instances.map(ei => ei.instance)
            );
        } else {
            instances = this._instances as ExportInstance[];
        }

        return instances;
    }

    /**
     * Returns a single service by key.
     *
     * @param {ServiceKey} service The service key.
     *
     * @return {Promise<TService>} The promise with the single service.
     */
    public async getService<TService = any>(service: ServiceKey): Promise<TService> {
        await this.getGlobalExportInstances();

        return this.getServiceInner(service);
    }

    /**
     * Returns a single service by key.
     *
     * @param {ServiceKey} service The service key.
     *
     * @return {TService} The single service.
     */
    public getServiceSync<TService = any>(service: ServiceKey): TService {
        this.getGlobalExportInstancesSync();

        return this.getServiceInner(service);
    }

    private getServiceInner(service: ServiceKey): any {
        const MATCHING_EXPORTS: ExportInstance[] = [];
        this.fillMatchingExports({
            property: null,
            service: service,
        }, MATCHING_EXPORTS);

        if (MATCHING_EXPORTS.length < 1) {
            throw new Error(`No exported instance found for '${toStringSafe(service)}'`);
        }
        if (MATCHING_EXPORTS.length > 1) {
            throw new Error(`More than one exported instance found for '${toStringSafe(service)}'`);
        }

        return MATCHING_EXPORTS[0].instance;
    }

    private handleDecoratorsOfObjectList(objects: any[]) {
        objects.forEach(o => {
            this.handleImports(o);
            this.handleImportManys(o);
        });
    }

    private handleImportManys(obj: any) {
        const IMPORT_DEFS = asArray<ImportDefintion>(obj[IMPORT_MANYS]);

        IMPORT_DEFS.forEach(id => {
            obj[id.property] = this.getAllServicesInner(id.service);
        });
    }

    private handleImports(obj: any) {
        const IMPORT_DEFS = asArray<ImportDefintion>(obj[IMPORTS]);

        IMPORT_DEFS.forEach(id => {
            obj[id.property] = this.getServiceInner(id.service);
        });
    }
}


export * from './catalogs/ApplicationCatalog';
export * from './catalogs/ClassCatalog';
export * from './catalogs/DirectoryCatalog';
export * from './catalogs/FileCatalog';
export * from './catalogs/FilteredCatalog';
export * from './catalogs/ModuleCatalog';