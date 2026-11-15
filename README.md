# Mirage Casino

Mirage Casino is a small casino app with four games: Slots, Blackjack, Keno, and Ride the Bus. The frontend uses React and Vite. The backend is an Express server with a SQLite database. Google handles sign-in.

## Before you start

You will need:

- Node.js 18 or later
- npm
- A Google account
- Google OAuth credentials for the app

## Install the dependencies

From the project folder, run:

```powershell
cd C:\git_repos\CasinoWebApp
npm install
cd casino_backend
npm install
```

The SQLite database is created automatically when the backend starts.

## Set up Google sign-in

In [Google Cloud Console](https://console.cloud.google.com/), create a project and an OAuth client with the application type **Web application**.

Add this as an authorized JavaScript origin:

```text
http://localhost:4000
```

Add this as an authorized redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

Now create a file named `casino_backend/.env` and add your Google credentials:

```dotenv
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:4000
SESSION_SECRET=use-a-long-random-string-here
PORT=3000
```

Keep this file private. In particular, do not commit `GOOGLE_CLIENT_SECRET` to the repository.

## Run the app

You need two terminals open.

In the first terminal, start the backend:

```powershell
cd C:\git_repos\CasinoWebApp\casino_backend
npm start
```

Leave it running. You should see `Server running on port 3000`.

In the second terminal, start the frontend:

```powershell
cd C:\git_repos\CasinoWebApp
npm run dev -- --port 4000
```

Open [http://localhost:4000](http://localhost:4000) and sign in with Google. The frontend sends its `/api` requests through Vite to the backend on port `3000`.

## Development commands

Run these from the project folder:

```powershell
npm run build
npm run lint
```

To view a production build locally:

```powershell
npm run build
npm run preview -- --host localhost --port 4000
```

## Common problems

### Port 3000 is already in use

This usually means the backend is already running. Use that existing process instead of starting another one.

To find the process using the port:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

To stop it, replace `<process-id>` with the ID from the previous command:

```powershell
Stop-Process -Id <process-id>
```

### Google reports `Error 401: invalid_client`

Check that the client ID and secret in `casino_backend/.env` are real values. Also check that this redirect URI is entered exactly as shown in Google Cloud Console:

```text
http://localhost:3000/api/auth/google/callback
```

Restart the backend after changing `.env`.

### A game cannot load coins or save a result

Make sure the backend is running, the frontend is open at `http://localhost:4000`, and you have signed in before opening a game.

If you use a different frontend port, update `FRONTEND_URL` in `casino_backend/.env` and the authorized JavaScript origin in Google Cloud Console.

## Folders worth knowing

```text
src/                  React components and styles
casino_backend/       Express server, routes, OAuth, and SQLite database
vite.config.js        Vite settings and the /api proxy
```
