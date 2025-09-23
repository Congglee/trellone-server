# 📖 Configure UploadThing for Trellone

## 1) Sign Up and Create a Token

- Go to https://uploadthing.com → Sign up / Log in
- Create a project if needed
- Generate an API token

---

## 2) Backend Environment Variable

---

Add to `.env.{environment}`:

```env
UPLOADTHING_TOKEN=ut_1234567890abcdefghijklmnopqrstuv
```

---

## 3) How the Backend Uses It

Trellone API uploads image/document buffers via UploadThing in `src/providers/uploadthing.ts`. No frontend exposure of the token is required.

---

## 4) Notes

- Do not expose `UPLOADTHING_TOKEN` to the browser
- For Docker, mount `uploads/` volume if you need local temp persistence

---

🔑 **Important Notes**:

- The API key is secret — use it only on the server side.
- Never expose it in frontend/browser code.
- If you accidentally leak the key, go back to the Dashboard and **Regenerate** a new one.
