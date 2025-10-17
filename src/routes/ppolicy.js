import { DISCORD_SERVER } from "../utils/Constants.js";

export function renderPrivacyPolicy() {
  const app = document.getElementById('app');
  app.innerHTML = `
<span>
<strong>Privacy Policy (PRIVACY) - Hawk</strong>
<br><br>
1. <strong>Data collected</strong><br>
- At registration we collect: <strong>username</strong>, <strong>password</strong>, and <strong>display name</strong>.
<br><br>
2. <strong>Purpose and use</strong><br>
- <strong>username</strong> and <strong>password</strong>: validated and used exclusively for authentication and friend requests.<br>
- <strong>display name</strong>: shown on the site to identify the user.
<br><br>
3. <strong>No cookies</strong><br>
- <strong>We do not use cookies.</strong>
<br><br>
4. <strong>Sharing</strong><br>
- We do not share personal data with third parties, except when required by law.
<br><br>
5. <strong>Retention</strong><br>
- Account data is retained indefinitely and <strong>accounts cannot be deleted</strong>.
<br><br>
6. <strong>Security</strong><br>
- We implement reasonable measures to protect your data but cannot guarantee absolute security.
<br><br>
7. <strong>Minors</strong><br>
- The service is not intended for minors. Do not register without parental or guardian consent.
<br><br>
8. <strong>Changes</strong><br>
- We may update this Privacy Policy at any time. Continued use after changes implies acceptance.
<br><br>
9. <strong>Contact</strong><br>
- For questions or security reports contact us on Discord by clicking <a href="${DISCORD_SERVER}">here</a>.
</span>`;
}
