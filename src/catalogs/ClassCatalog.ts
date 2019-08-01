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
import { ComposablePartCatalog } from '../index';

/**
 * A catalog for a single class.
 */
export class ClassCatalog implements ComposablePartCatalog {
    private readonly _CLASS: Function;

    /**
     * Initializes a new instance of that class.
     *
     * @param {any} cls The class.
     */
    public constructor(cls: any) {
        if (!_.isFunction(cls) || !_.isFunction(cls.constructor)) {
            throw new Error('cls must be a constructor function');
        }

        this._CLASS = cls;
    }

    /** @inheritdoc */
    public async getClasses(): Promise<any[]> {
        return this.getClassesSync();
    }

    /** @inheritdoc */
    public getClassesSync(): any[] {
        return [this._CLASS];
    }
}