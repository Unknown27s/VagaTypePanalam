# Deployment Guide: VangaTypePanalam (Vercel)

This guide walk you through deploying **VangaTypePanalam** to Vercel with a production Neon Database and GitHub Authentication.

## 1. Prerequisites
- A **GitHub Account**.
- A **Vercel Account** (connected to GitHub).
- A **Neon.tech Account** for the database.

---

## 2. Prepare Your Online Services

### 2.1 Neon (Database)
1. Log in to [Neon.tech](https://neon.tech/).
2. Select your `VangaTypePanalam` project.
3. On the **Dashboard**, copy the **Connection String** (PostgreSQL URL).
4. Save this as your `DATABASE_URL`.

### 2.2 GitHub (Authentication)
1. Go to your **GitHub Settings** → **Developer Settings** → **OAuth Apps**.
2. Click **New OAuth App**.
3. **Application Name**: `VangaTypePanalam`.
4. **Homepage URL**: Your Vercel URL (e.g., `https://vangatype.vercel.app`).
5. **Authorization callback URL**: `https://vangatype.vercel.app/api/auth/callback/github`.
   > [!NOTE]
   > Replace `vangatype.vercel.app` with the actual domain Vercel gives you.
6. Generate a **Client Secret** and save both the **Client ID** and **Secret**.

---

## 3. Deploy to Vercel

1. **Push your code**: Ensure your latest changes are pushed to your GitHub repository.
2. **Import Project**: In Vercel, click **Add New** → **Project** and import your repository.
3. **Environment Variables**: This is the most critical step. In the "Environment Variables" section, add the following 4 keys:

| Key | Value Source |
|---|---|
| `DATABASE_URL` | From Neon Dashboard |
| `AUTH_GITHUB_ID` | From GitHub OAuth Settings |
| `AUTH_GITHUB_SECRET` | From GitHub OAuth Settings |
| `AUTH_SECRET` | Run `npx auth secret` or use any long random string |

4. **Build Settings**: Vercel should automatically detect **Next.js**. The build command should remain `next build`.
5. **Click Deploy!**

---

## 4. Troubleshooting

### Prisma Build Failures
We have added a `postinstall` script in `package.json` that runs `prisma generate`. If your build fails on Vercel with "Prisma Client not found," check that your `DATABASE_URL` is correct.

### Authentication Errors
If you see a "Redirect Uri Mismatch" error when logging in:
- Verify that the **Authorization callback URL** in GitHub exactly matches your Vercel URL followed by `/api/auth/callback/github`.
- Ensure there are no trailing slashes or hidden spaces in your Environment Variables.

---

## 5. Maintenance
After deployment, if you change your database schema:
1. Update `prisma/schema.prisma` locally.
2. Run `npx prisma db push` to update your Neon database.
3. Push the code change to GitHub; Vercel will automatically redeploy.
