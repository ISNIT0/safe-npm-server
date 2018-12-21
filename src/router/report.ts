import { Router } from 'express';
import * as moment from 'moment';
import * as asyncHandler from 'express-async-handler';
import Repository = require('github-api/dist/components/Repository');
import { config } from 'src/config';
import { PackageVersion } from 'src/models/packageVersion.model';
import { Report } from 'src/models/report.model';
import { AdvancedConsoleLogger } from 'typeorm';

const router = Router();

const repo = new Repository('ISNIT0/safe-npm-packages', {
    token: config.github.token
});

router.get('/:packageName/:version',
    asyncHandler(async (req, res) => {
        const { packageName, version } = req.params;

        const pv = await PackageVersion.findOne({ packageName, version });
        const reports = await Report.find({ packageVersion: pv });
        res.json({
            packageName,
            version,
            reports
        });
    })
);

router.get('/update/:webhooktoken/:packageName/:version',
    asyncHandler(async (req, res) => {
        const { packageName, version, webhooktoken } = req.params;

        if (config.webhook.token !== webhooktoken) {
            throw new Error(`Provided webhooktoken was invalid: [${webhooktoken}]`);
        }

        const pv = await PackageVersion.findOne({ packageName, version });
        if (!pv) throw new Error(`Couldn't find package [${packageName}@${version}]`);

        const { data: reports } = await repo.getContents('master', `${packageName}/${version}/`);
        if (!reports) throw new Error(`Couldn't find directory [${packageName}/${version}/] in ISNIT0/safe-npm-packages`);

        for (let reportInfo of reports) {
            const { data: cont } = await repo.getContents('master', reportInfo.path);
            if (!cont) throw new Error(`Couldn't find file [${reportInfo.path}] in ISNIT0/safe-npm-packages`);
            const reportMd = Buffer.from(cont.content, 'base64').toString();
            if (!reportMd) throw new Error(`Couldn't find file [${reportInfo.path}] in ISNIT0/safe-npm-packages`);
            const dateString = reportInfo.path.split('/').slice(-1)[0].split('.')[0];
            const reportDate = moment.utc(dateString, 'DD-MM-YYYY__HH_mm').toDate();

            const {
                grade,
                reportBy,
            } = parseReportMd(reportMd);

            let report = await Report.findOne({
                date: reportDate
            });

            if (!report) {
                report = new Report();
                report.packageVersion = pv;
                report.date = reportDate;
            }

            report.grade = grade;
            report.by = reportBy;
            report.comments = reportMd;

            report = await report.save();
        }

        res.json({ error: false });
    })
);

export {
    router as reportRouter
}

function parseReportMd(md: string) {
    const lines = md.split('\n');
    const gradeLine = lines.find(l => l.includes('| Grade |'));
    const reportByLine = lines.find(l => l.includes('| Report By |'));

    const [, , grade] = gradeLine.split('|');
    const [, , reportBy] = reportByLine.split('|');

    return {
        grade: grade.trim() as 'A' | 'B' | 'C' | 'D' | 'F' | 'U',
        reportBy: reportBy.trim()
    };
}