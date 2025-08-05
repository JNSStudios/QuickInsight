
import express from 'express'
import trafficSourcesRouter from './routes/trafficSources.js';
import topItemRouter from './routes/topItem.js';
import revenueAndPurchasesRouter from './routes/revenueAndPurchases.js';
import refundRateRouter from './routes/refundRate.js';
import changesOverTimeRouter from './routes/changesOverTime.js';
import visitorsRouter from './routes/visitors.js';
import summaryRouter from './routes/summary.js';
import businessInfoRouter from './routes/businessInfo.js';

import cors from 'cors';

const app = express()
const port = process.env.PORT || 8080

// Mount API routes
app.use(cors());

app.use('/api/traffic-sources', trafficSourcesRouter);               
app.use('/api/top-item', topItemRouter);                            
app.use('/api/revenue-and-purchases', revenueAndPurchasesRouter);  
app.use('/api/refund-rate', refundRateRouter);                      
app.use('/api/changes-over-time', changesOverTimeRouter);           

app.use('/api/visitors', visitorsRouter);                           
app.use('/api/summary', summaryRouter);                             
app.use('/api/business-info', businessInfoRouter);                             

// localhost:3000/
// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// AWS Elastic Beanstalk health check endpoint
app.get('/health', (req, res) => res.sendStatus(200));
app.get('/', (req, res) => res.send('OK'))

