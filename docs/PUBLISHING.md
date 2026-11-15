# Publishing author sites at name.yourdomain.com

Authors press **Publish** in the template editor and get `username.yourdomain.com`.
Replace `yourdomain.com` below with your real domain.

## Setup (do these in order)

1. **Buy the domain** from your registrar (or from Vercel).
2. **Add it in Vercel**: Project > Settings > Domains. Add both `yourdomain.com` and `*.yourdomain.com`.
3. **Point the nameservers** at your registrar to the ones Vercel shows. This is needed for the wildcard
   HTTPS certificate. DNS can take 24-48 hours. (Skip this if you bought the domain from Vercel.)
4. **Set the environment variable** in Vercel (Production and Preview): `VITE_ROOT_DOMAIN=yourdomain.com`
   (no `https://`, no trailing slash). Then **redeploy**. Until it is set, the Publish button stays disabled.
5. **Run the SQL**: open `supabase/publish-sites.sql`, paste it in the Supabase SQL Editor and run it once.
   It is safe to run again. (If you re-run the whole `supabase/schema.sql` instead, it contains the same objects.)
6. **Clerk**: author sites do not load Clerk, so nothing to configure there. Just make sure your main domain
   (`yourdomain.com`) stays an allowed domain in Clerk.

## Link preview (the card shown on X, Threads, WhatsApp, Facebook, LinkedIn)

Posting `username.yourdomain.com` shows a card with the author's photo, name and a line about the site.

- Social apps do not run JavaScript, so `middleware.ts` sends author-site visits through `api/site.ts`, which adds the
  title, description and image tags to the page. `api/og.ts` draws the 1200x630 image.
- The card uses the photo from the author's profile (About photo first, then avatar), the site's colours, the name and
  the hero headline. No photo = a coloured circle with their initial. Only JPEG and PNG photos can be drawn; a WebP photo
  also falls back to the initial.
- No new settings: the functions use the same `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_ROOT_DOMAIN`
  already set in Vercel. They only read public data.
- After deploying, check a real site in the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  and the LinkedIn Post Inspector, and open `https://username.yourdomain.com/api/og?site=username` to see the image.
- Platforms cache cards. After an author changes their photo or headline and presses **Update site**, the image address
  changes by itself, but an already-posted link can take a while to refresh.

## Test checklist

- [ ] Sign in, open Profile and set a username (3-20 letters, numbers or underscores).
- [ ] Open a template, edit it, press **Publish**.
- [ ] Open `username.yourdomain.com` (underscores in the username become hyphens). The site shows with no Fablebook menu.
- [ ] Edit the site, press **Update site**. Reload the live site: the change appears within about 5 minutes (usually at once).
- [ ] Add a link to a button (the small "Link" field in edit mode) and check it opens in a new tab.
- [ ] View the page source of the live site: it should contain `og:image`. Paste the link into a debugger (above) and check the card.
- [ ] Press **Unpublish**. The address now shows "This site isn't published yet".

## Testing without a domain

- Run `npm run dev`, then open `http://localhost:5173/?site=demo` (or `/s/demo`) for a built-in sample site (development builds only).
- Any real published name works the same way: `/?site=username` or `/s/username`.
- With no `VITE_ROOT_DOMAIN`, the editor's Publish button is disabled. To try publishing locally set `VITE_ROOT_DOMAIN=localhost` in `.env.local`.
- `npm test` runs the unit tests (address derivation, reserved names, host detection, link safety).

## How it works

- Pressing Publish saves a **copy** of the site in the `published_sites` table. Autosave never touches that copy.
- Visiting `name.yourdomain.com` loads the app, which sees the subdomain and shows only that site.
- The database checks the address equals the author's own username and blocks reserved names, so the
  browser cannot claim someone else's name.
- One live site per author. Changing your username and pressing Update moves the site to the new address.

## Troubleshooting

- **Certificate pending / "not secure" on subdomains**: the wildcard certificate needs the nameservers pointed at
  Vercel (step 3). Wait for DNS to finish (up to 48 hours) and check Settings > Domains in Vercel.
- **"Site not found" / "isn't published yet"**: the name is wrong, the author has not pressed Publish, or the SQL
  has not been run (step 5). Underscores in usernames are hyphens in the address.
- **Username changed after publishing**: the old address stops working once the author presses Update site; the
  site moves to the new address.
- **Reserved names**: www, app, api, admin, mail, ftp, blog, help, support, static, assets, cdn, dev, test,
  staging, status, docs, login, auth, dashboard, billing, ns1, ns2, smtp, imap, pop, fablebook cannot be used.
  The author must pick a different username.
- **Changes not showing**: published pages are cached for at most 5 minutes. Hard-refresh, or close and reopen the
  installed app, because the service worker caches the app itself.
- **Publish button is disabled**: `VITE_ROOT_DOMAIN` is not set in the deployed build, or the site was not
  redeployed after setting it.
