const { connectDB } = require('../bd/conexao');

exports.handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    try {
        const { candidate } = req.body;
        if (!candidate) {
            return res.status(400).json({ message: "Candidato não selecionado!" });
        }

        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const db = await connectDB();

        await db.query('BEGIN');

        // Verifica se o IP já votou
        const checkVote = await db.query('SELECT * FROM votos WHERE ip = $1', [ip]);
        if (checkVote.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: "Você já votou!" });
        }

        // Registra o voto
        const result = await db.query(
            'INSERT INTO votos (candidato_id, ip) VALUES ($1, $2) RETURNING *',
            [candidate, ip]
        );

        await db.query('COMMIT');

        res.status(200).json({ message: "Voto registrado com sucesso!", vote: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao processar o voto!" });
    }
};
