"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*******************************************************
 * Copyright (C) 2018 Marcelwinh https://github.com/marcelwinh
 *
 * This file is part of license-crawler.
 *******************************************************/
var fs = require("fs");
var licenseFormattedList = {};
var licenses = {};
var alreadyKnownDependencies = {};
var depth = 0;
function crawlLicenses(args, callback) {
    var defaultOptions = {
        input: './',
        out: './reportLicenses.json',
        production: true,
        statistics: true,
        exclude: [],
        sorted: 'license',
        format: 'json',
    };
    var options = {
        input: args.input !== undefined ? args.input : defaultOptions.input,
        out: args.out !== undefined ? args.out : defaultOptions.out,
        production: args.production !== undefined ? args.production : defaultOptions.production,
        statistics: args.statistics !== undefined ? args.statistics : defaultOptions.statistics,
        exclude: args.exclude !== undefined ? args.exclude : defaultOptions.exclude,
        sorted: args.sorted !== undefined ? args.sorted : defaultOptions.sorted,
        format: args.format !== undefined ? args.format : defaultOptions.format,
    };
    if (fs.existsSync(options.input + 'package.json')) {
        var name_1 = JSON.parse(fs.readFileSync(options.input + 'package.json', 'utf8')).name;
        var dependencies = checkDependencies(options.input + 'package.json', name_1, options);
        var totalLicenses = 0;
        for (var license in licenses) {
            totalLicenses += licenses[license];
        }
        var licensesObject = {};
        for (var license in licenses) {
            licensesObject[license] = {
                count: licenses[license],
                percentage: (Math.round(licenses[license] / totalLicenses * 100 * 100) / 100) + ' %',
            };
            licenseFormattedList[license].total = licenses[license];
            // tslint:disable-next-line:max-line-length
            licenseFormattedList[license].percentage = (Math.round(licenses[license] / totalLicenses * 100 * 100) / 100) + ' %';
        }
        var report = {};
        if (options.sorted === 'license') {
            for (var license in licenses) {
                licenseFormattedList[license].total = licenses[license];
                // tslint:disable-next-line:max-line-length
                licenseFormattedList[license].percentage = (Math.round(licenses[license] / totalLicenses * 100 * 100) / 100) + ' %';
            }
            report = licenseFormattedList;
        }
        else if (options.sorted === 'package') {
            if (options.statistics) {
                report['statistics'] = licensesObject;
            }
            report['report'] = dependencies;
        }
        else {
            console.error('wrong sorted chosen');
        }
        if (options.format === 'json') {
            report = JSON.stringify(report, null, 2);
        }
        else if (options.format === 'txt') {
            // convert to text
            var tmp = '';
            if (options.sorted === 'license') {
                for (var license in report) {
                    tmp += '├─ license:' + license + ':\n';
                    for (var curPackage in report[license].packages) {
                        tmp += '│  ├─ package: ' + report[license].packages[curPackage].name + '\n';
                        tmp += '│  │  ├─ path: ' + report[license].packages[curPackage].path + '\n';
                    }
                }
                report = tmp;
            }
            else if (options.sorted === 'package') {
                for (var key in report.report) {
                    tmp += '├─' + key + ':\n';
                    tmp += '│  ├─ license: ' + report.report[key].license + '\n';
                    tmp += checkChilds(report['report'][key].childs, 1);
                }
                report = tmp;
            }
        }
        else {
            console.log('wrong output format');
        }
        fs.writeFileSync(options.out, report);
    }
    if (callback) {
        callback();
    }
}
exports.crawlLicenses = crawlLicenses;
function checkChilds(childs, dept) {
    depth = dept;
    var tmp = '';
    for (var child in childs) {
        if (childs[child].error === undefined) {
            // tslint:disable-next-line:no-increment-decrement
            for (var i = 0; i < depth; i++) {
                tmp += '│  ';
            }
            tmp += '├─' + child + ':\n';
            // tslint:disable-next-line:no-increment-decrement
            for (var i = 0; i < depth; i++) {
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
function checkDependencies(packageJson, parent, options) {
    var tmp = {};
    if (fs.existsSync(packageJson)) {
        var dependencies = JSON.parse(fs.readFileSync(packageJson, 'utf8')).dependencies;
        if (dependencies === undefined) {
            dependencies = {};
        }
        if (options && !options.production) {
            var devDependencies = JSON.parse(fs.readFileSync(packageJson, 'utf8')).devDependencies;
            if (devDependencies) {
                for (var dependency in devDependencies) {
                    dependencies[dependency] = devDependencies[dependency];
                }
            }
        }
        // get license
        for (var npmPackage in dependencies) {
            if (fs.existsSync(options.input + 'node_modules/' + npmPackage + '/package.json')) {
                // tslint:disable-next-line:max-line-length
                var license = JSON.parse(fs.readFileSync(options.input + 'node_modules/' + npmPackage + '/package.json', 'utf8')).license;
                if (typeof license === 'object') {
                    license = license.type;
                }
                license = license ? license : 'UNKNOWN';
                if (options.exclude.indexOf(license) === -1) {
                    var childPackageJson = options.input + 'node_modules/' + npmPackage + '/package.json';
                    var childsParent = parent + '/' + npmPackage;
                    if (alreadyKnownDependencies[npmPackage + '@' + dependencies[npmPackage]] === undefined) {
                        alreadyKnownDependencies[npmPackage + '@' + dependencies[npmPackage]] = '';
                        var childs = checkDependencies(childPackageJson, childsParent, options);
                        if (licenses[license] !== undefined) {
                            licenses[license] = licenses[license] + 1;
                        }
                        else {
                            licenses[license] = 1;
                        }
                        tmp[npmPackage + '@' + dependencies[npmPackage]] = {
                            license: license,
                            path: parent,
                        };
                        if (licenseFormattedList[license]) {
                            // tslint:disable-next-line:max-line-length
                            licenseFormattedList[license].packages.push({ name: npmPackage + '@' + dependencies[npmPackage], path: parent });
                        }
                        else {
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
            }
            else {
                tmp[options.input + 'node_modules/' + npmPackage + '/package.json'] = { parent: parent, error: 'file not found' };
            }
        }
    }
    else {
        tmp[packageJson] = 'file not found';
    }
    return tmp;
}
//# sourceMappingURL=index.js.map