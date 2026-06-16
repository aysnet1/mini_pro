
USE logement_etudiant4;

-- Créer la table etablissement si elle n'existe pas
CREATE TABLE IF NOT EXISTS etablissement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etablissement_code INT NOT NULL UNIQUE,
    university_code INT NOT NULL,
    label_ar VARCHAR(255) NOT NULL,
    label_fr VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    gouvernorat VARCHAR(100) NOT NULL,
    type ENUM('Public', 'Privé') NOT NULL,
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_etablissement_code (etablissement_code),
    INDEX idx_university_code (university_code),
    INDEX idx_gouvernorat (gouvernorat),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
