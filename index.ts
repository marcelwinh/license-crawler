/*******************************************************
 * Copyright (C) 2018 Marcelwinh https://github.com/marcelwinh
 * 
 * This file is part of license-crawler.
 *******************************************************/
import * as fs from 'fs';


const licenseFormattedList = {};
let licenses = {};
let alreadyKnownDependencies = {};

let depth = 0;


export function crawlLicenses(args: {
  input: string,
  out: string,
  production: boolean,             // if true don't check devDependencies
  statistics: boolean,             // generate statistics
  exclude: string[],
  sorted: string,            // 'license' or 'package'
  format: string,               // 'json' or 'txt'
},                            callback?) {
  const defaultOptions = {
    input: './',                  // input folder which contains package.json
    out: './reportLicenses.json', // output file
    production: true,             // if true don't check devDependencies
    statistics: true,             // generate statistics
    exclude: [],
    sorted: 'license',            // 'license' or 'package'
    format: 'json',               // 'json' or 'txt'
  };
  const options = {
    input: args.input !== undefined ? args.input : defaultOptions.input,
    out: args.out !== undefined ? args.out : defaultOptions.out,
    production: args.production !== undefined ? args.production : defaultOptions.production,
    statistics: args.statistics !== undefined ? args.statistics : defaultOptions.statistics,
    exclude: args.exclude !== undefined ? args.exclude : defaultOptions.exclude,
    sorted: args.sorted !== undefined ? args.sorted : defaultOptions.sorted,
    format: args.format !== undefined ? args.format : defaultOptions.format,
  };
  if (options.input[options.input.length] !== '/' || options.input[options.input.length] !== '\\') options.input += '/';
  if (fs.existsSync(options.input + 'package.json')) {
    const name = JSON.parse(fs.readFileSync(options.input + 'package.json', 'utf8')).name;

    const dependencies = checkDependencies(options.input + 'package.json', name, options);
    let totalLicenses = 0;
    for (const license in licenses) {
      totalLicenses += licenses[license];
    }
    const licensesObject = {};
    for (const license in licenses) {
      licensesObject[license] = {
        count: licenses[license],
        percentage: (Math.round(licenses[license] / totalLicenses * 100 * 100) / 100) + ' %',
      };
      licenseFormattedList[license].total = licenses[license];
      // tslint:disable-next-line:max-line-length
      licenseFormattedList[license].percentage = (Math.round(licenses[license] / totalLicenses * 100 * 100) / 100) + ' %';
    }
    let report = {};
    if (options.sorted === 'license') {
      for (const license in licenses) {
        licenseFormattedList[license].total = licenses[license];
        // tslint:disable-next-line:max-line-length
        licenseFormattedList[license].percentage = (Math.round(licenses[license] / totalLicenses * 100 * 100) / 100) + ' %';
      }
      report = licenseFormattedList;
    } else if (options.sorted === 'package') {
      if (options.statistics) {
        report['statistics'] = licensesObject;
      }
      report['report'] = dependencies;
    } else {
      console.error('wrong sorted chosen');
    }
    if (options.format === 'json') {
      report = JSON.stringify(report, null, 2);
    } else if (options.format === 'txt') {
      // convert to text
      let tmp: string = '';
      if (options.sorted === 'license') {
        for (const license in report) {
          tmp += '├─ license:' + license + ':\n';
          for (const curPackage in report[license].packages) {
            tmp += '│  ├─ package: ' + report[license].packages[curPackage].name + '\n';
            tmp += '│  │  ├─ path: ' + report[license].packages[curPackage].path + '\n';
          }
        }
        report = tmp;
      } else if (options.sorted === 'package') {
        
        for (const key in report.report) {
          
          tmp += '├─' + key + ':\n';
          tmp += '│  ├─ license: ' + report.report[key].license + '\n';
          tmp += checkChilds(report['report'][key].childs, 1);

        }
        report = tmp;
      }
    } else {
      console.log('wrong output format');
    }
    fs.writeFileSync(options.out, report);
  }
  if (callback) {
    callback();
  }
}
function checkChilds(childs: any, dept: number): string {
  depth = dept;
  let tmp: string = '';
  for (const child in childs) {
    if (childs[child].error === undefined) {
      // tslint:disable-next-line:no-increment-decrement
      for (let i = 0; i < depth; i++) {
        tmp += '│  ';
      }
      tmp += '├─' + child + ':\n';
      // tslint:disable-next-line:no-increment-decrement
      for (let i = 0; i < depth; i++) {
        tmp += '│  ';
      }
      tmp += '│  ├─ license: ' + childs[child].license + '\n';
      if (childs[child].childs !== undefined) {
        tmp += checkChilds(childs[child].childs, depth + 1);
        depth = dept - 1;
      }
    }
  }
  return tmp;
}
function checkDependencies(packageJson: string, parent: string, options: {
  input: string,
  out: string,
  production: boolean,             // if true don't check devDependencies
  statistics: boolean,             // generate statistics
  exclude: string[],
  sorted: string,            // 'license' or 'package'
  format: string,               // 'json' or 'txt'
}): Object {
  let tmp = {};
  if (fs.existsSync(packageJson)) {
    let dependencies = JSON.parse(fs.readFileSync(packageJson, 'utf8')).dependencies;
    if (dependencies === undefined) {
      dependencies = {};
    }
    if (options && !options.production) {
      const devDependencies = JSON.parse(fs.readFileSync(packageJson, 'utf8')).devDependencies;
      if (devDependencies) {
        for (const dependency in devDependencies) {
          dependencies[dependency] = devDependencies[dependency];
        }
      }
    }

    // get license
    for (const npmPackage in dependencies) {
      if (fs.existsSync(options.input + 'node_modules/' + npmPackage + '/package.json')) {
        // tslint:disable-next-line:max-line-length
        let license = JSON.parse(fs.readFileSync(options.input  + 'node_modules/' + npmPackage + '/package.json', 'utf8')).license;
        if (typeof license === 'object') {
          license = license.type;
        }
        license = license ? license : 'UNKNOWN';
        if (options.exclude.indexOf(license) === -1) {
          const childPackageJson = options.input + 'node_modules/' + npmPackage + '/package.json';
          const childsParent = parent + '/' + npmPackage;
          if (alreadyKnownDependencies[npmPackage + '@' + dependencies[npmPackage]] === undefined) {
            alreadyKnownDependencies[npmPackage + '@' + dependencies[npmPackage]] = '';
            const childs = checkDependencies(childPackageJson, childsParent, options);
            if (licenses[license] !== undefined) {
              licenses[license] = licenses[license] + 1;
            } else {
              licenses[license] = 1;
            }
            tmp[npmPackage + '@' + dependencies[npmPackage]] = {
              license,
              path: parent,
            };
            if (licenseFormattedList[license]) {
              // tslint:disable-next-line:max-line-length
              licenseFormattedList[license].packages.push({ name: npmPackage + '@' + dependencies[npmPackage], path: parent });
            } else {
              licenseFormattedList[license] = {
                total: 1,
                percentage: '',
                packages: [{
                  name: npmPackage + '@' + dependencies[npmPackage],
                  path: parent,
                }],
              };
            }

            if (Object.keys(childs).length !== 0) {
              tmp[npmPackage + '@' + dependencies[npmPackage]].childs = childs;
            }
          }
        }
        
      } else {
        tmp[options.input + 'node_modules/' + npmPackage + '/package.json'] = { parent, error: 'file not found' };
      }

    }
  } else {
    tmp[packageJson] = 'file not found';
  }
  return tmp;
}
