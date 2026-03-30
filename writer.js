const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/save-heft', (req, res) => {
    const { id, data } = req.body;
    const filePath = path.join(__dirname, 'data', `heft${id}.js`);
    
    // Erzeugt exakt das Format: hefte["1"] = { ... };
    const fileContent = `hefte["${id}"] = ${JSON.stringify(data, null, 2)};`;

    fs.writeFile(filePath, fileContent, 'utf8', (err) => {
        if (err) {
            console.error("Fehler beim Schreiben:", err);
            return res.status(500).send("Dateisystem-Fehler.");
        }
        console.log(`✅ Datei geschrieben: data/heft${id}.js`);
        res.send("Erfolgreich gespeichert.");
    });
});

app.listen(3000, () => console.log('🚀 SnailsStons Writer läuft auf http://localhost:3000'));
