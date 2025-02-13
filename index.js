import express, { query } from 'express';
const app = express()
const PORT = 8000


const { Client } = require('ssh2');

const connSettings = {
    host: 157.254.54.234,
    port: 22,
    username: "root",
    password: "7093dado7093",
    readyTimeout: 30000,
  };

  async function executeSSHCommand(command) {
      return retry(async (bail) => {
          return new Promise((resolve, reject) => {
              const conn = new Client();
              let dataReceived = "";
  
              conn.on("error", (err) => {
                  console.error("Erro na conexão SSH:", err);
                  conn.end();
                  bail(err); 
              });
  
              conn.on("ready", () => {
                  conn.exec(command, (err, stream) => {
                      if (err) {
                          conn.end();
                          return reject(err);
                      }
                      stream
                          .on("close", () => {
                              conn.end();
                              resolve(dataReceived.trim());
                          })
                          .on("data", (data) => {
                              dataReceived += data.toString();
                          })
                          .stderr.on("data", (data) => {
                              console.error("STDERR:", data.toString());
                          });
                  });
              }).connect(connSettings);
          });
      }, {
          retries: 3,
          minTimeout: 2000,
      });
  }

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
 try {
   const {data, exists} = checkLoginExists("apollo404");
   res.send(data);
  } catch (error) {
   res.send("erro")
 }

})
app.get('/about', (req, res) => {
  res.send('About route 🎉 ')
})
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
})
