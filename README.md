# learncn.fun

Tiny Chinese practice apps (React + TypeScript + Tailwind), built as static HTML/CSS/JS.

## Apps

- Read: multiple-choice character quiz (English or Pinyin answers)
- Write: guided stroke-order practice (HanziWriter)

## License

Apache-2.0 (see `LICENSE`).

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys `dist/` to GitHub Pages on pushes to `main`.

In GitHub:

1. Repo Settings → Pages
2. Set Source to **GitHub Actions**

Custom domain is configured via `public/CNAME`.
