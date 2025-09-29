import { DISCORD_SERVER } from "../utils/Constants.js";

export function renderTermsOfService() {
  const app = document.getElementById('app');
  app.innerHTML = `
<span>
<strong>Terms of Service (TERMS) - Hawk</strong>
<br><br>
1. <strong>Acceptance</strong><br>
By using this site you accept these Terms. If you do not agree, do not use the service.
<br><br>
2. <strong>Registration and account</strong><br>
- To create an account you must register with: <strong>username</strong>, <strong>password</strong> and <strong>display name</strong>.<br>
- <strong>username</strong> and <strong>password</strong> are used to log in. <strong>display name</strong> is used only to identify you publicly within the site.<br>
- You are responsible for keeping your <strong>username</strong> and <strong>password</strong> confidential and for all activities that occur under your account.<br>
- Do not share credentials; notify the site administrator via Discord if you detect unauthorized access.
<br><br>
3. <strong>Permitted use</strong><br>
- Do not use the service for illegal, fraudulent, defamatory activities, or to infringe the rights of others.<br>
- We may suspend or delete accounts that violate these Terms.
<br><br>
4. <strong>User content</strong><br>
- You retain ownership of content you publish unless you grant licenses through site options (if applicable).<br>
- By posting content you agree the site may display it to other users according to the site’s functionality.
<br><br>
5. <strong>Account status</strong><br>
- Accounts remain on the system indefinitely. If an account is deactivated by the site, some account data may still be retained for operational reasons.
<br><br>
6. <strong>Security</strong><br>
- We implement reasonable measures to protect your data but cannot guarantee absolute security.<br>
- Use strong, unique passwords.
<br><br>
7. <strong>Minors</strong><br>
- The service is not for minors. Do not register without parental or guardian consent.
<br><br>
8. <strong>Changes</strong><br>
- We may update these Terms at any time. Continued use after changes implies acceptance.
<br><br>
9. <strong>Contact</strong><br>
- For questions or security reports contact us on Discord by clicking <a href="${DISCORD_SERVER}">here</a>.
</span>`;
}
