# Vitek Fitness Content Manager Dashboard

A Wix app dashboard for managing website content. This tool provides a centralised interface to edit text, packages, legal content, and FAQs across the Vitek Fitness website.

## Features

- **Text Content Editor** - Manage text content for Home and About Me pages
- **Packages Editor** - Edit pricing packages with sortable tables and inline editing
- **Legal Editor** - Update legal page content (Terms, Privacy Policy, etc.)
- **FAQ Editor** - Add, edit, and delete FAQ items with topic categorisation

## Tech Stack

- React with TypeScript
- [Wix Design System](https://www.wixdesignsystem.com/)
- [Wix CLI for Apps](https://dev.wix.com/docs/build-apps/developer-tools/cli/get-started/about-the-wix-cli-for-apps)
- Wix Data Collections

## Project Structure

```
src/
├── components/          # Reusable editor components
│   ├── FAQEditor.tsx
│   ├── LegalEditor.tsx
│   ├── PackagesEditor.tsx
│   ├── SaveConfirmation.tsx
│   └── TextContentEditor.tsx
├── dashboard/
│   ├── modals/          # Modal dialogs for editing
│   │   ├── add-faq/
│   │   ├── delete-confirmation/
│   │   ├── edit-description/
│   │   ├── edit-faq/
│   │   ├── edit-pricing/
│   │   ├── save-confirmation/
│   │   └── upload-image/
│   └── pages/           # Main dashboard page
├── types.ts             # TypeScript type definitions
└── utils/               # Utility functions
```

## Setup

Install dependencies:

```console
npm install
```

## Development

Run the development server:

```console
npm run dev
```

## Licence

This project is proprietary software for Vitek Fitness.
