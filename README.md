# Evented - Backend

## Description

Backend for Evented Application using Node.js & Express.js with Typescript.

## Typescript

-   [Documentation](https://www.typescriptlang.org/docs/)
-   [Types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types)

## Database

-   [Sequelize - Core Concepts](https://sequelize.org/docs/v6/category/core-concepts/)
-   [Sequelize - Migrations - Setup for production](https://sequelize.org/docs/v6/other-topics/migrations/)

## Installation for usage

-   `npm i` to install packages (run this first)
-   `npm run dev` to run server in dev mode
    -   Automatically rebuilds+restarts when it detects changes

## Scripts

-   `npm run lint` to run eslint and check for common issues
-   `npm run format` to automatically format all files with consistent styling
-   `npm run test` to run unit tests
-   `npm run resetDB` to completely wipe and reinitialize the database with placeholder data

`lint` + `format` also automatically run through a git hook on all staged changes before every commit.

## Packages

-   express
-   dotenv
-   sequelize
-   passport
-   zod
-   node-media-server
