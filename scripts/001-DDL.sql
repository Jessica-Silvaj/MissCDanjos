CREATE TABLE candidato (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

INSERT INTO candidato (id, name) VALUES (1 , 'Sofi Coseneto');
INSERT INTO candidato (id, name) VALUES (2 , 'Mônica Hills');
INSERT INTO candidato (id, name) VALUES (3 , 'Kate Higanbana');
INSERT INTO candidato (id, name) VALUES (4 , 'Britney Spears');
INSERT INTO candidato (id, name) VALUES (5 , 'Astrid Hansen');
INSERT INTO candidato (id, name) VALUES (6 , 'Cacau Becker');
INSERT INTO candidato (id, name) VALUES (7 , 'Malvina Maurer');
INSERT INTO candidato (id, name) VALUES (8 , 'Kalyne Miller');
INSERT INTO candidato (id, name) VALUES (9 , 'Ayumi Murakami');
INSERT INTO candidato (id, name) VALUES (10 , 'Sara Dexter');
INSERT INTO candidato (id, name) VALUES (11 , 'Elisa Davis');

CREATE TABLE votos (
    id SERIAL PRIMARY KEY,
    candidato_id INT REFERENCES candidato(id) ON DELETE CASCADE,
    ip VARCHAR(255) UNIQUE NOT NULL,
    data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
