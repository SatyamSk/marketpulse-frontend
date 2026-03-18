import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Click **Commit changes**.

Then click `package.json` → pencil icon → find and delete this line:
```
"lovable-tagger": "^1.1.13",
```

Click **Commit changes**.

Then click **Add file** → **Create new file** → name it `.npmrc` → paste:
```
legacy-peer-deps=true
