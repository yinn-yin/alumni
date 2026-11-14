 
<!-- ====================================================== -->
<!--                 ALUMNI PROJECT README                  -->
<!-- ====================================================== -->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:050505,45:17172e,100:075985&height=230&section=header&text=ALUMNI&fontSize=75&fontColor=ffffff&fontAlignY=38&desc=GRADUATE%20TRACKING%20PLATFORM&descSize=17&descAlignY=60&animation=fadeIn" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=19&duration=3000&pause=1000&color=38BDF8&center=true&vCenter=true&repeat=true&width=650&lines=Connecting+Graduates+Beyond+Graduation;Track.+Analyze.+Discover.;A+Smarter+Way+to+Manage+Alumni." alt="Animated typing"/>

<br/>

**A modern alumni management and graduate tracking experience.**

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Not%20Specified-gray?style=for-the-badge)](#)

<br/>

</div>

---

## ◈ ABOUT THE PROJECT

**ALUMNI** is a graduate tracking dashboard designed to simplify how educational institutions organize, manage, and analyze their graduates.

It provides a centralized interface for maintaining graduate records, monitoring employment outcomes, exploring graduate destinations, and generating reports.

Built with a modern React frontend, ALUMNI focuses on usability, organized information, and a streamlined management experience.

<br/>

## ◈ CORE FEATURES

<table>
<tr>
<td width="50%">

### ◉ Graduate Management

Create, edit, and maintain graduate profiles with relevant academic and employment information.

</td>
<td width="50%">

### ◉ Smart Search

Quickly locate graduate records and filter information by graduation year or employment outcome.

</td>
</tr>
<tr>
<td width="50%">

### ◉ Graduate Analytics

Explore graduate outcomes, destinations, and program comparisons.

</td>
<td width="50%">

### ◉ CSV Export

Export graduate registers and graduation-year outcome summaries for reporting.

</td>
</tr>
<tr>
<td width="50%">

### ◉ Graduate Directory

Browse and maintain a searchable directory of graduate records.

</td>
<td width="50%">

### ◉ Responsive Interface

A React-powered interface designed for a streamlined management experience.

</td>
</tr>
</table>

---

## ◈ TECHNOLOGY STACK

<div align="center">

| Technology | Purpose |
|:---:|:---|
| ⚛️ React 19 | User interface |
| ⚡ Vite 8 | Development and build tooling |
| 🟨 JavaScript | Application logic |
| 🎞️ Motion | React animations |
| 🎨 Lucide React | Interface icons |
| 🐘 PHP + PDO | JSON API |
| 🐬 MySQL | Graduate record storage |
| 🔍 Oxlint | Code linting |

</div>

---

## ◈ PROJECT STRUCTURE

```text
alumni/
│
├── public/             # Static assets
│
├── src/                # Application source code
│
├── backend/            # PHP API and development router
├── database/           # MySQL schema
│
├── .agents/
│   └── skills/         # Project-specific agent skills
│
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── package-lock.json   # Dependency lock file
├── vite.config.js      # Vite configuration
├── .oxlintrc.json      # Oxlint configuration
│
└── README.md           # Project documentation
```

---

## ◈ GETTING STARTED

Follow these instructions to run ALUMNI locally.

### 01 — Clone the repository

```bash
git clone https://github.com/yinn-yin/alumni.git
```

### 02 — Navigate to the project

```bash
cd alumni
```

### 03 — Install dependencies

```bash
npm install
```

### 04 — Configure and start the PHP API

Install PHP 8.1+ with PDO MySQL enabled, plus MySQL 8+. Create the database and table:

```bash
mysql -u root -p < database/schema.sql
```

In PowerShell, set the connection settings and start the PHP development server from the project root:

```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_NAME = "alumni_tracker"
$env:DB_USER = "root"
$env:DB_PASSWORD = "your-local-password"
php -S 127.0.0.1:8000 -t . backend/router.php
```

### 05 — Start the frontend

In a second terminal:

```bash
npm run dev
```

Open the local URL provided by Vite. Its `/api` requests are proxied to the PHP server.

### 06 — Production build

```bash
npm run build
```

### 07 — Run linting

```bash
npm run lint
```

---

## ◈ DATA & STORAGE

Graduate records are stored in MySQL. The PHP API reads connection settings from `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`; `DB_HOST` and `DB_NAME` default to `127.0.0.1` and `alumni_tracker`.

On the first successful load against an empty database, the app imports existing browser records from `alumni-tracker-graduates`, or the starter records if none exist. The browser data is left intact. The API's import route only imports when the graduates table is empty.

**Security notice:** The PHP API currently has no authentication or authorization and is for local development/demo use only. Do not expose it publicly or use it with real sensitive graduate data until access control and deployment security are added.

---

## ◈ PROJECT VISION

The goal of ALUMNI is to make graduate tracking more organized, accessible, and meaningful.

By bringing graduate information and outcome analysis into one interface, the project aims to help institutions better understand their graduates and their professional journeys.

**Because graduation should never mean losing the connection.**

---

## ◈ CONTRIBUTION

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Commit your improvements.
5. Open a Pull Request.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:075985,50:17172e,100:050505&height=130&section=footer" width="100%"/>

### BUILT TO CONNECT. DESIGNED TO TRACK. MADE TO GROW.

**ALUMNI — Graduate Tracking Platform**

<sub>© ALUMNI Project. All rights reserved by their respective owners.</sub>

</div>
