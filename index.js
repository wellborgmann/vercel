import express from 'express';
import { NodeSSH } from 'node-ssh';



const app = express();
const PORT = 8000;

const ssh = new NodeSSH();

// Função assíncrona para conectar ao SSH antes de executar comandos
async function connectSSH() {
    try {
        await ssh.connect({
     host: process.env.IP_SSH,
    port: 22,
    username: process.env.USER_SSH,
    password: process.env.PASS_SSH,
    readyTimeout: 30000,
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
        const login = req.query?.user;
        if (!login) {
            ssh.dispose(); // Fecha a conexão se não for utilizada
            return res.send('Usuário não encontrado.');
        }
        const { data, exists } = await checkLoginExists(login);
        
        // Fecha a conexão após executar os comandos
        ssh.dispose();

        if (exists) {
              const validade = formatDate(data);
            const dias = diferencaEmDias(data);
            
            const user = {
                validade: validade,
                dias: dias}
            res.json.send(user);
            
        } else {
            res.send('Usuário não encontrado.');
        }
    } catch (error) {
        console.error("Erro na rota /:", error);
        res.status(500).send("Erro interno do servidor.");
    }
});

function formatDate(inputDate) {
  // Cria um objeto Date a partir da string
  const date = new Date(inputDate);

  // Obtemos o dia, o mês e o ano
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Lembre-se que os meses começam de 0
  const year = date.getFullYear();

  // Retorna a data no formato dd/mm/yyyy
  return `${day}/${month}/${year}`;
}

function diferencaEmDias(dataISO) {
    const dataTimestamp = new Date(dataISO);
    const dataAtual = new Date();
    const diferencaMilissegundos = dataTimestamp.getTime() - dataAtual.getTime();
    return Math.round(diferencaMilissegundos / (1000 * 60 * 60 * 24));
}

// Exemplo de uso








// Inicia o servidor e a conexão SSH
app.listen(PORT, async () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
