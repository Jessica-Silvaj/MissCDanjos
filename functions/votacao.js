const { connectDB, disconnectDB } = require('../bd/conexao');

exports.handler = async (event) => {
    // Verificar se o método HTTP é POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método não permitido' })
        };
    }

    let db = null;
    try {
        const { candidate } = JSON.parse(event.body);
        console.log(candidate);

        // Verificar se o candidato foi fornecido
        if (!candidate) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Candidato não selecionado!' })
            };
        }

        // Obter o IP do voto, considerando o X-Forwarded-For ou usando o IP local
        const ip = event.headers['x-nf-client-connection-ip'] || '127.0.0.1';  // Usando o cabeçalho ou IP local

        console.log(ip);

        // Verificar se o IP foi fornecido e se é válido
        const isValidIP = (ip) => {
            const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            return ipRegex.test(ip) || ip === '::1' || ip === '127.0.0.1'; // Aceitar IPv6 (::1) e IPv4 (127.0.0.1)
        };

        // Verificar se o IP é válido
        if (!ip || ip.trim() === '' || !isValidIP(ip)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Não foi possível determinar seu IP!' })
            };
        }

        // Conectar ao banco de dados
        db = await connectDB();
        await db.query('BEGIN');
        
        // Verificar se o candidato existe
        const candidateCheck = await db.query('SELECT * FROM candidato WHERE id = $1', [candidate]);
        if (candidateCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Candidata inválida!' })
            };
        }

        // Verificar se o IP já votou
        const checkVote = await db.query('SELECT * FROM votos WHERE ip = $1', [ip]);
        if (checkVote.rows.length > 0) {
            await db.query('ROLLBACK');
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Você já votou!' })
            };
        }

        // Registrar o voto no banco de dados
        await db.query('INSERT INTO votos (candidato_id, ip) VALUES ($1, $2)', [candidate, ip]);
        await db.query('COMMIT');

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Voto registrado com sucesso!' })
        };
    } catch (error) {
        // Se ocorrer erro, reverter a transação e retornar erro 500
        if (db) await db.query('ROLLBACK');
        console.error(error); // Logar o erro para debugging
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao processar o voto!' })
        };
    } finally {
        // Desconectar do banco de dados
        if (db) await disconnectDB(db);
    }
};
