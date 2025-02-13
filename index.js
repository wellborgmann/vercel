import express, { query } from 'express';
const app = express()
const PORT = 8000


ssh.connect({
  host: '157.254.54.234',
  username: 'root',
  password: "7093dado7093"
})

const {NodeSSH} = require('node-ssh')

const ssh = new NodeSSH()

  async function executeSSHCommand(command) {
       let comando = `chage -l apollo404 | grep -E 'Account expires' | cut -d ' ' -f3-`;

        await ssh.execCommand(comando, { cwd:'/var/www' }).then(function(result) {
            try{  
                console.log('STDOUT: ' + result.stdout);
                  return result.stdout;
            }catch(error){
               console.log('STDERR: ' + result.stderr);
            }
          
  
 
  })
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
