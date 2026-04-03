#!/usr/bin/env node
require('../src/main').run().catch((error) => {
    console.error(error);
    process.exit(1);
});
