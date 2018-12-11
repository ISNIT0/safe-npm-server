import { Router } from 'express';
import Repository = require('github-api/dist/components/Repository');
import * as asyncHandler from 'express-async-handler';
import { config } from 'src/config';
import axios from 'axios';
import * as path from 'path';
import { PackageVersion } from 'src/models/packageVersion.model';
import { Review } from 'src/models/review.model';

const router = Router();

const projectRootPath = path.resolve('./');

const pendingStates = ['created', 'started'];

// TODO: JSON and PNG api
router.get('/:packageName/:version.:format(svg|json)',
    asyncHandler(async (req, res) => {
        const { packageName, version, format } = req.params as any;
        const pv = await PackageVersion.findOne({ packageName, version });
        if (pv) {
            if (!!~pendingStates.indexOf(pv.automaticTestStatus)) {
                const build = await getTravisBuild(packageName, version);
                const buildStatus = build.branch.state;
                pv.automaticTestStatus = buildStatus;
                const savedPv = await pv.save();
                if (format === 'json') {
                    res.json(savedPv);
                } else {
                    const grade = await getGrade(savedPv);
                    res.sendFile(path.join(projectRootPath, 'res', `badge${grade}.svg`));
                }
            } else {
                if (format === 'json') {
                    res.json(pv);
                } else {
                    const grade = await getGrade(pv);
                    res.sendFile(path.join(projectRootPath, 'res', `badge${grade}.svg`));
                }
            }
        } else {
            const pv = new PackageVersion();
            pv.packageName = packageName;
            pv.version = version;
            pv.automaticTestStatus = 'created';
            await startPackageTest(packageName, version);
            const savedPv = await pv.save();
            if (format === 'json') {
                res.json(savedPv);
            } else {
                const grade = await getGrade(savedPv);
                res.sendFile(path.join(projectRootPath, 'res', `badge${grade}.svg`));
            }
        }
    })
);

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

const gradeXState = {
    created: '?',
    started: '?',
    failed: 'F',
    passed: 'C',
    cancelled: '?'
};
async function getGrade(pv: PackageVersion): Promise<'A' | 'B' | 'C' | 'D' | 'F' | '?'> {
    const reviews = await Review.find({ packageVersion: pv });
    const latestReview = reviews[0]; //TODO: Sort reviews
    if (latestReview) {
        return latestReview.grade;
    } else {
        return gradeXState[pv.automaticTestStatus] as any || '?';
    }
}


export {
    router as statusRouter
}