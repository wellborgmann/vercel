import express from 'express';
import { NodeSSH } from 'node-ssh';

const app = express();
const PORT = 8000;

const ssh = new NodeSSH();

// Função assíncrona para conectar ao SSH antes de executar comandos
async function connectSSH() {
    try {
        await ssh.connect({
            host: '157.254.54.234',
            port:22,
            username: 'root',
            password: '7093dado7093'
        });
        console.log('🔗 Conectado ao SSH com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao conectar ao SSH:', error);
        process.exit(1); // Encerra o programa se a conexão falhar
    }
}


// Função para executar comandos no SSH
async function executeSSHCommand(command) {
    try {
        const result = await ssh.execCommand(command, { cwd: '/' });
        return result.stdout.trim(); // Retorna a saída sem espaços extras
    } catch (error) {
        console.error('Erro ao executar comando SSH:', error);
        return null;
    }
}

// Função para verificar se o login existe
async function checkLoginExists(loginName) {
    const comando = `chage -l ${loginName} | grep -E 'Account expires' | cut -d ' ' -f3-`;
    const dataReceived = await executeSSHCommand(comando);

    return {
        exists: !!dataReceived, // Se houver dados, o usuário existe
        data: dataReceived || null
    };
}

// Rota principal
app.get('/', async (req, res) => {
    try {
        // Conecta ao SSH dentro da rota
        await connectSSH();
        
        const { data, exists } = await checkLoginExists("apollo404");
        
        // Fecha a conexão após executar os comandos
        ssh.dispose();

        if (exists) {
            res.send(`Usuário encontrado: ${data}`);
        } else {
            res.send('Usuário não encontrado.');
        }
    } catch (error) {
        console.error("Erro na rota /:", error);
        res.status(500).send("Erro interno do servidor.");
    }
});



// Rota adicional
app.get('/about', (req, res) => {
  
    res.send('About route 🎉');
});

// Inicia o servidor e a conexão SSH
app.listen(PORT, async () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
