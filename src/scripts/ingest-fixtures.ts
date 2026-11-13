import 'reflect-metadata';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getEntityWithName } from '@vyapti/core';
import { z } from 'zod';
import dataSource from '../core/database/typeorm.config';

const FIXTURE_FILE_EXTENSION = '.json';
const DEFAULT_FIXTURES_DIRECTORY = path.join(
    process.cwd(),
    'src',
    'generated',
    'fixtures',
);

const FixtureRowsSchema = z.array(z.record(z.string(), z.unknown()));

type FixtureIngestResult = {
    entityName: string;
    fileName: string;
    rowCount: number;
    replacedExistingRows: boolean;
};

function resolveFixturesDirectory(): string {
    const configuredFixturesDirectory = process.env.FIXTURES_DIR?.trim();

    if (configuredFixturesDirectory) {
        return path.resolve(configuredFixturesDirectory);
    }

    return DEFAULT_FIXTURES_DIRECTORY;
}

function readEntityNameFromFixtureFile(fileName: string): string {
    return path.basename(fileName, path.extname(fileName));
}

async function listFixtureFiles(fixturesDirectory: string): Promise<string[]> {
    const directoryEntries = await fs.readdir(fixturesDirectory, {
        withFileTypes: true,
    });

    return directoryEntries
        .filter((entry) => {
            return (
                entry.isFile() &&
                path.extname(entry.name) === FIXTURE_FILE_EXTENSION
            );
        })
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));
}

async function readFixtureRows(fixtureFilePath: string): Promise<unknown> {
    const fixtureContents = await fs.readFile(fixtureFilePath, 'utf8');
    return JSON.parse(fixtureContents) as unknown;
}

async function ingestFixtureFile(args: {
    fixturesDirectory: string;
    fileName: string;
}): Promise<FixtureIngestResult> {
    const entityName = readEntityNameFromFixtureFile(args.fileName);
    const fixtureFilePath = path.join(args.fixturesDirectory, args.fileName);
    const fixtureRows = FixtureRowsSchema.parse(
        await readFixtureRows(fixtureFilePath),
    );
    const entityModel = getEntityWithName(entityName, dataSource);
    const repository = entityModel.getRepository();
    const existingRowCount = await repository.count();

    await repository.clear();

    if (fixtureRows.length > 0) {
        await entityModel.insertMany(fixtureRows);
    }

    return {
        entityName,
        fileName: args.fileName,
        rowCount: fixtureRows.length,
        replacedExistingRows: existingRowCount > 0,
    };
}

async function ingestFixtures(): Promise<FixtureIngestResult[]> {
    const fixturesDirectory = resolveFixturesDirectory();
    const fixtureFiles = await listFixtureFiles(fixturesDirectory);

    const results: FixtureIngestResult[] = [];
    for (const fileName of fixtureFiles) {
        results.push(
            await ingestFixtureFile({
                fixturesDirectory,
                fileName,
            }),
        );
    }

    return results;
}

async function main(): Promise<void> {
    await dataSource.initialize();

    try {
        const results = await ingestFixtures();
        for (const result of results) {
            const replacementNote = result.replacedExistingRows
                ? ' (replaced existing rows)'
                : '';
            console.log(
                `Ingested ${result.rowCount} row(s) from ${result.fileName} into ${result.entityName}${replacementNote}`,
            );
        }

        if (results.length === 0) {
            console.log('No fixture files found to ingest');
        }
    } finally {
        await dataSource.destroy();
    }
}

main().catch((error: unknown) => {
    console.error('Fixture ingestion failed');
    console.error(error);
    process.exitCode = 1;
});
