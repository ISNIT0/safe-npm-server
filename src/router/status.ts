import { Router } from 'express';
import { StatusReport } from 'src/models/statusReport.model';
import * as asyncHandler from 'express-async-handler';

const router = Router();

// TODO: JSON and PNG api
router.get('/:packageName/:version.:format(png|json)',
    asyncHandler(async (req, res) => {
        console.log(req.params);
        const { packageName, version, format } = req.params as any;
        const packageStatus = await StatusReport.findOne({ packageName, version });
        if (packageStatus) {
            if (format === 'json') {
                res.json(packageStatus);
            } else {
                res.send({ comingSoon: true });
            }
        } else {
            const status = new StatusReport();
            status.packageName = packageName;
            status.version = version;
            status.automaticTestStatus = 'queued';
            // TODO push to queue
            const savedStatus = await status.save();
            if (format === 'json') {
                res.json(savedStatus);
            } else {
                res.send({ comingSoon: true });
            }
        }
    })
);


export {
    router as statusRouter
}