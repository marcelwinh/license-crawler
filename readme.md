

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
import crawler = require('license-crawler');



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
import crawler = require('license-crawler');

crawler.crawlLicenses({
  input: './',                  // input folder which contains package.json
  out: './reportLicenses.json', // output file
  production: false,             // if true don't check devDependencies
  statistics: true,             // generate statistics
  exclude: ['MIT'],
  sorted: 'license',            // 'license' or 'package'
  format: 'json',               // 'json' or 'txt'
});
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.