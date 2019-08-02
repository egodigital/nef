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
 * Options for 'DirectoryCatalog' class.
 */
export interface DirectoryCatalogOptions {
    /**
     * The custom current work directory. Default: process.cwd()
     */
    cwd?: string;
    /**
     * One or more patterns of file to exclude.
     */
    exclude?: string | string[];
    /**
     * One or more patterns. Default: *.js / *.ts
     */
    patterns?: string | string[];
}

/**
 * A catalog based on one or more JavaScript modules in a directory.
 */
export class DirectoryCatalog extends CatalogBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {string} directory The path to the directory.
     * @param {FileCatalogOptions} [options] Custom options.
     */
    public constructor(
        public readonly directory: string,
        public readonly options?: DirectoryCatalogOptions,
    ) {
        super();

        this.directory = toStringSafe(directory);

        if (_.isNil(this.options)) {
            this.options = {} as any;
        }

        let cwd = toStringSafe(this.options.cwd);
        if ('' === cwd.trim()) {
            cwd = process.cwd();
        } else {
            if (!path.isAbsolute(cwd)) {
                cwd = path.join(
                    process.cwd(), cwd
                );
            }
        }

        if (!path.isAbsolute(this.directory)) {
            this.directory = path.join(
                cwd, this.directory
            );
        }
        this.directory = path.resolve(this.directory);
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
            cwd: this.directory,
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
                '*' + path.extname(__filename)
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