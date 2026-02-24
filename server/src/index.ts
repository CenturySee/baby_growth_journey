import express from 'express';
import cors from 'cors';
import router from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // large limit for image base64

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`🚀 Baby Growth API running on port ${PORT}`);
});
