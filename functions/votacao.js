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

        // Função para capturar o IP corretamente
        const getClientIP = (headers) => {
            return headers['x-forwarded-for']?.split(',')[0]?.trim() ||  // Primeiro IP da lista (pode ser múltiplo)
                   headers['x-real-ip'] ||                              // Alternativa comum em servidores proxy
                   headers['x-nf-client-connection-ip'] ||             // Netlify
                   headers['cf-connecting-ip'] ||                      // Cloudflare
                   headers['true-client-ip'] ||                        // Akamai
                   headers['fastly-client-ip'] ||                      // Fastly
                   headers['x-client-ip'] ||                           // Algumas configurações de proxy
                   headers['client-ip'] ||                             // Alternativa genérica
                   headers['forwarded']?.match(/for="\[?([^;\]]+)]?/i)?.[1] ||  // Forwarded header (raro)
                   headers['remote-addr'] ||                           // Fallback para conexões diretas
                   '127.0.0.1';                                        // Se nada for encontrado, assume localhost
        };
        
// Expressão regular para validar IPv4 e IPv6
const isValidIP = (ip) => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1' || ip === '127.0.0.1';
};

// Captura o IP do evento recebido no Netlify
const ip = getClientIP(event.headers);
console.log(`IP Capturado: ${ip}`);

// Verifica se o IP é válido
if (!ip || !isValidIP(ip)) {
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
