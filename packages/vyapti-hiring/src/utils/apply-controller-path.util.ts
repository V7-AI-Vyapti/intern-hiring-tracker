import type { Type } from '@nestjs/common';

const applyControllerPath = (args: {
    controllers: Array<Type<unknown>>;
    path: string;
}): void => {
    for (const controller of args.controllers) {
        Reflect.defineMetadata('path', args.path, controller);
    }
};

export { applyControllerPath };
