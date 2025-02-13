import express from 'express';
import { NodeSSH } from 'node-ssh';

import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';
import http from 'http';
import https from 'https';
import cors from 'cors';

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
            res.json(user);
            
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


app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    new URL(targetUrl); // Verifica se a URL é válida
  } catch (err) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  if (req.headers.range) {
    headers["Range"] = req.headers.range;
  }

  const axiosInstance = axios.create({
    maxRedirects: 10, // Ajuste conforme necessário
    headers: headers,
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
  });

  const fetchContent = async (url, retryCount = 3) => {
    try {
      console.log(`Fetching URL: ${url}`);
      const response = await axiosInstance.get(url, {
        responseType: "stream",
        validateStatus: (status) => status < 400,
      });

      // Ensure the correct headers are passed to the client
      if (!res.headersSent) {
        const responseHeaders = {
          ...response.headers,
          "Accept-Ranges": "bytes", // Enable range requests
          "Content-Type": response.headers["content-type"] || "video/mp4", // Ensure content-type is set
        };
        res.writeHead(response.status, responseHeaders);
      }

      response.data.pipe(res);

      response.data.on("data", (chunk) => {
       // console.log(`Streaming chunk of size: ${chunk.length}`);
      });

      response.data.on("end", () => {
        console.log("Stream ended");
        res.end(); // Force end the response
      });

      response.data.on("error", (err) => {
        console.error("Stream error:", err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming content" });
        }
      });
    } catch (error) {
      console.error("Error fetching content:", error.message);
      if (error.response && error.response.status === 404) {
        res.status(404).json({ error: "Content not found" });
      } else if (retryCount > 0) {
        console.log(`Retrying... (${3 - retryCount + 1}/3)`);
        await fetchContent(url, retryCount - 1);
      } else {
        if (!res.headersSent) {
          res.status(500).json({ error: "Error fetching content" });
        }
      }
    }
  };

  await fetchContent(targetUrl);
});
// Exemplo de uso






app.use("/download", (req, res, next) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send("A URL de destino não foi fornecida.");
  }

  req.proxyUrl = targetUrl;
  next();
});

// Configuração do Proxy
app.use(
  "/download",
  createProxyMiddleware({
    changeOrigin: true,
    followRedirects: true, // Garante que os redirecionamentos sejam seguidos
    pathRewrite: (path, req) => {
      // Reescreve o caminho removendo o "/download"
      const newPath = req.proxyUrl.replace(/^\/download/, "");
      return newPath;
    },
    router: (req) => {
      // Define a URL de destino dinamicamente
      return req.proxyUrl;
    },
    onError(err, req, res) {
      // Log de erro (caso haja algum problema no proxy)
      console.error(`Erro no proxy para a URL ${req.proxyUrl}: ${err.message}`);
      res.status(500).send('Erro ao acessar a URL de destino.');
    },
    headers: {
      // Cabeçalhos customizados para evitar bloqueios
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br',
    },
    maxRedirects: 5, // Limita o número de redirecionamentos para evitar loops infinitos
  })
);

// Iniciar o servidor na porta 3000








// Inicia o servidor e a conexão SSH
app.listen(PORT, async () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
