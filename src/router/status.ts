import { Router } from 'express';
import Repository = require('github-api/dist/components/Repository');
import * as asyncHandler from 'express-async-handler';
import { config } from 'src/config';
import axios from 'axios';
import * as path from 'path';
import { PackageVersion } from 'src/models/packageVersion.model';
import { Report } from 'src/models/report.model';

const router = Router();

const projectRootPath = path.resolve('./');

// TODO: JSON and PNG api
router.get('/:packageName.:format(svg|json)',
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
                        pv = await _pv.save();
                    }

                    const report = await Report.findOne({ packageVersion: pv });
                    let grade = '?';
                    if (report) {
                        grade = report.grade;
                    } else {
                        const report = new Report();
                        report.packageVersion = pv;
                        report.grade = '?';
                        report.comments = 'pending';
                        report.updatedAt = new Date();
                        await report.save();
                        // pv.report = report;
                        // await pv.save();
                        console.info(`Testing [${packageName}@${version}] async`);
                        startPackageTest(packageName, version) // TODO: queue
                            .catch(err => console.error(`Err testing [${packageName}@${version}]`, err));
                    }

                    return {
                        version,
                        grade
                    };
                })
        );

        if (format === 'json') {
            res.json(versionStatuses);
        } else {
            // TODO: Implement
            res.json({ comingSoon: true });
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


export {
    router as statusRouter
}