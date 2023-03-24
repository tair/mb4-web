# mb4-web

This template should help get you started developing with Vue 3 in Vite.

### Configure Local Environment File for Development
```sh
cp development.env.template .env
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Hot-Reload for Development With Container

The container is accessible on http://localhost:3000/

#### Start the container

```sh
docker-compose -f docker-compose.dev.yml up
```

#### Rebuild when .env file gets updated

```sh
docker-compose -f docker-compose.dev.yml up --build
```

#### Force rebuild when package.json or package-lock.json file gets updated

```sh
docker stop mb4-web-container-dev
docker rm mb4-web-container-dev
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

### Compile and Minify for Production

```sh
npm run build
```

### Compile and Minify for Production With Container - Build Only

```sh
docker build -t mb4-web:<version_number> .
```

### Compile and Minify for Production With Container - Host As a Server

The container is accessible on http://localhost:4000/

#### When there is NO package.json or package-lock.json file change 

```sh
docker-compose up --build
```

#### When there is package.json or package-lock.json file change 


```sh
docker stop mb4-web-container
docker rm mb4-web-container
docker-compose build --no-cache
docker-compose up
```