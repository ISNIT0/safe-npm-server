import { Router } from 'express';
import * as asyncHandler from 'express-async-handler';
import Repository = require('github-api/dist/components/Repository');
import { config } from 'src/config';
import { PackageVersion } from 'src/models/packageVersion.model';
import { Review } from 'src/models/review.model';

const router = Router();

const repo = new Repository('ISNIT0/safe-npm-packages', {
    token: config.github.token
});

router.get('/update/:packageName/:version',
    asyncHandler(async (req, res) => {
        const { packageName, version } = req.params;
        const pv = await PackageVersion.findOne({ packageName, version });
        if (!pv) throw new Error(`Couldn't find package [${packageName}@${version}]`);

        const cont = await repo.getContents('master', `reviews/${packageName}/${version}.json`);
        if (!cont) throw new Error(`Couldn't find file [reviews/${packageName}/${version}.json] in ISNIT0/safe-npm-packages`);
        const review = JSON.parse(cont);

        let pvReview = await Review.findOne({ packageVersion: pv });
        if(!pvReview) {
            pvReview = new Review();
            pvReview.packageVersion = pv;
        }
        pvReview.grade = review.grade;
        pvReview.comments = review.comments;
        pvReview.updatedAt = new Date();
        await pvReview.save();
    })
);

export {
    router as reviewRouter
}