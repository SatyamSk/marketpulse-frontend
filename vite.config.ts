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

6. Click **Commit changes** → **Commit changes**

---

## Fix 3 — Add .npmrc file

1. Go back to your repo main page
2. Click **Add file** → **Create new file**
3. Name it exactly: `.npmrc`
4. Paste:
```
legacy-peer-deps=true
