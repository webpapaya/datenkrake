# Datenkrake
**Under heavy development**

Datenkrake is a rough idea of mine. Datenkrake is a unified data-access layer which can be used in the browser and on the server. The idea is to have composable queries which can be serialised into query params and interpreted on the server. It might be seen as stripped down graphQL over REST. The idea came to me while checking out PostgREST which provides a REST-API based on your postgres schema.

## Quick introduction:

```js
import { buildRepository as buildPGRepository } from 'datenkrake/adapters/postgres';
import { buildRepository as buildInMemoryRepository } from 'datenkrake/adapters/in-memory';

import { q, where, eq } from 'datenkrake';

const pgRepository = buildPGRepository({ resource: 'user' });
const inMemoryRepository = buildInMemoryRepository({ resource: 'user' });

// The same query can be used in any repository 
const userQuery = q(where({ id: eq(10) }));

await pgRepository.where(userQuery);
await inMemoryRepository.where(userQuery);
```

## There is more:
But too little time to document and finish...


