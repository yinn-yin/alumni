# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

# Alumni Graduate Tracking

A responsive React dashboard for recording alumni, reviewing graduate outcomes, filtering cohorts, and exporting records.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to create a production build and `npm run lint` to run Oxlint.

## Included workflows

- Add and edit graduate records with program, graduation year, outcome, role, employer, and location.
- Search records and filter by graduation year or outcome.
- Review overview metrics and cohort trend visualizations.
- Export the currently filtered directory as CSV.

This is a front-end prototype. Records are stored in the browser's local storage; connect an authenticated API and database before using real student information.
