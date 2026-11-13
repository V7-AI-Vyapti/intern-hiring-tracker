import 'reflect-metadata';
import type { Type } from '@nestjs/common';

const CONTROLLER_PATH_METADATA = 'path';

function applyControllerPath(args: {
    controllers: Array<Type<unknown>>;
    path: string;
}): void {
    for (const controller of args.controllers) {
        Reflect.defineMetadata(CONTROLLER_PATH_METADATA, args.path, controller);
    }
}

export { applyControllerPath, CONTROLLER_PATH_METADATA };
