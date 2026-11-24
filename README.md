# kureev.com

Static site, deployed on Vercel. No build step.

- `/` — home page (`index.html`)
- `/electronics` — *Electronics for a robot arm*, an interactive 3D course (`electronics/`): the quest map plus one HTML file per level. Three.js is loaded from a CDN; progress is kept in the visitor’s `localStorage` (`quest_v1`). English and Russian: `electronics/i18n.js` plus dictionaries in `electronics/i18n/`; `?lang=ru` forces Russian.

The previous Gatsby blog lives in git history.
