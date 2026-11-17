# dsh-ask-grow 🍅

[English](README.md) | [简体中文](README.zh-CN.md)

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

A **parenting archive** plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`): one plain-Markdown archive per child, from pregnancy to age 3.

Open the **问问** tab in the right sidebar, or the **问问** entry in the left rail. The plugin keeps daily care, milk and meals, sleep, growth, vaccines, checkups, milestones, assessment notes and expenses in files you can read, back up and edit. Charts and summaries are read-only projections of those files — there is no separate database.

*Unofficial project: independently developed and maintained by a community member, not an official DeepSeek product.*

## Screenshot

![Ask & Grow archive and dashboard](docs/preview.svg)

## Features

- **One archive per child** — pregnancy and 0–3 children each get their own workspace directory.
- **Readable source data** — every record is a Markdown table; no proprietary store.
- **Dashboard** — recent updates, key metrics, daily care, growth curve, vaccines, checkups, milestones, supplements, assessment and expenses.
- **Charts from files** — milk, water, diaper, sleep, growth, nutrition, expense and pregnancy charts read the same files the dashboard reads.
- **Proposal-only carry-over** — if today has no record, yesterday's data is offered as a suggestion; nothing is written until you confirm.
- **Settings in the plugin entry** — workspace, children, privacy and region live in this plugin's Plugin Manager configuration, not an internal settings page.
- **Light and dark** — follows the DSH theme; the plugin UI is currently Chinese, with the language layer ready for future localization.

## Install

```bash
dsh plugin --profile web add "github:a903067276-rgb/dsh-ask-grow#main"
```

Restart DSH if your host requires a restart after installing a bundle.

## Requirements

- DSH `0.2.2-rc.3` verified; compatibility is declared in `package.json`.
- Node.js 22.19+.
- The plugin has no separate server, model or database; it uses DSH sessions, workspace and tools.

## Data and privacy

- Archive data stays in the workspace you configure, under `child-doc/<child>/docs/`.
- The plugin does not send archive data to a third-party service.
- Do not put ID numbers, phone numbers, addresses or full hospital reports into records; the plugin applies a privacy scan before writes.
- Charts and estimates are for recording and reference, not diagnosis, treatment or medical advice.

## Settings

Use **Plugin Manager → this plugin's entry**:

- workspace root
- children and pregnancy profiles
- country / city / privacy mode
- developer mode (off by default)

Changing settings in the plugin entry is the supported path; the plugin does not add a second settings page.

## Scope

This release is the parenting archive and dashboard. It is not a parenting encyclopedia, a diagnosis tool, or a replacement for a pediatrician.

## License

MIT. See [LICENSE](LICENSE).
