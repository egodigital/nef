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
import { ComposablePartCatalog } from '../index';
import { toBooleanSafe } from '../util';

/**
 * A predicate for 'FilteredCatalog<TCatalog>' class.
 * 
 * @param {any} cls The current class.
 * @param {number} index The zero-based index inside the container.
 * @param {TCatalog} catalog The underlying catalog.
 * 
 * @return {boolean} Class matches criteria or not.
 */
export type FilteredCatalogPredicate<TCatalog extends ComposablePartCatalog = ComposablePartCatalog> =
    (cls: any, index: number, catalog: TCatalog) => boolean;

/**
 * A catalog, which filters the exports of a base catalog.
 */
export class FilteredCatalog<TCatalog extends ComposablePartCatalog = ComposablePartCatalog> extends CatalogBase {
    /**
     * Initializes a new instance of that class.
     *
     * @param {TCatalog} catalog The underlying (base) catalog.
     * @param {FilteredCatalogPredicate<TCatalog>} predicate The predicate to use.
     */
    public constructor(
        public readonly catalog: TCatalog,
        public readonly predicate: FilteredCatalogPredicate<TCatalog>,
    ) {
        super();
    }

    /** @inheritdoc */
    public async getClasses(): Promise<any[]> {
        return (await this.catalog.getClasses())
            .filter((cls, i) => toBooleanSafe(this.predicate(cls, i, this.catalog)));
    }

    /** @inheritdoc */
    public getClassesSync(): any[] {
        return this.catalog.getClassesSync()
            .filter((cls, i) => toBooleanSafe(this.predicate(cls, i, this.catalog)));
    }
}