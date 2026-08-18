import type { OperationSchema } from './types';

export interface ContractValidationIssue {
    path: string;
    message: string;
}

const SCHEMA_TYPES = new Set(['object', 'array', 'string', 'number', 'boolean', 'null']);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatSchemaPath(path: string, key: string): string {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)
        ? `${path}.${key}`
        : `${path}[${JSON.stringify(key)}]`;
}

function schemaTypeMatches(value: unknown, type: string): boolean {
    switch (type) {
        case 'object':
            return isRecord(value);
        case 'array':
            return Array.isArray(value);
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && Number.isFinite(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'null':
            return value === null;
        default:
            return false;
    }
}

function valuesEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) {
        return true;
    }
    return typeof left === 'object'
        && typeof right === 'object'
        && JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Validates the JSON-compatible subset used by operation contracts.
 * Required fields are checked against properties here so a typo cannot
 * silently produce a contract that accepts less than its advertised shape.
 */
export function assertOperationSchema(schema: OperationSchema, path = '$'): void {
    if (!isRecord(schema)) {
        throw new Error(`Invalid operation schema at ${path}: expected an object.`);
    }

    const declaredType = schema.type;
    if (declaredType !== undefined && (typeof declaredType !== 'string' || !SCHEMA_TYPES.has(declaredType))) {
        throw new Error(`Invalid operation schema at ${path}: unknown type.`);
    }

    const required = schema.required;
    if (required !== undefined) {
        if (!Array.isArray(required) || required.some(value => typeof value !== 'string')) {
            throw new Error(`Invalid operation schema at ${path}: required must be an array of strings.`);
        }

        if (new Set(required).size !== required.length) {
            throw new Error(`Invalid operation schema at ${path}: required fields must be unique.`);
        }

        if (declaredType !== 'object') {
            throw new Error(`Invalid operation schema at ${path}: required is only valid for object schemas.`);
        }
    }

    if (schema.enum !== undefined) {
        if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
            throw new Error(`Invalid operation schema at ${path}: enum must be a non-empty array.`);
        }
        const enumValues = schema.enum as unknown[];
        for (let index = 0; index < enumValues.length; index += 1) {
            if (enumValues.slice(index + 1).some(candidate => valuesEqual(enumValues[index], candidate))) {
                throw new Error(`Invalid operation schema at ${path}: enum values must be unique.`);
            }
        }
    }

    if (schema.anyOf !== undefined) {
        if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
            throw new Error(`Invalid operation schema at ${path}: anyOf must be a non-empty array.`);
        }
        schema.anyOf.forEach((branch, index) => {
            assertOperationSchema(branch as OperationSchema, `${path}.anyOf[${index}]`);
        });
    }

    if (schema.properties !== undefined) {
        if (declaredType !== 'object' || !isRecord(schema.properties)) {
            throw new Error(`Invalid operation schema at ${path}: properties require an object schema.`);
        }
        Object.entries(schema.properties).forEach(([key, child]) => {
            assertOperationSchema(child as OperationSchema, formatSchemaPath(path, key));
        });

        for (const requiredKey of (required as string[] | undefined) ?? []) {
            if (!Object.prototype.hasOwnProperty.call(schema.properties, requiredKey)) {
                throw new Error(`Invalid operation schema at ${path}: required field "${requiredKey}" must be declared in properties.`);
            }
        }
    }

    if (schema.items !== undefined) {
        if (declaredType !== 'array') {
            throw new Error(`Invalid operation schema at ${path}: items require an array schema.`);
        }
        assertOperationSchema(schema.items as OperationSchema, `${path}.items`);
    }
}

function validateContractValueInternal(
    value: unknown,
    schema: OperationSchema,
    path: string
): ContractValidationIssue[] {
    const issues: ContractValidationIssue[] = [];

    if (Array.isArray(schema.anyOf)) {
        const branchIssues = schema.anyOf.map(branch => validateContractValueInternal(
            value,
            branch as OperationSchema,
            path
        ));
        if (branchIssues.some(branch => branch.length === 0)) {
            return [];
        }
        return branchIssues[0] || [{ path, message: 'does not match any allowed shape' }];
    }

    if (Array.isArray(schema.enum) && !schema.enum.some(candidate => valuesEqual(value, candidate))) {
        return [{
            path,
            message: `must be one of: ${schema.enum.map(candidate => String(candidate)).join(', ')}`
        }];
    }

    if (typeof schema.type === 'string' && !schemaTypeMatches(value, schema.type)) {
        return [{
            path,
            message: schema.type === 'number'
                ? 'must be a finite number'
                : `must be ${schema.type === 'array' ? 'an' : 'a'} ${schema.type}`
        }];
    }

    if (schema.type === 'object' && isRecord(value)) {
        const required = Array.isArray(schema.required) ? schema.required : [];
        for (const key of required) {
            if (!Object.prototype.hasOwnProperty.call(value, key)) {
                issues.push({ path: formatSchemaPath(path, key), message: 'is required' });
            }
        }

        if (isRecord(schema.properties)) {
            for (const [key, childSchema] of Object.entries(schema.properties)) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    issues.push(...validateContractValueInternal(
                        value[key],
                        childSchema as OperationSchema,
                        formatSchemaPath(path, key)
                    ));
                }
            }
        }
    }

    if (schema.type === 'array' && Array.isArray(value) && schema.items) {
        value.forEach((entry, index) => {
            issues.push(...validateContractValueInternal(entry, schema.items as OperationSchema, `${path}[${index}]`));
        });
    }

    return issues;
}

export function validateContractValue(
    value: unknown,
    schema: OperationSchema
): ContractValidationIssue[] {
    assertOperationSchema(schema);
    return validateContractValueInternal(value, schema, '$');
}

export function assertContractValue(value: unknown, schema: OperationSchema): void {
    const issues = validateContractValue(value, schema);
    if (issues.length > 0) {
        throw new Error(`Contract validation failed: ${issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
    }
}
