const { Router } = require('express');
const { statusRouter } = require('./status');
const { reportRouter } = require('./report');

const router = Router();

router.use('/status', statusRouter);
router.use('/report', reportRouter);

export { router }