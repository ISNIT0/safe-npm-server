const { Router } = require('express');
const { statusRouter } = require('./status');
const { reviewRouter } = require('./review');

const router = Router();

router.use('/status', statusRouter);
router.use('/review', reviewRouter);

export { router }