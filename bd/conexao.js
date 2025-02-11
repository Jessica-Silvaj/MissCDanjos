const { Pool } = require('pg');

const pool = new Pool({
    user: "0194f609-d13c-7d74-a304-af1d65b8d2f9",
    password: "07e60762-915a-4e3d-a046-da792d956a12",
    host: "us-west-2.db.thenile.dev",
    port: 5432,
    database: "MissCDanjos",
});

const connectDB = async () => {
    try {
        const client = await pool.connect(); // Pega uma conexão do pool
        console.log('Conexão ao banco de dados MissCDanjos estabelecida com sucesso!');
        return client;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
};

const disconnectDB = async (client) => {
    try {
        if (client) {
            client.release();  // Libera a conexão ao invés de encerrar todas
            console.log('Conexão liberada com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao liberar a conexão com o banco de dados:', error);
    }
};

module.exports = {
    connectDB,
    disconnectDB,
};
