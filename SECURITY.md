# Security Policy

I take the security and integrity of this project seriously. If you discover a security vulnerability in this repository or the deployed application at [biranchikulesika.com](https://biranchikulesika.com), please report it responsibly following the guidelines below.

---

## Reporting a Vulnerability

Please do not open public GitHub issues, pull requests, discussions, or social media posts for security vulnerabilities.

Report all vulnerabilities privately by email to:

**security@kulesika.in**

To help assess and resolve the issue quickly, please include the following details in your report:

* **Description**: A clear summary of the vulnerability, including its severity and potential impact.
* **Affected Component**: The exact URL, API endpoint, component, or file affected.
* **Steps to Reproduce**: Detailed, step-by-step instructions to reproduce the issue.
* **Proof of Concept (PoC)**: Minimal proof-of-concept code, HTTP request samples, or screenshots where applicable.
* **Suggested Remediation**: Any recommendations or fixes you may have (optional).

If you wish to encrypt your message or need a secure channel, mention this in your initial email without disclosing sensitive vulnerability details, and I will coordinate an encrypted exchange.

---

## Scope

### In Scope

* The web application deployed at `biranchikulesika.com`
* The source code and configurations within this repository
* Authentication and session management flows (OAuth, WebAuthn passkeys, proxy guards)
* Server actions and administrative route protections
* API endpoints (`/api/contributions`, `/api/webhooks/razorpay`, `/api/newsletter`, `/api/og`)
* Access control policies and database Row Level Security (RLS) rules

### Out of Scope

* Denial of Service (DoS or DDoS) attacks against infrastructure or third-party providers
* Social engineering, phishing, or physical attacks
* Vulnerabilities in upstream third-party dependencies, unless accompanied by a working exploit against this application
* Issues related to SPF, DKIM, or DMARC records that do not demonstrate an exploitable email spoofing vulnerability
* Non-sensitive information disclosure (such as public software versions or standard HTTP response headers)
* Automated scanner reports without actionable proof of exploitability

---

## What to Expect

When you submit a report:

1. **Acknowledgment**: You will receive an initial response acknowledging receipt of your report within 48 to 72 hours.
2. **Assessment & Triage**: The issue will be investigated and validated against the codebase. You may be contacted if clarification or further details are required.
3. **Remediation**: If the vulnerability is confirmed, a patch will be developed, tested, and deployed to production.
4. **Notification**: You will be notified once the fix has been applied and verified.

---

## Responsible Disclosure Guidelines

In the spirit of coordinated and responsible vulnerability disclosure:

* Please provide a reasonable window of time to investigate and address the vulnerability before publicly disclosing any details.
* Do not access, modify, delete, or exfiltrate any data that does not belong to you. Use only your own test accounts for verification.
* Do not degrade the performance, availability, or reliability of the live service for other users.
* Act in good faith to protect user privacy and system security.

Thank you for helping keep this project and its visitors safe.
