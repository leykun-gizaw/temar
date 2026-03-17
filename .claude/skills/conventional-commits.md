---
name: conventional-commits
description: Generates git commit messages adhering to the Conventional Commits v1.0.0 specification. Use when staging changes, committing code, or when asked to write a commit message.
---

## Objective

Generate git commit messages that strictly adhere to the Conventional Commits v1.0.0 specification, using designated emojis for each commit type. A detailed body explaining the changes MUST always be included.

## Commit Strategy (Logical Chunking)

If analyzing the diff reveals a large or overwhelming number of changes across multiple files, **do not generate a single monolithic commit**. Instead, proactively and logically break down the changes into smaller, cohesive units (e.g., separate backend API changes from UI updates, or refactoring from new features).

## Specification Rules

1. **Structure:** `<type>[optional scope]: <emoji> <description>`
   `<BLANK LINE>`
   `<body>`
   `<BLANK LINE>`
   `[optional footer(s)]`
2. **Description (Header):** Must be imperative, present tense (e.g., "add" not "added" or "adds"). Do not capitalize the first letter. Do not end with a period. Keep it concise (under 50 characters).
3. **Body (MANDATORY):** You must provide a descriptive body after a single blank line following the header.
   - Explain the _what_ and _why_ of the change (motivation, context, and contrast with previous behavior).
   - **Formatting:** If the commit encompasses multiple modifications, use bullet points (`-`) to break them down clearly. Wrap text at 72 characters to maintain readability in terminal logs.
4. **Scope:** Optional. Must be a noun describing the section of the codebase affected, enclosed in parentheses.
5. **Breaking Changes:** Indicated by an exclamation mark before the colon and/or a `BREAKING CHANGE:` footer.

## Emoji Mapping

Use exactly these emojis mapped to the standard Angular/Conventional Commit types:

- `feat`: ✨ (New feature)
- `fix`: 🐛 (Bug fix)
- `docs`: 📝 (Documentation only changes)
- `style`: 💄 (Changes that do not affect the meaning of the code - white-space, formatting, missing semi-colons, etc.)
- `refactor`: ♻️ (A code change that neither fixes a bug nor adds a feature)
- `perf`: ⚡️ (A code change that improves performance)
- `test`: ✅ (Adding missing tests or correcting existing tests)
- `build`: 🏗️ (Changes that affect the build system or external dependencies)
- `ci`: 👷 (Changes to our CI configuration files and scripts)
- `chore`: 🧹 (Other changes that don't modify src or test files)
- `revert`: ⏪️ (Reverts a previous commit)

## Output Constraints

1. Run `git diff --cached` (or `git diff` if nothing is staged) to analyze the changes.
2. **For a Single Commit:** If the changes are small and cohesive, output ONLY the raw commit message.
3. **For Multiple Commits (Chunked):** If breaking down a large diff, output the required `git add <file/path>` command(s) followed immediately by the raw commit message for that specific logical group. Repeat this format for each group.
4. Do not provide extra explanations, conversational filler, or markdown code blocks around the final commit messages.
