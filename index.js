import express, { query } from 'express';
const app = express()
const PORT = 8000
const { Client } = require('ssh2');



app.get('/',async (req, res) => {
res.send("show");
})
app.get('/about', (req, res) => {
  res.send('About route 🎉 ')
})
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
})
