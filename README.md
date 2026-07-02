# CareCircle v3.2

Family care coordination app using GitHub Pages and Firebase.

## New in v3.2

- Firestore-based approved users
- Admin and Family Member roles
- Unauthorized access screen
- Admin-only delete buttons
- Admin page for user management
- Activity log foundation

## Important setup

Before testing v3.2, open `auth.js` and add your main Google account to:

```js
const BOOTSTRAP_ADMIN_EMAILS = ["your-email@gmail.com"];
```

Then sign in once with that account. CareCircle will create your admin user record in Firestore under the `users` collection.

After your admin user exists, you can add your spare Google account from the Admin page as a Family Member.

## Recommended test

1. Deploy to GitHub Pages.
2. Sign in with your main/admin Google account.
3. Open the Admin page.
4. Add your spare Google account as `Family Member`.
5. Log out.
6. Sign in with the spare account.
7. Confirm delete buttons are hidden.
8. Try a third Google account and confirm it is blocked.
