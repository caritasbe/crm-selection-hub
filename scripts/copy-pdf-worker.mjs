// Copie le worker de PDF.js dans public/ (servi tel quel par le site statique).
import fs from "node:fs";
fs.copyFileSync("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
