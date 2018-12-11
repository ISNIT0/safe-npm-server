import * as Consumer from 'sqs-consumer'
import * as AWS from "aws-sdk"
import { config } from "src/config"
import { checkPackages } from 'src/checkPackages';
import { StatusReport } from 'src/models/statusReport.model';

interface Task {
    type: 'CHECK_PACKAGE';
    packageName: string;
    version: string;
}

const app = Consumer.create({
    queueUrl: config.aws.queueUrl,
    handleMessage: async (message, done) => {
        const { Body } = message
        let error;
        try {
            const parsedBody = JSON.parse(Body) as Task;
            console.log(`Processing task [type=${parsedBody.type}]`);
            await processTask(parsedBody);
        } catch (err) {
            console.error(`Failed to process message:`, err);
            error = err;
        } finally {
            done(error);
        }
    },
    sqs: new AWS.SQS()
})

app.on('error', (err) => {
    console.log(err.message)
})

app.start()
console.info(`Started Consuming`)


async function processTask(task: Task) {
    if (task.type === 'CHECK_PACKAGE') {
        const { packageName, version } = task;
        // TODO: Run on Travis for free somehow
        try {
            await checkPackages([{ packageName: packageName, versions: [version] }]);
        } catch (err) {
            const status = await StatusReport.findOne({ packageName, version });
            status.automaticTestStatus = 'failed';
            status.automaticTestCompletedAt = new Date();
            await status.save();
            console.error(`Failed to verify package [${packageName}@${version}]`, err);
            return;
        }

        const status = await StatusReport.findOne({ packageName, version });
        status.automaticTestStatus = 'completed';
        status.automaticTestCompletedAt = new Date();
        await status.save();
    }
}