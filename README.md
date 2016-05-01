# dsf-export-static

A plugin for [DSF](https://github.com/lipsumar/design-system-framework).

Export a static verision of the UI (styleguide) to easily host somewhere (Dropbox, github-pages, FTP, ...).


## How to use

### 1. Install

```
$ npm install dsf-export-static
```

### 2. Configure in DSF config

```json
{
  "plugins":[
    "./node_modules/dsf-export-static"
  ]
}
```

### 3. Use

```
$ npm run dsf dsf-export-static
```

It will export all files in directory `out/export-static/`.

Please report bugs on github.
