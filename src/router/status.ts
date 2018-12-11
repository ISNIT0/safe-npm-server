import { Router } from 'express';
import Repository = require('github-api/dist/components/Repository');
import * as asyncHandler from 'express-async-handler';
import { StatusReport } from 'src/models/statusReport.model';
import { config } from 'src/config';
import axios from 'axios';
import * as path from 'path';

const router = Router();

const pendingStates = ['created', 'started'];

// TODO: JSON and PNG api
router.get('/:packageName/:version.:format(svg|json)',
    asyncHandler(async (req, res) => {
        const { packageName, version, format } = req.params as any;
        const packageStatus = await StatusReport.findOne({ packageName, version });
        if (packageStatus) {
            if (!!~pendingStates.indexOf(packageStatus.automaticTestStatus)) {
                const build = await getTravisBuild(packageName, version);
                const buildStatus = build.branch.state;
                packageStatus.automaticTestStatus = buildStatus;
                const savedStatus = await packageStatus.save();
                if (format === 'json') {
                    res.json(savedStatus);
                } else {
                    const grade = getGrade(savedStatus);
                    res.sendFile(path.join(__dirname, 'res', `badge${grade}.svg`));
                }
            } else {
                if (format === 'json') {
                    res.json(packageStatus);
                } else {
                    const grade = getGrade(packageStatus);
                    res.sendFile(path.join(__dirname, '../../', 'res', `badge${grade}.svg`));
                }
            }
        } else {
            const status = new StatusReport();
            status.packageName = packageName;
            status.version = version;
            status.automaticTestStatus = 'created';
            await startPackageTest(packageName, version);
            const savedStatus = await status.save();
            if (format === 'json') {
                res.json(savedStatus);
            } else {
                const grade = getGrade(savedStatus);
                res.sendFile(path.join(__dirname, 'res', `badge${grade}.svg`));
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
function getGrade(status: StatusReport): 'A' | 'B' | 'C' | 'D' | 'F' | '?' {
    if (status.override) {
        return status.override;
    } else {
        return gradeXState[status.automaticTestStatus] as any || '?';
    }
}


export {
    router as statusRouter
}