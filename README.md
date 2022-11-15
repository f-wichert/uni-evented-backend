# Evented - Backend

## Description

Backend for Evented Application using Node.js & Express.js with Typescript

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

`lint` + `format` also automatically run through a git hook on all staged changes before every commit.

## Packages

-   express
-   dotenv
-   sequelize

## [Initial setup](https://blog.logrocket.com/how-to-set-up-node-typescript-express/)

1. `npm init`
2. `npm install express dotenv`
3. `touch index.js`
4. `touch .env`
5. `npm i -D typescript @types/express @types/nodes`
6. `npx tsc --init`
7. `npm i -D concurrently nodemon`
8. `npm install --save sequelize`
9. `npm install --save sqlite3`
