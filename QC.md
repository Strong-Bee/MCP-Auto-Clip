# UNIVERSAL QUALITY CONTROL (QC.md)

**Universal Project Quality Assurance, Testing, Security & Automated Self-Repair Standard**

| Property          | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| Document          | QC.md                                                                 |
| Standard          | Universal Project QC                                                  |
| Version           | 1.0.0                                                                 |
| Scope             | All software projects                                                 |
| Execution         | Manual + AI Agent                                                     |
| Compatible Agents | Claude Code, OpenCode, Codex, and other coding agents                 |
| Languages         | TypeScript, JavaScript, Python, Rust, PHP, Java, Go, C#, and others   |
| Frameworks        | Next.js, React, Node.js, Express, Laravel, Tauri, Flutter, and others |
| Primary Goal      | Detect, fix, verify, and prevent project defects                      |

---

# 1. PURPOSE

This document defines a universal Quality Control standard for every software project.

Every AI agent or developer working on a project must use this document as a reference for inspecting, testing, validating, and improving project quality.

The objective is to ensure that every project is:

- Functional and reliable.
- Free from known critical errors.
- Secure against common vulnerabilities.
- Maintainable and scalable.
- Consistent with its architecture.
- Responsive across supported devices.
- Properly integrated with APIs and databases.
- Optimized for performance.
- Properly documented.
- Ready for its intended deployment environment.

**Core principle: A successful build does not automatically mean a successful project.**

The agent must inspect the actual application behavior, not just whether the compiler returns success.

# 2. UNIVERSAL QC RULES

These rules apply to all projects regardless of programming language, framework, or architecture.

## 2.1 Mandatory Rules

1. Inspect the project before modifying anything.
2. Understand the existing architecture and coding conventions.
3. Read `AGENTS.md`, `CLAUDE.md`, `README.md`, and other relevant instructions when available.
4. Identify existing errors before introducing changes.
5. Never remove working functionality without authorization.
6. Never replace an existing architecture without a clear technical reason and approval where required.
7. Never introduce unnecessary dependencies.
8. Never hardcode secrets, passwords, tokens, or private credentials.
9. Never claim a test passed without executing it or verifying equivalent evidence.
10. Never ignore TypeScript, compiler, runtime, database, or security errors.
11. Always verify the final changes.
12. Report unresolved issues honestly.

## 2.2 Project Preservation

Before making changes:

- Inspect Git status.
- Identify modified and untracked files.
- Preserve user changes.
- Avoid overwriting existing configurations.
- Do not delete files simply because they appear unused.
- Do not reset, force-push, or rewrite Git history without explicit authorization.
- Do not modify production databases or live infrastructure without permission.

If a task requires a destructive operation, stop and request approval.

# 3. QC EXECUTION LIFECYCLE

Every QC session must follow this lifecycle:

```text
START
  |
  v
PROJECT DISCOVERY
  |
  v
ARCHITECTURE INSPECTION
  |
  v
BASELINE ERROR DETECTION
  |
  v
STATIC ANALYSIS
  |
  v
DEPENDENCY AUDIT
  |
  v
SECURITY AUDIT
  |
  v
FUNCTIONAL TESTING
  |
  v
UI/UX TESTING (IF APPLICABLE)
  |
  v
DATABASE & API TESTING (IF APPLICABLE)
  |
  v
PERFORMANCE TESTING
  |
  v
BUILD & DEPLOYMENT VALIDATION
  |
  v
ISSUE CLASSIFICATION
  |
  v
AUTOMATED REPAIR
  |
  v
REGRESSION TESTING
  |
  v
FINAL VERIFICATION
  |
  v
QC REPORT
  |
  v
END
```

If a check is not applicable, mark it `N/A` and explain why. Do not silently skip it.

# 4. PROJECT DISCOVERY

Before running tests or changing files, identify the project environment.

## 4.1 Inspect Project Structure

Inspect:

- Root directory.
- Source directories.
- Configuration files.
- Package manifests.
- Lockfiles.
- Environment templates.
- Database schemas and migrations.
- Test directories.
- Build scripts.
- CI/CD configurations.
- Deployment configurations.
- Documentation.
- Agent instruction files.

## 4.2 Detect Technology Stack

Automatically identify:

| Category       | Examples                                      |
| -------------- | --------------------------------------------- |
| Language       | TypeScript, JavaScript, Python, Rust, PHP, Go |
| Frontend       | React, Next.js, Vue, Svelte, Angular          |
| Backend        | Express, NestJS, Fastify, Laravel, Django     |
| Desktop        | Tauri, Electron                               |
| Mobile         | Flutter, React Native                         |
| Database       | PostgreSQL, MySQL, SQLite, MongoDB            |
| ORM            | Prisma, Drizzle, Sequelize, Eloquent          |
| Styling        | Tailwind CSS, CSS Modules, Sass               |
| Testing        | Vitest, Jest, Playwright, Pytest              |
| Infrastructure | Docker, Vercel, VPS, Nginx                    |
| AI Integration | OpenAI, Anthropic, Google, NVIDIA             |

Only run checks relevant to the detected stack.

## 4.3 Environment Inspection

Check:

- Runtime version.
- Package manager version.
- Dependency installation.
- Required system binaries.
- Environment variables.
- Configuration consistency.
- Operating system compatibility.
- Required external services.

Do not expose secret values in terminal output or QC reports.

# 5. CODE QUALITY CONTROL

## 5.1 Source Code Inspection

Check for:

- Syntax errors.
- Type errors.
- Invalid imports.
- Unused imports.
- Undefined variables.
- Unreachable code.
- Duplicate logic.
- Dead code.
- Inconsistent naming.
- Incorrect function signatures.
- Missing error handling.
- Improper asynchronous operations.
- Memory leaks.
- Resource leaks.
- Circular dependencies.
- Unexpected side effects.

## 5.2 Code Architecture

Verify:

- Separation of concerns.
- Correct module boundaries.
- Reusable components.
- Appropriate abstractions.
- Consistent dependency direction.
- Proper configuration management.
- Clear service and repository responsibilities.
- Appropriate error boundaries.
- Maintainable file organization.

Do not introduce architectural complexity without a measurable benefit.

## 5.3 Code Standards

The agent must follow the existing project's conventions.

If no conventions exist:

- Use consistent naming.
- Keep functions focused.
- Avoid unnecessary duplication.
- Prefer explicit types.
- Use clear interfaces.
- Avoid excessive nesting.
- Keep configuration separate from business logic.
- Document complex behavior.

# 6. BUILD & COMPILATION QC

Verify that the project can compile and build successfully.

Applicable checks include:

- Dependency resolution.
- Type checking.
- Linting.
- Compilation.
- Production build.
- Asset generation.
- Module resolution.
- Environment configuration.
- Native compilation.
- Packaging.

Examples:

| Technology | Recommended QC Commands                                    |
| ---------- | ---------------------------------------------------------- |
| Next.js    | `npm run lint`, `npx tsc --noEmit`, `npm run build`        |
| React/Vite | `npm run lint`, `npx tsc --noEmit`, `npm run build`        |
| Node.js    | `npm test`, `npm run build`                                |
| Python     | `python -m compileall .`, `pytest`                         |
| Rust       | `cargo check`, `cargo test`, `cargo clippy -- -D warnings` |
| Laravel    | `php artisan test`, `php artisan route:list`               |
| Flutter    | `flutter analyze`, `flutter test`, `flutter build`         |
| Go         | `go vet ./...`, `go test ./...`, `go build ./...`          |
| .NET       | `dotnet build`, `dotnet test`                              |
| Java       | `./gradlew test`, `./gradlew build`                        |

Commands are examples, not universal requirements. Detect available scripts and use the project's actual toolchain.

A successful build must be supported by actual command output or CI evidence.

# 7. FUNCTIONAL TESTING

Test actual application functionality.

## 7.1 Core Functionality

Check:

- Application starts correctly.
- Main entry point works.
- Navigation works.
- Forms submit correctly.
- Buttons perform their advertised actions.
- Data loads correctly.
- Data saves correctly.
- Search works.
- Filtering works.
- Sorting works.
- Pagination works.
- Error messages are meaningful.
- Empty states are handled.
- Loading states are handled.
- Unexpected inputs are handled.

## 7.2 CRUD Testing

For applications with data management:

| Operation   | Expected Result                      |
| ----------- | ------------------------------------ |
| Create      | New record is created correctly      |
| Read        | Correct record is retrieved          |
| Update      | Existing record is updated           |
| Delete      | Record is deleted or safely archived |
| Validation  | Invalid input is rejected            |
| Persistence | Data remains after reload            |

Never test destructive CRUD operations against production records without explicit authorization.

## 7.3 Authentication Testing

If authentication exists, check:

- Registration.
- Login.
- Logout.
- Session persistence.
- Session expiration.
- Password reset.
- Email verification.
- Unauthorized access.
- Protected routes.
- Role-based access.
- Permission enforcement.
- Token validation.

## 7.4 Role & Permission Testing

Test every supported role.

Examples:

- Guest.
- Member.
- Moderator.
- Admin.
- Owner.

Verify that users cannot access unauthorized features by directly calling APIs or changing client-side state.

# 8. FRONTEND & UI/UX QC

Applicable to web, desktop, and mobile applications with graphical interfaces.

## 8.1 Visual Inspection

Check:

- Layout consistency.
- Typography.
- Spacing.
- Color contrast.
- Component alignment.
- Icon consistency.
- Image rendering.
- Overflow.
- Broken layouts.
- Missing assets.
- Loading indicators.
- Error states.
- Empty states.

## 8.2 Responsive Testing

Test supported viewport sizes:

| Device        | Example Width |
| ------------- | ------------: |
| Small Mobile  |         320px |
| Mobile        |         375px |
| Large Mobile  |         430px |
| Tablet        |         768px |
| Laptop        |        1024px |
| Desktop       |        1440px |
| Large Desktop |        1920px |

Verify:

- No unintended horizontal scrolling.
- Navigation adapts correctly.
- Forms remain usable.
- Tables are accessible.
- Dialogs fit the viewport.
- Buttons remain accessible.
- Content does not overlap.

## 8.3 Interaction Testing

Every interactive component must work.

Check:

- Buttons.
- Links.
- Dropdowns.
- Modals.
- Tabs.
- Accordions.
- Tooltips.
- Search inputs.
- Date pickers.
- File uploads.
- Notifications.
- Navigation menus.

A decorative button that does nothing is a functional defect.

## 8.4 Accessibility

Check applicable WCAG 2.2 AA requirements:

- Semantic HTML.
- Keyboard navigation.
- Visible focus indicators.
- Accessible form labels.
- Image alternative text.
- Sufficient color contrast.
- Screen-reader compatibility.
- Dialog focus management.
- Accessible error messages.

# 9. BACKEND & API QC

For backend services and APIs, verify:

## 9.1 API Validation

- Correct HTTP methods.
- Correct status codes.
- Request validation.
- Response schema consistency.
- Error handling.
- Authentication.
- Authorization.
- Rate limiting.
- Input sanitization.
- Pagination.
- Filtering.
- Sorting.
- Timeout handling.

## 9.2 API Security

Check for:

- Broken access control.
- IDOR vulnerabilities.
- Injection vulnerabilities.
- Excessive data exposure.
- Missing authentication.
- Weak authorization.
- Improper CORS configuration.
- SSRF risks.
- Unrestricted resource consumption.
- Sensitive data leakage.

Use safe, authorized tests only. Do not attack third-party systems or production infrastructure.

## 9.3 Integration Testing

Verify:

- External API connectivity.
- API key configuration.
- Timeout handling.
- Retry behavior.
- Fallback providers.
- Response validation.
- Rate-limit handling.
- Failure recovery.
- Logging and observability.

Do not repeatedly retry operations that may cause duplicate payments, duplicate messages, or other irreversible side effects. Use idempotency controls where applicable.

# 10. DATABASE QC

For applications using databases:

## 10.1 Schema Validation

Check:

- Table definitions.
- Column types.
- Primary keys.
- Foreign keys.
- Indexes.
- Unique constraints.
- Nullability.
- Default values.
- Relationships.
- Migration consistency.

## 10.2 Data Integrity

Verify:

- No unexpected duplicate records.
- No orphaned records.
- Correct relationships.
- Correct data types.
- Valid timestamps.
- Correct timezone handling.
- Transaction integrity.
- Referential integrity.

## 10.3 Database Security

Check:

- Credentials are not exposed.
- Least-privilege database access.
- Parameterized queries.
- Row-level security where applicable.
- Safe migration practices.
- Backup and recovery strategy.
- Sensitive data protection.

## 10.4 Migration Safety

Before migrations:

1. Inspect the existing schema.
2. Review the migration.
3. Identify destructive operations.
4. Verify backup and rollback procedures.
5. Obtain approval for destructive production changes.

Never drop production tables or truncate production data as an automatic QC repair.

# 11. SECURITY QC

Security testing must be performed on all applicable project layers.

## 11.1 Secrets & Configuration

Check:

- API keys.
- Access tokens.
- Database credentials.
- Private keys.
- JWT secrets.
- OAuth credentials.
- Environment files.
- Debug configurations.

Rules:

- Never commit real secrets.
- Never print secrets in reports.
- Never send secrets to external services unnecessarily.
- Use environment variables or approved secret managers.
- Rotate credentials if exposure is confirmed, with appropriate authorization.

## 11.2 Dependency Security

Inspect:

- Known vulnerable packages.
- Outdated dependencies.
- Unmaintained packages.
- Suspicious dependencies.
- License compatibility.
- Lockfile consistency.

Use the package manager's audit capabilities where available.

Do not blindly upgrade all dependencies. Evaluate breaking changes and compatibility.

## 11.3 Common Vulnerabilities

Check applicable OWASP categories:

- Broken Access Control.
- Cryptographic Failures.
- Injection.
- Insecure Design.
- Security Misconfiguration.
- Vulnerable and Outdated Components.
- Authentication Failures.
- Software and Data Integrity Failures.
- Security Logging and Monitoring Failures.
- Server-Side Request Forgery.

Security findings must include severity, affected component, evidence, impact, and recommended remediation.

# 12. PERFORMANCE QC

Evaluate application performance according to its intended workload.

## 12.1 Frontend Performance

Check:

- Bundle size.
- Image optimization.
- Lazy loading.
- Unnecessary re-renders.
- Blocking resources.
- Font loading.
- Client-side caching.
- Network requests.
- Core Web Vitals where applicable.

## 12.2 Backend Performance

Check:

- API response time.
- Database query performance.
- N+1 queries.
- Memory consumption.
- CPU usage.
- Connection pooling.
- Cache effectiveness.
- Queue processing.
- Concurrency handling.

## 12.3 Resource Management

Check:

- Memory leaks.
- Unclosed file handles.
- Unclosed database connections.
- Unreleased temporary files.
- Background worker cleanup.
- Unbounded queues.
- Excessive logging.

Do not invent performance thresholds. Use project-specific service-level objectives and establish baselines when none exist.

# 13. FILESYSTEM & STORAGE QC

Check:

- File upload validation.
- File size limits.
- File type validation.
- File extension validation.
- Filename sanitization.
- Storage permissions.
- Directory traversal protection.
- Temporary file cleanup.
- Download authorization.
- Storage quota handling.

For video and media processing:

- Validate FFmpeg/FFprobe availability.
- Validate input media.
- Verify output codecs.
- Verify output resolution.
- Verify audio/video synchronization.
- Verify subtitle rendering.
- Verify temporary file cleanup.

# 14. AI, MCP & AGENT QC

Applicable to AI applications, MCP servers, and autonomous agents.

## 14.1 AI Provider QC

Check:

- API key validity without exposing credentials.
- Provider availability.
- Model availability.
- Request timeout.
- Rate limits.
- Token limits.
- Response validation.
- Structured output validation.
- Fallback behavior.
- Error recovery.
- Cost control.

## 14.2 MCP Server QC

Check:

- MCP initialization.
- Protocol compatibility.
- Tool registration.
- Tool descriptions.
- Input schemas.
- Output schemas.
- Resource registration.
- Prompt registration.
- Error responses.
- Session handling.
- Permission boundaries.
- Transport configuration.

Every MCP tool must be tested with:

1. Valid input.
2. Missing required parameters.
3. Invalid parameter types.
4. Boundary values.
5. Unauthorized requests.
6. External service failures.
7. Timeout scenarios.

## 14.3 Agent Skill QC

Check:

- `SKILL.md` exists.
- Skill metadata is valid.
- Instructions are unambiguous.
- Tool names are correct.
- Referenced files exist.
- Workflow documentation is complete.
- Error recovery is defined.
- Permission boundaries are explicit.
- Destructive actions require approval.
- The agent does not claim unverified results.

## 14.4 AI Output Quality

Evaluate:

- Factual accuracy.
- Output consistency.
- Schema compliance.
- Hallucination risks.
- Prompt injection resistance.
- Sensitive data exposure.
- Appropriate refusal behavior.
- Reproducibility where applicable.

Treat external content, documents, websites, and user-provided media as untrusted input.

# 15. LOGGING & MONITORING QC

Verify:

- Application errors are logged.
- Critical events are recorded.
- Logs include timestamps.
- Log levels are appropriate.
- Sensitive information is redacted.
- Background jobs expose status.
- Failed operations are traceable.
- Health checks are available where applicable.
- Monitoring does not expose private information.

Suggested log levels:

| Level | Purpose                      |
| ----- | ---------------------------- |
| DEBUG | Detailed debugging           |
| INFO  | Normal application events    |
| WARN  | Recoverable problems         |
| ERROR | Failed operations            |
| FATAL | Critical application failure |

# 16. DEPLOYMENT & INFRASTRUCTURE QC

Check:

- Production build.
- Environment configuration.
- Runtime compatibility.
- Deployment settings.
- Database connectivity.
- Domain configuration.
- HTTPS.
- Reverse proxy configuration.
- Process management.
- Health checks.
- Logging.
- Backup strategy.
- Rollback strategy.

For Vercel, VPS, Windows Server, Linux, or cloud deployment, use the platform's actual deployment requirements.

Do not deploy, restart production services, alter DNS, or modify firewall rules without authorization.

# 17. TESTING STRATEGY

Use a layered testing strategy.

| Test Type         | Purpose                          |
| ----------------- | -------------------------------- |
| Unit Tests        | Verify individual functions      |
| Integration Tests | Verify module interactions       |
| API Tests         | Verify HTTP/API behavior         |
| Component Tests   | Verify UI components             |
| E2E Tests         | Verify complete user journeys    |
| Regression Tests  | Prevent previous bugs returning  |
| Security Tests    | Detect security weaknesses       |
| Performance Tests | Measure system performance       |
| Build Tests       | Verify compilation and packaging |
| Smoke Tests       | Verify critical functionality    |

Prioritize critical business flows over superficial test coverage percentages.

# 18. ISSUE CLASSIFICATION

Every discovered issue must receive a severity level.

| Severity      | Classification                                             | Action                                            |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| P0 - Critical | Data loss, severe security breach, complete system failure | Stop affected operations and escalate immediately |
| P1 - High     | Core functionality broken, serious authorization defect    | Fix before release                                |
| P2 - Medium   | Important feature malfunction, significant usability issue | Fix before release where possible                 |
| P3 - Low      | Minor defects, non-critical inconsistencies                | Schedule repair                                   |
| P4 - Info     | Suggestions and optimization opportunities                 | Document for future improvement                   |

## 18.1 Issue Report Format

Every issue must include:

```text
Issue ID:
Title:
Severity:
Category:
Affected File:
Affected Component:
Description:
Steps to Reproduce:
Expected Behavior:
Actual Behavior:
Root Cause:
Recommended Fix:
Verification Method:
Status:
```

# 19. AUTOMATED SELF-REPAIR ENGINE

AI agents should repair eligible issues automatically.

## 19.1 Repair Workflow

```text
DETECT ISSUE
    |
    v
CLASSIFY SEVERITY
    |
    v
IDENTIFY ROOT CAUSE
    |
    v
CHECK CHANGE IMPACT
    |
    v
CREATE SAFE REPAIR PLAN
    |
    v
APPLY MINIMAL FIX
    |
    v
RUN TARGETED TESTS
    |
    v
RUN REGRESSION TESTS
    |
    v
VERIFY ORIGINAL ISSUE
    |
    +---- PASS ----> MARK FIXED
    |
    +---- FAIL ----> REASSESS
                       |
                       v
                  SAFE RETRY?
                       |
                 +-----+-----+
                 |           |
                YES          NO
                 |           |
             REPAIR AGAIN   ESCALATE
```

## 19.2 Automatic Repair Rules

The agent may automatically:

- Fix syntax errors.
- Fix type errors.
- Fix broken imports.
- Fix missing exports.
- Fix straightforward lint errors.
- Fix incorrect component properties.
- Fix safe validation defects.
- Fix clearly identified logic bugs.
- Fix broken tests caused by its own changes.
- Fix missing documentation references.

The agent must not automatically:

- Delete production data.
- Remove authentication or authorization.
- Disable security checks to make tests pass.
- Expose secrets.
- Change payment behavior.
- Change financial calculations without review.
- Replace major architecture.
- Remove existing features.
- Upgrade major dependencies indiscriminately.
- Modify external infrastructure.
- Perform irreversible operations.

These actions require explicit approval.

## 19.3 Retry Limits

Default retry configuration:

| Parameter                 |           Default |
| ------------------------- | ----------------: |
| Automatic Repair Attempts |                 3 |
| Targeted Test Attempts    |                 3 |
| Regression Verification   |          Required |
| Critical Security Issues  |        Escalation |
| Destructive Changes       | Approval Required |

Retry limits apply to each issue, not unlimited recursive repair.

After reaching the limit, stop and report the remaining problem.

## 19.4 Repair Quality

Every repair must:

1. Address the actual root cause.
2. Minimize unrelated changes.
3. Preserve existing functionality.
4. Include appropriate tests.
5. Pass relevant validation.
6. Avoid introducing security regressions.
7. Be documented in the QC report.

# 20. REGRESSION TESTING

After every repair, execute the relevant regression tests.

Check:

- Previously working functionality.
- Related modules.
- API contracts.
- Database behavior.
- Authentication.
- Authorization.
- UI interactions.
- Background jobs.
- External integrations.

A repaired issue must not be marked fixed if its correction introduces another unresolved critical issue.

# 21. QC CHECKLIST

The following checklist is the standard final verification list.

## Project & Architecture

- [ ] Project structure inspected.
- [ ] Technology stack identified.
- [ ] Existing instructions reviewed.
- [ ] Git changes preserved.
- [ ] Configuration inspected.
- [ ] Architecture validated.

## Code Quality

- [ ] Syntax errors checked.
- [ ] Type errors checked.
- [ ] Imports validated.
- [ ] Lint checks executed.
- [ ] Error handling reviewed.
- [ ] Code duplication reviewed.

## Build & Runtime

- [ ] Dependencies validated.
- [ ] Build executed.
- [ ] Application starts.
- [ ] Runtime errors checked.
- [ ] Required environment variables validated.

## Functional Testing

- [ ] Main features tested.
- [ ] Forms tested.
- [ ] Navigation tested.
- [ ] CRUD tested where applicable.
- [ ] Authentication tested where applicable.
- [ ] Permissions tested where applicable.

## UI/UX

- [ ] Desktop checked.
- [ ] Tablet checked.
- [ ] Mobile checked.
- [ ] Interactions tested.
- [ ] Accessibility reviewed.
- [ ] Loading and error states checked.

## Backend & Database

- [ ] API endpoints checked.
- [ ] Request validation checked.
- [ ] Response validation checked.
- [ ] Database schema checked.
- [ ] Data integrity checked.
- [ ] Migration safety reviewed.

## Security

- [ ] Secrets checked.
- [ ] Dependencies audited.
- [ ] Authentication checked.
- [ ] Authorization checked.
- [ ] Input validation checked.
- [ ] Sensitive data exposure checked.

## Performance

- [ ] Frontend performance reviewed.
- [ ] Backend performance reviewed.
- [ ] Database queries reviewed.
- [ ] Memory and resource usage reviewed.

## AI/MCP (If Applicable)

- [ ] Provider integration checked.
- [ ] MCP tools validated.
- [ ] Resources validated.
- [ ] Prompts validated.
- [ ] Skills validated.
- [ ] Agent permissions checked.

## Final Verification

- [ ] Critical issues resolved.
- [ ] Regression tests passed.
- [ ] Production build passed where applicable.
- [ ] Deployment configuration reviewed.
- [ ] Documentation updated.
- [ ] QC report generated.

# 22. QUALITY GATE

The project must pass the applicable quality gates before being declared ready.

| Gate   | Requirement                         |
| ------ | ----------------------------------- |
| Gate 1 | Project inspection completed        |
| Gate 2 | No unresolved P0 issues             |
| Gate 3 | No unresolved P1 issues for release |
| Gate 4 | Relevant tests executed             |
| Gate 5 | Build passes where applicable       |
| Gate 6 | Security checks completed           |
| Gate 7 | Critical functionality verified     |
| Gate 8 | Regression checks completed         |
| Gate 9 | QC report generated                 |

A gate may be marked `BLOCKED` if required evidence is unavailable.

## 22.1 Final Status

Use one of these statuses:

- **PASS:** All applicable mandatory checks passed.
- **PASS WITH WARNINGS:** Mandatory checks passed, but non-critical issues remain.
- **FAIL:** One or more mandatory checks failed.
- **BLOCKED:** QC could not be completed because of missing access, infrastructure, approval, or dependencies.
- **NOT VERIFIED:** There is insufficient evidence to establish the result.

Never mark an unexecuted check as passed.

# 23. QC REPORT TEMPLATE

After completing a QC session, generate a report using this format:

```markdown
# Project QC Report

## Project Information

- Project Name:
- Project Version:
- Technology Stack:
- QC Date:
- QC Agent:
- Git Branch:
- Commit:

## Overall Result

Status: PASS / PASS WITH WARNINGS / FAIL / BLOCKED / NOT VERIFIED

## Summary

- Total Checks:
- Passed:
- Failed:
- Warnings:
- Not Applicable:
- Not Verified:

## Build Results

- Build:
- Type Check:
- Lint:
- Tests:
- Runtime:

## Security Results

- Secrets:
- Dependency Audit:
- Authentication:
- Authorization:
- Input Validation:

## Functional Results

- Core Features:
- API:
- Database:
- UI/UX:
- Integrations:

## Issues Found

| ID  | Severity | Issue | Status |
| --- | -------- | ----- | ------ |

## Repairs Applied

| File | Problem | Repair | Verification |
| ---- | ------- | ------ | ------------ |

## Remaining Issues

List unresolved issues with explanations.

## Changed Files

List all files modified during QC.

## Verification Evidence

Include actual commands, test results, and relevant evidence.

## Final Recommendation

- Ready for Development
- Ready for Staging
- Ready for Production
- Not Ready

## Notes

Additional information and limitations.
```

# 24. AI AGENT EXECUTION INSTRUCTIONS

Any AI agent using this document must follow these instructions.

## Agent Responsibilities

You are acting as a Senior Software Engineer, QA Engineer, Security Reviewer, and Reliability Engineer.

Your responsibility is to inspect the entire relevant project scope, detect defects, perform safe repairs, and verify the result.

### Execution Rules

**Phase 1 — Understand**

- Read project documentation.
- Inspect the repository.
- Identify the stack.
- Understand existing functionality.
- Identify available test commands.

**Phase 2 — Diagnose**

- Inspect code quality.
- Execute baseline checks.
- Identify runtime errors.
- Review integrations.
- Classify defects.

**Phase 3 — Repair**

- Prioritize P0 and P1.
- Fix root causes.
- Make minimal changes.
- Preserve existing functionality.
- Request approval for restricted actions.

**Phase 4 — Verify**

- Execute targeted tests.
- Execute regression tests.
- Run lint and type checks.
- Run production build where applicable.
- Inspect the final Git diff.

**Phase 5 — Report**

- Generate QC report.
- List repaired issues.
- List remaining issues.
- Include test evidence.
- State the final QC status.

## Mandatory Agent Behavior

1. Do not stop after discovering errors.
2. Do not stop after fixing the first error.
3. Continue inspecting all applicable QC categories.
4. Repair all safely repairable issues within scope.
5. Re-run tests after each meaningful repair.
6. Never hide failed checks.
7. Never fake successful test results.
8. Never disable tests just to obtain a passing result.
9. Never modify unrelated functionality.
10. Do not declare completion until the final verification phase is finished.

If a check cannot be performed, explain the limitation and identify what is required to complete it.

# 25. CONTINUOUS QUALITY CONTROL

For projects with CI/CD or continuous development, QC should run at appropriate checkpoints.

Recommended triggers:

- Before committing.
- Before creating a pull request.
- On pull request updates.
- Before merging.
- Before deployment.
- After deployment.
- After major dependency changes.
- After database migrations.
- After significant architectural changes.

For continuous monitoring, use scheduled or event-driven checks rather than an uncontrolled infinite repair loop.

Automated repair must operate within an explicitly authorized repository and change scope.

# 26. PROJECT-SPECIFIC EXTENSIONS

This document is universal. Specialized projects should extend it with additional QC rules.

| Project Type     | Additional QC                                                     |
| ---------------- | ----------------------------------------------------------------- |
| Next.js          | Server/client boundaries, caching, SSR, routing                   |
| React            | Component lifecycle, hooks, rendering                             |
| Node.js          | Async operations, streams, event loop                             |
| MCP Server       | Protocol, tools, resources, prompts                               |
| AI Agent         | Tool permissions, prompt injection, output validation             |
| Trading System   | Market data integrity, order validation, risk controls            |
| E-commerce       | Checkout, inventory, payments, refunds                            |
| SaaS             | Tenant isolation, subscriptions, authorization                    |
| Laravel          | Middleware, migrations, queues, policies                          |
| Supabase         | RLS, Auth, database policies, Edge Functions                      |
| Rust             | Ownership, error handling, clippy, unsafe code                    |
| Tauri            | IPC security, command permissions, frontend/backend boundaries    |
| Python           | Type checks, virtual environments, dependency management          |
| Flutter          | Widget tests, navigation, platform compatibility                  |
| Video Processing | FFmpeg, codecs, audio sync, rendering quality                     |
| Server Panel     | Process isolation, permissions, resource limits, service recovery |

Project-specific requirements take precedence where they are more restrictive than this universal baseline.

# 27. FINAL PRINCIPLE

The purpose of QC is not merely to make a project compile.

The purpose is to make the project work correctly, securely, consistently, and reliably.

**Every defect must be investigated. Every repair must be verified. Every unresolved issue must be reported.**

No false success claims. No hidden failures. No unnecessary destructive changes.

---

**END OF UNIVERSAL QC STANDARD**
