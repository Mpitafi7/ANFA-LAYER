# Contributing to ANFA Layer

ANFA Layer is an open source security and privacy layer for images.
We welcome contributions from everyone.

## Getting Started
1. Fork the repository at https://github.com/Mpitafi7/ANFA-LAYER
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ANFA-LAYER`
3. Install dependencies: `npm install`
4. Run tests: `npm test` — all 16 must pass before you start

## How to Contribute
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Write your code with full TypeScript types — no `any` allowed
3. Write tests for every new feature
4. Ensure all tests pass: `npm test`
5. Build must succeed: `npm run build`
6. Submit a pull request with clear description

## Code Standards
- TypeScript strict mode always — never disable strict checks
- Every new feature needs minimum 3 test cases
- Every function needs JSDoc comment
- Security-related changes need detailed explanation in PR
- Follow existing folder structure and naming conventions

## Reporting Security Vulnerabilities
DO NOT open public GitHub issues for security vulnerabilities.
This is a security project — responsible disclosure is required.
Contact via GitHub private security advisory:
https://github.com/Mpitafi7/ANFA-LAYER/security/advisories/new

## What We Need Help With
- More image format support
- Performance improvements
- Browser/WASM version
- Documentation translations
- Security audits
