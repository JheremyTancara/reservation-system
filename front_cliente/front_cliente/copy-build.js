const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

copyDir(
  path.join(__dirname, "dist"),
  path.join(__dirname, "../../backend/backend/chat-client-dist")
);
console.log("✅ Build copiado a backend/backend/chat-client-dist");
