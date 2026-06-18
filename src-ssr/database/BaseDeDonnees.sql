CREATE DATABASE IF NOT EXISTS logement_etudiant4;
USE logement_etudiant4;


-- -- user
CREATE TABLE user (
    id           INT          NOT NULL AUTO_INCREMENT,
    nom          VARCHAR(100) NOT NULL,
    prenom       VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    tel          VARCHAR(20),
    password     VARCHAR(255) NOT NULL,
    role         VARCHAR(50)  NOT NULL,
    photo_profil VARCHAR(255),
    PRIMARY KEY (id)
);

-- proprietaire
CREATE TABLE proprietaire (
    id      INT          NOT NULL,
    adress  VARCHAR(255),
    type    VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT fk_proprietaire_user
        FOREIGN KEY (id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- etudiant
CREATE TABLE etudiant (
    id               INT          NOT NULL,
    budget           FLOAT,
    habitudes        VARCHAR(255),
    universite       VARCHAR(150),
    recherche_ville  VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT fk_etudiant_user
        FOREIGN KEY (id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- admin
CREATE TABLE admin (
    id           INT   NOT NULL,
    permissions  JSON,
    PRIMARY KEY (id),
    CONSTRAINT fk_admin_user
        FOREIGN KEY (id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- Table : logement
CREATE TABLE logement (
    id              INT          NOT NULL AUTO_INCREMENT,
    proprietaire_id INT          NOT NULL,
    adress          VARCHAR(255),
    ville           VARCHAR(100) NOT NULL,
    latitude        FLOAT,
    longitude       FLOAT,
    type            VARCHAR(100),
    prix            FLOAT,
    nb_places       INT,
    equipemens      JSON,
    description     TEXT,
    statut          VARCHAR(50)  NOT NULL DEFAULT 'disponible',
    photos          JSON,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_logement_proprietaire
        FOREIGN KEY (proprietaire_id) REFERENCES proprietaire (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

--  etudiant_logement (Réservations / Locations)
CREATE TABLE etudiant_logement (
    etudiant_id       INT         NOT NULL,
    logement_id       INT         NOT NULL,
    date_debut        DATE        NOT NULL,
    date_fin          DATE        NOT NULL,
    duree             INT         NOT NULL,
    statut            VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    note_proprietaire VARCHAR(500) NULL,
    updated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (etudiant_id, logement_id),
    CONSTRAINT fk_el_etudiant
        FOREIGN KEY (etudiant_id) REFERENCES etudiant (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_el_logement
        FOREIGN KEY (logement_id) REFERENCES logement (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table : avis
CREATE TABLE avis (
    id          INT          NOT NULL AUTO_INCREMENT,
    logement_id INT          NOT NULL,
    auteur_id   INT          NOT NULL,
    note        INT,
    commentaire VARCHAR(500),
    status      VARCHAR(50),
    PRIMARY KEY (id),
    CONSTRAINT fk_avis_logement
        FOREIGN KEY (logement_id) REFERENCES logement (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_avis_auteur
        FOREIGN KEY (auteur_id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table : message
CREATE TABLE message (
    id              INT                            NOT NULL AUTO_INCREMENT,
    expediteur_id   INT                            NOT NULL,
    destinataire_id INT                            NOT NULL,
    role            ENUM('user', 'model', 'tools') NOT NULL DEFAULT 'user',
    contenu         TEXT                           NOT NULL,
    date            DATETIME                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_message_expediteur
        FOREIGN KEY (expediteur_id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_message_destinataire
        FOREIGN KEY (destinataire_id) REFERENCES user (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- Index sur la table logement
CREATE INDEX idx_logement_ville ON logement (ville);
CREATE INDEX idx_logement_type ON logement (type);
CREATE INDEX idx_logement_prix ON logement (prix);
CREATE INDEX idx_logement_coords ON logement (latitude, longitude);
CREATE INDEX idx_logement_owner ON logement (proprietaire_id);

-- Index sur la table message
CREATE INDEX idx_message_role ON message (role);

-- Index sur la table etudiant_logement
CREATE INDEX idx_el_logement_statut ON etudiant_logement (logement_id, statut);