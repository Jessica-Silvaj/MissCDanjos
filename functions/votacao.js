const { connectDB, disconnectDB } = require('../bd/conexao');

exports.handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    let db;
    try {
        const { candidate } = req.body;
        if (!candidate) {
            return res.status(400).json({ message: "Candidato não selecionado!" });
        }

        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ip = rawIp === '::1' || rawIp.startsWith('::ffff:') ? '127.0.0.1' : rawIp;

        if (!ip || ip === 'undefined') {
            return res.status(400).json({ message: "Não foi possível determinar seu IP!" });
        }

        console.log(ip);

        db = await connectDB(); // Conecta ao banco

        await db.query('BEGIN');

        // Verifica se o candidato existe
        const candidateCheck = await db.query('SELECT * FROM candidato WHERE id = $1', [candidate]);
        if (candidateCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: "Candidata inválida!" });
        }

        // Verifica se o IP já votou
        const checkVote = await db.query('SELECT * FROM votos WHERE ip = $1', [ip]);
        if (checkVote.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: "Você já votou!" });  // Retorna erro 400 se o IP já tiver votado
        }

        // Registra o voto
        const result = await db.query(
            'INSERT INTO votos (candidato_id, ip) VALUES ($1, $2) RETURNING *',
            [candidate, String(ip)]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: "Voto registrado com sucesso!", vote: result.rows[0] });

    } catch (error) {
        console.error(error);
        if (db) {
            await db.query('ROLLBACK');
        }
        return res.status(500).json({ message: "Erro ao processar o voto!" });
    } finally {
        if (db) {
            await disconnectDB(db); // Passa o client para liberar a conexão
        }
    }
};
