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
import { CatalogBase } from './CatalogBase';
import { getClassesFromObject } from '../util';

/**
 * A catalog for a JavaScript module.
 */
export class ModuleCatalog extends CatalogBase {
    private readonly _MODULE: any;

    /**
     * Initializes a new instance of that class.
     *
     * @param {any} mod The mod.
     * 
     * @throws {Error} 'mod' is (null) or (undefined).
     */
    public constructor(mod: any) {
        super();

        if (_.isNil(mod)) {
            throw new Error('cls must not be null and undfined');
        }

        this._MODULE = mod;
    }

    /** @inheritdoc */
    public getClassesSync(): any[] {
        return getClassesFromObject(this._MODULE);
    }
}