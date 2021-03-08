#!/usr/bin/env node
import { app } from "./app";
import { iocContainer } from "./ioc";
import { HistoryCacheService } from "./services/historyCacheService";

const port = process.env.SERVER_PORT


app.listen(port, () =>
    // tslint:disable-next-line:no-console
  console.log(`server started listening at http://localhost:${port}`)
);


// Initialize dbService (will be instantiated in container)
export const historyCache = iocContainer(null).get(HistoryCacheService)
