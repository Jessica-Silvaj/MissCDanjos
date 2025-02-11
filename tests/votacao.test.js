const request = require('supertest');
const express = require('express');
const votacaoHandler = require('../functions/votacao');
const { connectDB, disconnectDB } = require('../bd/conexao'); // Supondo que você tenha essas funções em 'conexao.js'

const app = express();
app.use(express.json());
app.post('/votacao', votacaoHandler.handler);

let client; // Para armazenar a conexão

beforeAll(async () => {
    // Antes de rodar os testes, conecta ao banco de dados
    client = await connectDB();
});

afterAll(async () => {
    // Após os testes, encerra a conexão com o banco de dados
    await disconnectDB(client);
});

describe('Testando API de Votação', () => {
    test('Deve registrar um voto válido', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '192.168.1.100'); // IP fictício

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Voto registrado com sucesso!');
    });

    test('Não deve permitir voto duplicado do mesmo IP', async () => {
        // Primeiro voto
        await request(app)
            .post('/votacao')
            .send({ candidate: 1 }) 
            .set('X-Forwarded-For', '192.168.1.100'); 
        
        // Tentativa de votar novamente com o mesmo IP
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 }) 
            .set('X-Forwarded-For', '192.168.1.100'); 

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Você já votou!');
    });

    test('Deve retornar erro ao votar sem candidato', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({})
            .set('X-Forwarded-For', '192.168.1.101');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Candidato não selecionado!');
    });

    test('Deve retornar erro quando não for possível determinar o IP', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '');  // IP não fornecido

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Não foi possível determinar seu IP!');
    });

    test('Deve retornar erro se o método HTTP não for POST', async () => {
        const response = await request(app)
            .get('/votacao'); // Usando método GET, que não é permitido

        expect(response.status).toBe(405);
        expect(response.body.message).toBe('Método não permitido');
    });

    test('Deve registrar voto com IP local (127.0.0.1)', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '::1');  // IP local

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Voto registrado com sucesso!');
    });

    test('Deve retornar erro se candidato não for fornecido e IP não for setado', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({})
            .set('X-Forwarded-For', ''); // Nenhum candidato e IP não setado

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Candidato não selecionado!');
    });

    // Teste 1: Verificar erro ao votar em um candidato inexistente
    test('Não deve permitir votar em um candidato inexistente', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 9999 })  // ID de candidato inexistente
            .set('X-Forwarded-For', '192.168.1.102');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Candidata inválida!');
    });

    // Teste 2: Verificar erro de conexão com o banco de dados
    test('Deve retornar erro ao tentar votar se o banco de dados estiver inacessível', async () => {
        // Simule uma falha de conexão com o banco de dados, talvez com um banco de dados fora do ar
        // Você pode desconectar temporariamente a sua base para testar esse cenário.
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '192.168.1.100');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Erro ao processar o voto!');
    });

    // Teste 3: Verificar se o voto está sendo registrado corretamente no banco de dados
    test('Deve registrar o voto no banco de dados', async () => {
        const candidateId = 1;

        // Realize o voto
        await request(app)
            .post('/votacao')
            .send({ candidate: candidateId })
            .set('X-Forwarded-For', '192.168.1.101');

        // Verifique se o voto foi registrado na tabela de votos
        const response = await request(app)
            .get('/votacao')  // Aqui você precisaria ter um endpoint para verificar votos, ou então consultar diretamente no banco
            .send();

        expect(response.status).toBe(200);
        expect(response.body.votes).toContainEqual(expect.objectContaining({ candidato_id: candidateId }));
    });

    // Teste 4: Verificar se o IP é tratado corretamente quando X-Forwarded-For não está presente
    test('Deve usar o IP do socket se X-Forwarded-For não estiver presente', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '');  // Cabeçalho ausente

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Voto registrado com sucesso!');
    });

    // Teste 5: Verificar se o método POST está sendo aceito
    test('Não deve permitir método GET no endpoint /votacao', async () => {
        const response = await request(app)
            .get('/votacao');  // Método GET não permitido

        expect(response.status).toBe(405);
        expect(response.body.message).toBe('Método não permitido');
    });

    // Teste 6: Verificar caso onde o candidato não existe e o IP não é válido
    test('Deve retornar erro se o candidato não existir e o IP não for válido', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 9999 })  // ID do candidato inexistente
            .set('X-Forwarded-For', '');  // IP inválido

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Candidata inválida!');
    });

    // Teste 7: Testar múltiplos votos com IPs diferentes
    test('Deve permitir votos de diferentes IPs', async () => {
        const response1 = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '192.168.1.100');
        
        const response2 = await request(app)
            .post('/votacao')
            .send({ candidate: 1 })
            .set('X-Forwarded-For', '192.168.1.101');

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
    });

    // Teste 8: Testar votos simultâneos
    test('Deve registrar votos simultâneos corretamente', async () => {
        const votes = [
            request(app).post('/votacao').send({ candidate: 1 }).set('X-Forwarded-For', '192.168.1.102'),
            request(app).post('/votacao').send({ candidate: 2 }).set('X-Forwarded-For', '192.168.1.103'),
            request(app).post('/votacao').send({ candidate: 1 }).set('X-Forwarded-For', '192.168.1.104'),
            request(app).post('/votacao').send({ candidate: 3 }).set('X-Forwarded-For', '192.168.1.105')
        ];

        const responses = await Promise.all(votes);

        // Verificar se todos os votos foram registrados com sucesso
        responses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Voto registrado com sucesso!');
        });
    });
});
