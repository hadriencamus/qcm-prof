// Injects the question bank and the interview content from data/ into index.html,
// so the page stays a single self-contained file. Run: node build.js
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const read = f => JSON.parse(fs.readFileSync(path.join(dir, "data", f), "utf8"));

const bank = ["francais.json", "maths.json", "ecole.json", "crpe-repo.json"].flatMap(read);
const cases = read("situations.json");
const entretien = read("entretien.json");

// Every question needs 2 to 4 distinct choices (true/false allowed) and a valid answer index.
for (const q of bank) {
  const ok = Array.isArray(q.o) && q.o.length >= 2 && q.o.length <= 4 && new Set(q.o).size === q.o.length && q.a >= 0 && q.a < q.o.length && q.q && q.c;
  if (!ok) throw new Error("Invalid question: " + JSON.stringify(q).slice(0, 200));
}
const seen = new Set();
for (const q of bank) {
  // Same key as the page uses to remember mistakes.
  const k = q.q + "|" + q.o.join("|");
  if (seen.has(k)) throw new Error("Duplicate question: " + q.q);
  seen.add(k);
}

const file = path.join(dir, "index.html");
let html = fs.readFileSync(file, "utf8");
const inject = (name, value) => {
  const re = new RegExp("^const " + name + " = .*;$", "m");
  if (!re.test(html)) throw new Error("Missing line: const " + name);
  html = html.replace(re, () => "const " + name + " = " + JSON.stringify(value) + ";");
};
inject("BANK", bank);
inject("CASES", cases);
inject("ENTRETIEN", entretien);
fs.writeFileSync(file, html);

const by = {};
bank.forEach(q => (by[q.c] = (by[q.c] || 0) + 1));
console.log(bank.length, "questions", by, cases.length, "situations", entretien.questions.length, "interview questions");
