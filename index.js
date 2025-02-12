import express, { query } from 'express';
const app = express()
const PORT = 8000
import { Client } from "ssh2";

const connSettings = {
    host: "157.254.54.234",
    port: 22,
    username: "root",
    password: "7093dado7093",
    readyTimeout: 30000,
  };


  async function checkLoginExists(loginName) {
    let comando = `chage -l ${loginName} | grep -E 'Account expires' | cut -d ' ' -f3-`;

    try {
        const dataReceived = await executeSSHCommand(comando);
        return {
            exists: !!dataReceived, // Se houver dados, o usuário existe
            data: dataReceived || null
        };
    } catch (error) {
        console.error("Erro ao verificar login:", error);
        return { exists: false };
    }
}

app.get('/',async (req, res) => {
  const login = req.query.login;
    const {data} = await checkLoginExists(login);
    res.send(data);
})
app.get('/about', (req, res) => {
  res.send('About route 🎉 ')
})
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
})
