[![npm](https://img.shields.io/npm/v/@egodigital/nef.svg)](https://www.npmjs.com/package/@egodigital/nef)

# NEF (Node.js Extensibility Framework)

[Managed Extensibility Framework](https://docs.microsoft.com/en-us/dotnet/framework/mef/) like library written for [Node.js 10+](https://nodejs.org/), in [TypeScript](https://www.typescriptlang.org/).

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egodigital/nef
```

## Usage

### Build

```bash
# install modules
npm install

# build
npm run build
```

### Requirements

#### TypeScript

You have to enable [decorator](https://www.typescriptlang.org/docs/handbook/decorators.html) feature in your `tsconfig.json` file:

```jsonc
{
    "compilerOptions": {
        // ...

        "experimentalDecorators": true
    },
    
    // ...
}
```

### Examples

##### Quick start

###### Exports

First define a service and a contract:

```typescript
import { Export } from '@egodigital/nef';

interface IMyService {
    foo(): string;
}

@Export('IMyService') // we have to use a string here, because in TypeScript, Interfaces are virtual and no objects
export class MyService implements IMyService {
    public foo() {
        return 'bar';
    }
}
```

In that example `MyService` is the implemented service of `IMyService` contract.

##### Imports

Now, implement a class, which gets an instance, exported with `IMyService` contract, as injected object:

```typescript
import { Import } from '@egodigital/nef';

export class MyContext {
    @Import('IMyService')
    public service: IMyService;
}
```

##### Injections

At the end, the thing, which collects all exports and injects them into object properties, marked with `@Import` decorators, is an `CompositionContainer` instance:

```typescript
import { CompositionContainer } from '@egodigital/nef';

let context = new MyContext();

let container = new CompositionContainer();
container.addClasses(MyService);  // tell explicitly, that 'MyService' is
                                  // a class with an '@Export' decorator

container.composeSync(context);
// now 'context.service' should
// hold an instance of 'MyService' class
// managed by 'container'
```

### Catalogs

Catalogs helps to detect classes, which should be exported as services. 

#### ApplicationCatalog

A catalog based on one or more JavaScript modules one application.

```typescript
import { ApplicationCatalog, CompositionContainer } from '@egodigital/nef';

let container = new CompositionContainer();
container.addCatalogs(
    new ApplicationCatalog(process)  // add current application
);

// shorter:
// container.addApplications(process);
```

#### ClassCatalog

A catalog for a single class.

```typescript
import { ClassCatalog, CompositionContainer, Export } from '@egodigital/nef';

@Export()
class MyService {
}

let container = new CompositionContainer();
container.addCatalogs(
    new ClassCatalog(MyService)
);

// shorter:
// container.addClasses(MyService);
```

#### DirectoryCatalog

A catalog based on one or more JavaScript modules in a directory.

```typescript
import { CompositionContainer, DirectoryCatalog } from '@egodigital/nef';

let container = new CompositionContainer();
container.addCatalogs(
    new DirectoryCatalog('/path/to/directory')
);

// shorter:
// container.addDirectories('/path/to/directory');
```

#### FileCatalog

A catalog based on one or more JavaScript modules in a single file.

```typescript
import { CompositionContainer, FileCatalog } from '@egodigital/nef';

let container = new CompositionContainer();
container.addCatalogs(
    new FileCatalog('/path/to/file.js')
);

// shorter:
// container.addFiles('/path/to/file.js');
```

#### ModuleCatalog

A catalog for a JavaScript module.

```typescript
import { CompositionContainer, ModuleCatalog } from '@egodigital/nef';
const myModule = require('my-module');

let container = new CompositionContainer();
container.addCatalogs(
    new ModuleCatalog(myModule)
);

// shorter:
// container.addModules(myModule);
```

## Documentation

The API documentation can be found [here](https://egodigital.github.io/nef/).
