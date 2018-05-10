

# license-crawler

crawls a npm package and it's dependencies for their licenses

## Installation

#### npm
```sh
npm install license-crawler
```
## Usage


### NodeJS Example
```javascript
// Import license-crawler
var crawler = require('license-crawler');



// setting options
const options = {
  input: './',                  // input folder which contains package.json
  out: './reportLicenses.json', // output file
  production: false,            // if true don't check devDependencies
  statistics: true,             // generate statistics
  exclude: [],
  sorted: 'license',            // 'license' or 'package'
  format: 'json',               // 'json' or 'txt'
};

// Set configuration
crawler.crawlLicenses(options);
```

### JavaScript Example

```javascript
// Import license-crawler
var crawler = require('license-crawler');

crawler.crawlLicenses({
  input: './',                  // input folder which contains package.json
  out: './reportLicenses.json', // output file
  production: false,             // if true don't check devDependencies
  statistics: true,             // generate statistics
  exclude: [],
  sorted: 'license',            // 'license' or 'package'
  format: 'json',               // 'json' or 'txt'
});
```
## Output

### format: 'json' license sorted
```json
{
  "MIT": {
    "total": 34,
    "percentage": "45.33 %",
    "packages": [...]
  },
  "Apache-2.0": {
    "total": 24,
    "percentage": "32 %",
    "packages": [...]
  },
  "ISC": {
    "total": 11,
    "percentage": "14.67 %",
    "packages": [...]
  },
  "BSD-3-Clause": {
    "total": 2,
    "percentage": "2.67 %",
    "packages": [...]
  },
  "BSD-2-Clause": {
    "total": 1,
    "percentage": "1.33 %",
    "packages": [...]
  },
  "UNKNOWN": {
    "total": 3,
    "percentage": "4 %",
    "packages": [...]
  }
}
```


### format: 'txt' package sorted
```txt
├─license-crawler@0.0.3:
│  ├─ license: MIT
│  ├─@types/node@9.6.6:
│  │  ├─ license: MIT
│  ├─tslint@5.9.1:
│  │  ├─ license: Apache-2.0
│  │  ├─babel-code-frame@^6.22.0:
│  │  │  ├─ license: MIT
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.