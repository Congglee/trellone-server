# 📖 Configure Unsplash for Trellone

## 1) Create a Developer App

- Go to https://unsplash.com/developers and sign in
- Register a new application

---

## 2) Get Your Access Key

- From your app’s details, copy the Access Key

---

## 3) Backend Environment Variables

Add to `.env.{environment}`:

```env
UNSPLASH_ACCESS_KEY=your_access_key_here
```

---

`UNSPLASH_SECRET_KEY` and `UNSPLASH_APPLICATION_ID` are optional for this project.

---

## 4) Using the API in Trellone

The backend provides an authenticated endpoint:

- `GET /medias/unsplash/search/get-photos?query=<term>&page=1&per_page=29`

Requires user access token (cookie or `Authorization: Bearer <token>`). The server calls Unsplash using `UNSPLASH_ACCESS_KEY`.

---

## 5) Rate Limits

Unsplash imposes rate limits. For production, request higher limits when your app is ready.

---

## 7. Be Mindful of Rate Limits & Production Approval

- Initially, new apps are typically in **“Demo / Development mode”** with limited rate (for example, \~50 requests per hour). ([pluralsight.com][4])
- When you're ready for production, you may need to request production access / submit your application for review/approval (with screenshots, usage details, etc.). This can raise your rate limits. ([pluralsight.com][4])
