const { Router } = require('express');
const { statusRouter } = require('./status');

const router = Router();

router.use('/status', statusRouter);

export { router }