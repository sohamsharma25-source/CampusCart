# CampusCart
College Buy and Sell website

## Firebase setup

1. Create a project at https://console.firebase.google.com/
2. In Project Settings -> General -> Add web app, copy the Firebase config.
3. Enable **Authentication** (Email/Password), **Firestore** and **Storage** as needed.
4. Open `firebase.js` and replace the placeholder values in `firebaseConfig` with your project's values.
5. To use Firestore for products or Storage for images, call the helper functions exposed on `window` (e.g., `addProductToFirestore`, `uploadImageAndGetURL`).
6. Open the site (`index.html`) in a browser and test login/upload flows.

If you'd like, I can integrate auth/login and product storage in `script.js` next.

### Migration & upload progress

- When Firebase is configured, the app will load remote listings and show a prompt to migrate your local listings to Firestore.
- New listings are still added locally first. If Firebase is configured, images are uploaded to Storage with a progress indicator and the listing is saved to Firestore in the background.
- Local listings will be marked with a `firebaseDocId` after successful upload. If an upload fails, the listing remains in localStorage and an error toast is shown.

If you want me to fully switch the app to use Firestore as the primary store (removing localStorage fallback), tell me and I'll prepare a migration plan and implementation.
