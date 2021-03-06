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

/**
 * Keeps sure to return a value as array.
 *
 * @param {T|T[]} val The input value.
 *
 * @return {T[]} The output value.
 */
export function asArray<T>(val: T | T[]): T[] {
    if (!Array.isArray(val)) {
        val = [val];
    }

    return val.filter(i => !_.isNil(i));
}

/**
 * Returns classes of an object deep.
 *
 * @param {any} obj The object.
 * 
 * @return {any[]} The list of classes.
 */
export function getClassesFromObject(obj: any): any[] {
    return getClassesFromObjectInner(obj, []);
}

function getClassesFromObjectInner(obj: any, alreadyHandled: any[]): any[] {
    if (_.isNil(obj)) {
        return;
    }
    if (alreadyHandled.some(x => x === obj)) {
        return;
    }

    alreadyHandled.push(obj);

    const CLASS_LIST: any[] = [];
    for (const PROP in obj) {
        const VALUE: any = obj[PROP];

        if (_.isFunction(VALUE) && _.isFunction(VALUE.constructor)) {
            CLASS_LIST.push(VALUE);
        } else {
            CLASS_LIST.push(
                ...getClassesFromObjectInner(VALUE, alreadyHandled)
            );
        }
    }

    return CLASS_LIST;
}

/**
 * Loads a module.
 *
 * @param {string} file The path to the module. 
 * @param {boolean} [useCache] Use cache or not.
 * 
 * @return {TModule} The module.
 */
export function loadModule<TModule = any>(
    file: string, useCache = false,
): TModule {
    file = require.resolve(
        toStringSafe(file)
    );

    if (!useCache) {
        delete require.cache[file];
    }

    return require(file);
}

/**
 * Converts a value to a boolean, if needed.
 *
 * @param {any} val The input value.
 * @param {boolean} [defaultValue] The custom default value.
 *
 * @return {string} The output value.
 */
export function toBooleanSafe(val: any, defaultValue: boolean = false): boolean {
    if (_.isNil(val)) {
        return !!defaultValue;
    }

    return !!val;
}

/**
 * Converts a value to a string, if needed, that is not (null) and (undefined).
 *
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function toStringSafe(val: any): string {
    if (_.isString(val)) {
        return val;
    }

    if (_.isNil(val)) {
        return '';
    }

    if (_.isFunction(val)) {
        return val.name;
    }

    if (_.isFunction(val['toString'])) {
        return String(
            val.toString()
        );
    }

    return String(val);
}