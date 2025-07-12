const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Connexion à la base de données SQLite
const db = new sqlite3.Database('./stm32.db', (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
    }
});

// Créer la table microcontrollers si elle n'existe pas
db.run(`
    CREATE TABLE IF NOT EXISTS microcontrollers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        frequency TEXT NOT NULL,
        memory TEXT NOT NULL,
        image TEXT
    )
`);

// Middleware pour parser les données du formulaire et servir les fichiers statiques
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurer EJS comme moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Page d'accueil
app.get('/', (req, res) => {
    res.render('index');
});

// Page du formulaire
app.get('/form', (req, res) => {
    res.render('form');
});

// Traitement du formulaire
app.post('/submit', (req, res) => {
    const { model, frequency, memory, image } = req.body;
    const stmt = db.prepare('INSERT INTO microcontrollers (model, frequency, memory, image) VALUES (?, ?, ?, ?)');
    stmt.run(model, frequency, memory, image || null, (err) => {
        if (err) {
            console.error('Erreur lors de l\'insertion :', err.message);
        }
        stmt.finalize();
        res.redirect('/list');
    });
});

// Page de liste des microcontrôleurs
app.get('/list', (req, res) => {
    db.all('SELECT * FROM microcontrollers', [], (err, microcontrollers) => {
        if (err) {
            console.error('Erreur lors de la récupération des données :', err.message);
        }
        res.render('list', { microcontrollers });
    });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});

// Fermer la base de données proprement à l'arrêt du serveur
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erreur lors de la fermeture de la base de données :', err.message);
        }
        console.log('Base de données fermée.');
        process.exit(0);
    });
});