const { Pool  } = require('pg');

const pool = new Pool({
    user: "0194f5e5-f478-7dbb-af7f-eeaa682c3e2e",
    password: "2881563b-1205-4567-917a-0307d4dceaf9",
    host: "us-west-2.db.thenile.dev",
    port: 5432,
    database: "MissCDanjos",
});


let client;

const connectDB = async () => {
    try {
        client = await pool.connect(); // Pega uma conexão do pool
        console.log('Conexão ao banco de dados MissCDanjos estabelecida com sucesso!');
        return client;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
};

const disconnectDB = async () => {
    try {
        await pool.end(); // Encerra todas as conexões do pool
        console.log('Todas as conexões foram encerradas.');
    } catch (error) {
        console.error('Erro ao encerrar as conexões com o banco de dados:', error);
    }
};

module.exports = {
    connectDB,
    disconnectDB,
};