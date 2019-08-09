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
import * as fastGlob from 'fast-glob';
import * as path from 'path';
import { CatalogBase } from './CatalogBase';
import { asArray, getClassesFromObject, loadModule, toStringSafe } from '../util';

/**
 * Options for 'ApplicationCatalog' class.
 */
export interface ApplicationCatalogOptions {
    /**
     * The custom (application) process.
     */
    application?: NodeJS.Process;
    /**
     * One or more patterns of file to exclude.
     */
    exclude?: string | string[];
    /**
     * One or more patterns. Default: *.js or *.ts
     */
    patterns?: string | string[];
}

/**
 * A catalog based on one or more JavaScript modules of the current application (e.g.).
 */
export class ApplicationCatalog extends CatalogBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {ApplicationCatalogOptions} [options] The custom options.
     */
    public constructor(
        public readonly options?: ApplicationCatalogOptions,
    ) {
        super();

        if (_.isNil(options)) {
            options = {} as any;
        }

        this.options = options;
    }

    /**
     * Gets the underlying application (process),
     */
    public get application(): NodeJS.Process {
        return this.options.application ||
            process;
    }

    /** @inheritdoc */
    public async getClasses(): Promise<any[]> {
        return this.loadClasses(
            await fastGlob(
                this.getPatterns(),
                this.getGlobOptions(),
            )
        );
    }

    /** @inheritdoc */
    public getClassesSync(): any[] {
        return this.loadClasses(
            fastGlob.sync(
                this.getPatterns(),
                this.getGlobOptions(),
            )
        );
    }

    private getGlobOptions(): fastGlob.Options {
        return {
            absolute: true,
            cwd: path.dirname(
                this.application.mainModule.filename
            ),
            ignore: asArray(this.options.exclude)
                .map(x => toStringSafe(x))
                .filter(x => '' !== x.trim()),
            onlyFiles: true,
            unique: true,
        };
    }

    private getPatterns(): string[] {
        const PATTERNS = asArray(this.options.patterns)
            .map(x => toStringSafe(x))
            .filter(x => '' !== x.trim());

        if (!PATTERNS.length) {
            PATTERNS.push(
                '*' + path.extname(process.mainModule.filename)
            );
        }

        return PATTERNS;
    }

    private loadClasses(files: string[]): any[] {
        const CLASS_LIST: any[] = [];

        files.forEach(f => {
            const MODULE = loadModule(
                path.join(
                    path.dirname(f),
                    path.basename(f, path.extname(f)),
                ),
                true
            );

            CLASS_LIST.push.apply(
                CLASS_LIST,
                getClassesFromObject(MODULE)
            );
        });

        return CLASS_LIST;
    }
}