import express from 'express'
import trafficSourcesRouter from './routes/trafficSources.js';
import topItemRouter from './routes/topItem.js';
import revenueAndPurchasesRouter from './routes/revenueAndPurchases.js';
import refundRateRouter from './routes/refundRate.js';
import changesOverTimeRouter from './routes/changesOverTime.js';
import visitorsRouter from './routes/visitors.js';

const app = express()
const port = 3000

// Mount API routes
app.use('/api/traffic-sources', trafficSourcesRouter);
app.use('/api/top-item', topItemRouter);
app.use('/api/revenue-and-purchases', revenueAndPurchasesRouter);
app.use('/api/refund-rate', refundRateRouter);
app.use('/api/changes-over-time', changesOverTimeRouter);
app.use('/api/visitors', visitorsRouter);


// localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

