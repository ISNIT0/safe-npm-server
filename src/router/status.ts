import { Router } from 'express';
import Repository = require('github-api/dist/components/Repository');
import * as asyncHandler from 'express-async-handler';
import { config } from 'src/config';
import axios from 'axios';
import * as path from 'path';
import { PackageVersion } from 'src/models/packageVersion.model';
import { Report } from 'src/models/report.model';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

import * as imagemin from 'imagemin';
import * as imageminPngquant from 'imagemin-pngquant';

import * as Handlebars from 'handlebars';

const router = Router();

let browser: puppeteer.Browser;
puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    .then(b => browser = b)
    .catch(err => {
        console.error(`Failed to start Puppeteer:`, err);
        process.exit(1);
    });


const projectRootPath = path.resolve('./');
const summaryTemplate = Handlebars.compile(fs.readFileSync(path.join(projectRootPath, 'res/summaryTemplate.html'), 'utf8'));
const badgeSVGs = fs.readdirSync(path.join(projectRootPath, 'res/'))
    .filter(fn => fn.includes('badge'))
    .reduce((acc: any, fn) => {
        const grade = fn.replace('badge', '').split('.')[0];
        acc[grade] = 'data:image/svg+xml;base64,' + Buffer.from(fs.readFileSync(path.join(projectRootPath, 'res', fn), 'utf8')).toString('base64');
        return acc;
    }, {});

router.get('/:packageName.:format(png|json)',
    asyncHandler(async (req, res) => {
        const { packageName, format } = req.params as any;

        const { time: versions } = await getPackageInfo(packageName);

        const latestVersions = Object.keys(versions)
            .filter(v => !isNaN(Number(v.replace(/\./g, ''))))
            .sort((a, b) => new Date(versions[a]) < new Date(versions[b]) ? 1 : -1)
            .slice(0, 5);

        const versionStatuses = await Promise.all(
            latestVersions
                .map(async (version) => {
                    let pv = await PackageVersion.findOne({ packageName, version });
                    if (!pv) {
                        const _pv = new PackageVersion();
                        _pv.packageName = packageName;
                        _pv.version = version;

                        _pv.reports = [];
                        pv = await _pv.save();

                        console.info(`Testing [${packageName}@${version}] async`);
                        startPackageTest(packageName, version) // TODO: queue
                            .catch(err => console.error(`Err testing [${packageName}@${version}]`, err));
                    }

                    const grade = pv.reports.length ? pv.reports[0].grade : 'U'; // TODO: get most recent report
                    return {
                        version,
                        grade,
                    };
                })
        );

        if (format === 'json') {
            res.json(versionStatuses);
        } else {
            const img = await makeSummaryImage(packageName, versionStatuses);
            res.contentType('png');
            res.send(img);
        }
    })
);

function getPackageInfo(packageName: string) {
    return axios.get(`http://registry.npmjs.com/${packageName}`).then(a => a.data);
}

const repo = new Repository('ISNIT0/npm-package-tester', {
    token: config.github.token
});

async function startPackageTest(packageName: string, version: string) {
    const newBranch = `auto/${packageName}_${version}`;
    const newContent = JSON.stringify({ packageName, version }, null, '\t');

    await repo.createBranch('master', newBranch);

    try {
        await repo.writeFile(newBranch, 'test.json', newContent, `Automatically triggering test for [${packageName}@${version}]`, {});
    } catch (err) {
        console.error(err);
    }
}

function getTravisBuild(packageName: string, version: string) {
    return axios.get(`https://api.travis-ci.org/repos/ISNIT0/npm-package-tester/branches/auto/${packageName}_${version}`, {
        headers: {
            Authorization: `token "${config.travis.token}"`
        }
    }).then(a => a.data);
}

const imageminOpts = {
    plugins: [imageminPngquant({ quality: '65-80' })]
};

async function makeSummaryImage(packageName: string, versionStatuses: { grade: string, version: string }[]) {
    const summaryHTML = summaryTemplate({
        packageName,
        reports: versionStatuses.map(s => ({ ...s, svg: badgeSVGs[s.grade] })),
    });

    const page = await browser.newPage();
    let outImg;
    try {
        await page.setContent(summaryHTML, {
            waitUntil: ['domcontentloaded']
        });
        const summaryEl = await page.$('.summary');
        const img = await summaryEl.screenshot({ type: 'png', omitBackground: true });
        outImg = await imagemin.buffer(img, imageminOpts);
    } finally {
        await page.close();
    }
    return outImg;
}

export {
    router as statusRouter
}