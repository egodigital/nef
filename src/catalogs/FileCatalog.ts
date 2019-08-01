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
import * as path from 'path';
import { ComposablePartCatalog } from '../index';
import { getClassesFromObject, toStringSafe } from '../util';

/**
 * Options for 'FileCatalog' class.
 */
export interface FileCatalogOptions {
    /**
     * The custom current work directory. Default: process.cwd()
     */
    cwd?: string;
}

/**
 * A catalog based on a JavaScript module in a file.
 */
export class FileCatalog implements ComposablePartCatalog {
    /**
     * Initializes a new instance of that class.
     *
     * @param {string} file The path to the file.
     * @param {FileCatalogOptions} [options] Custom options.
     */
    public constructor(
        public readonly file: string,
        public readonly options?: FileCatalogOptions,
    ) {
        this.file = toStringSafe(file);

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

        if (!path.isAbsolute(this.file)) {
            this.file = path.join(
                cwd, this.file
            );
        }
        this.file = path.resolve(this.file);
    }

    /** @inheritdoc */
    public async getClasses(): Promise<any[]> {
        return this.getClassesSync();
    }

    /** @inheritdoc */
    public getClassesSync(): any[] {
        return getClassesFromObject(
            require(
                require.resolve(this.file)
            )
        );
    }
}