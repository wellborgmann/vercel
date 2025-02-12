import express, { query } from 'express';
const app = express()
const PORT = 8000




app.get('/',async (req, res) => {
res.send("ola mano");
})
app.get('/about', (req, res) => {
  res.send('About route 🎉 ')
})
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
})
