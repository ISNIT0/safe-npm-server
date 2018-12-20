import { Router } from 'express';
import * as asyncHandler from 'express-async-handler';
import Repository = require('github-api/dist/components/Repository');
import { config } from 'src/config';
import { PackageVersion } from 'src/models/packageVersion.model';
import { Report } from 'src/models/report.model';

const router = Router();

const repo = new Repository('ISNIT0/safe-npm-packages', {
    token: config.github.token
});

router.get('/update/:webhooktoken/:packageName/:version',
    asyncHandler(async (req, res) => {
        const { packageName, version, webhooktoken } = req.params;

        if (config.webhook.token !== webhooktoken) {
            throw new Error(`Provided webhooktoken was invalid: [${webhooktoken}]`);
        }

        const pv = await PackageVersion.findOne({ packageName, version });
        if (!pv) throw new Error(`Couldn't find package [${packageName}@${version}]`);

        const { data: cont } = await repo.getContents('master', `reports/${packageName}/${version}.json`);
        if (!cont) throw new Error(`Couldn't find file [reports/${packageName}/${version}.json] in ISNIT0/safe-npm-packages`);

        const decodedContent = Buffer.from(cont.content, 'base64').toString();
        const report = JSON.parse(decodedContent);

        let pvReport = await Report.findOne({ packageVersion: pv });
        if (!pvReport) {
            pvReport = new Report();
            pvReport.packageVersion = pv;
        }
        pvReport.grade = report.grade;
        pvReport.comments = report.comments;
        pvReport.updatedAt = new Date();
        const savedPvReport = await pvReport.save();

        res.json(savedPvReport);
    })
);

export {
    router as reportRouter
}