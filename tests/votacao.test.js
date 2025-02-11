const request = require('supertest');
const express = require('express');
const votacaoHandler = require('../functions/votacao');
const { connectDB, disconnectDB } = require('../bd/conexao'); // Conexão com o banco

const app = express();
app.use(express.json());
app.post('/votacao', votacaoHandler.handler);

let client;

beforeAll(async () => {
    // Conectar ao banco de dados antes de rodar os testes
    client = await connectDB();
});

afterAll(async () => {
    // Desconectar do banco de dados após os testes
    await disconnectDB(client);
});

describe('Testando API de Votação', () => {
    test('Deve registrar um voto válido', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '192.168.1.100');  // Passando o cabeçalho correto
    
        console.log(response.body);  // Adicione para depurar a resposta
    
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Voto registrado com sucesso!');
    });
});
