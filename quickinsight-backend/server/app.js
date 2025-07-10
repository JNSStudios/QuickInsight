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
app.use('/api/traffic-sources', trafficSourcesRouter);              // passes 1m, 1m+r, 3m, and 3m+r. 
app.use('/api/top-item', topItemRouter);                            // passes 1m, 1m+r, 3m, and 3m+r.
app.use('/api/revenue-and-purchases', revenueAndPurchasesRouter);   // passes 1m, 1m+r, 3m, and 3m+r.
app.use('/api/refund-rate', refundRateRouter);                      // passes 1m, 1m+r, 3m, and 3m+r.
app.use('/api/changes-over-time', changesOverTimeRouter);           // passes 1m, 1m+r, 3m, and 3m+r.
app.use('/api/visitors', visitorsRouter);                           // passes 1m, 1m+r, 3m, and 3m+r


// localhost:3000/
// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

