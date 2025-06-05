# Digitales Schwarzes Brett - Vollständige Implementierung

## Projektstruktur

```
digital-board/
├── server.js                    # Backend-Server
├── database.db                  # SQLite-Datenbank
├── package.json                 # Backend-Dependencies
├── init-database.js            # Datenbank-Initialisierung
├── public/
│   └── uploads/                 # Upload-Verzeichnis für Bilder
├── client/                      # React-Frontend
│   ├── package.json            # Frontend-Dependencies
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── components/
│       │   ├── Layout.js
│       │   ├── Navigation.js
│       │   ├── PostCard.js
│       │   ├── DragDropWorkplan.js
│       │   └── OrganizationChart.js
│       └── pages/
│           ├── Login.js
│           ├── AdminDashboard.js
│           ├── KioskView.js
│           ├── PostsManagement.js
│           ├── TradeShowCalendar.js
│           ├── WorkPlan.js
│           ├── BirthdayList.js
│           ├── PhoneList.js
│           └── Organigramm.js
└── README.md
```

## Installation und Start

1. **Backend Setup:**
```bash
npm install
node init-database.js  # Initialisiert die Datenbank
npm start
```

2. **Frontend Setup:**
```bash
cd client
npm install
npm start
```

3. **Standard Admin-Login:**
   - Benutzername: `admin`
   - Passwort: `admin123` 