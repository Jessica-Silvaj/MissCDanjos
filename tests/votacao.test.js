const request = require('supertest');
const express = require('express');
const votacaoHandler = require('../functions/votacao');

const app = express();
app.use(express.json());
app.post('/votacao', votacaoHandler.handler);

describe('Testando API de Votação', () => {
    test('Deve registrar um voto válido', async () => {
        const response = await request(app)
            .post('/votacao')
            .send({ candidate: 1 }) 
            .set('X-Forwarded-For', '192.168.1.100'); 

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Voto registrado com sucesso!');
    });

    test('Não deve permitir voto duplicado do mesmo IP', async () => {
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
});
