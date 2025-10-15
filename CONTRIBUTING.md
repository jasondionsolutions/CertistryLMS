# 🤝 Contributing to Hackme Boilerplate

Thanks for your interest in improving this project! The goal of this boilerplate is to remain **simple, fast, and production-focused** — no bloat, no unnecessary complexity.

Please follow the simple principles below:

---

## 🧠 Philosophy

- ✅ Only include what is essential for a great developer experience.
- ❌ No monorepo tooling, docker configs, or unnecessary abstractions.
- ✅ Prioritize clarity, readability, and minimal setup.
- ✅ Keep it approachable for both beginners and pros.

---

## 🛠 What You Can Do

- Fix bugs, typos, or cleanup
- Suggest minimal improvements (e.g. utilities, config presets)
- Add missing documentation
- Improve accessibility, error handling, or edge cases

---

## 🧪 Local Setup

```bash
yarn install
yarn dev
```

To run tests:

```bash
yarn test
```

To run linting and formatting:

```bash
yarn lint
yarn typecheck
```

---

## 🧼 Conventions

- Use Tailwind utility classes when possible
- Prefer native HTML where it works well
- Keep things server-first (RSC + server actions)
- Use TypeScript strictly
- Follow existing structure: `app/`, `lib/actions/`, `components/ui/`, `tests/`

---

## 💡 Not Allowed

- No additional state libraries (Zustand, Jotai, Redux, etc.)
- No large design systems or frameworks
- No full-stack adapters (Prisma, tRPC, etc.)
- No CI/CD scripts or external integrations

> This is **not a kitchen sink** — it’s a clean base.

---

## 🔐 License

This project is licensed under MIT. By contributing, you agree to license your contributions under the same terms.
