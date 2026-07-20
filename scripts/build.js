const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_PROJECT_URL";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of ["index.html", "styles.css", "app.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
  filter: (source) => path.basename(source) !== ".DS_Store",
});

fs.writeFileSync(
  path.join(dist, "supabase-config.js"),
  `window.PatientDZSupabase = ${JSON.stringify(
    {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
    null,
    2,
  )};\n`,
);

console.log("Built Doctor DZ into dist/");
