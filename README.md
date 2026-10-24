# F166 controlled Code Layer build fixture

This repository is a static Vite application containing only synthetic test data.

## Setup

Run `npm install`, then `npm run build`. `npm run dev` starts Vite.

The Vite configuration contains a controlled security probe that records only boolean presence for a fixed list of credential-related environment variables. It never records values, lengths, hashes, prefixes, or arbitrary environment names, and it performs no network requests.
