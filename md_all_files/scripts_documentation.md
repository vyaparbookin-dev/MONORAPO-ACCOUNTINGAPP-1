# Project Scripts Documentation

This file provides documentation for the various scripts used in this project for tasks like auditing, diagnostics, and maintenance.

---

## `scripts/audit-shared-usage.js`

**Purpose:**

This script audits the monorepo to track the migration of `utils` and `services` from individual apps to the centralized `packages/shared` library. It identifies which files are still using local logic versus the shared package.

**How to Use:**

Run the script from the project root directory:

```bash
node scripts/audit-shared-usage.js
```

**Output:**

The script will generate a report file named `audit-report.txt` in the project root. This report contains a detailed analysis of which files in each app (`backend`, `desktop`, `mobile`, `web`) have been migrated to use `@repo/shared` and which ones still contain local logic.

---

## `scripts/check-shared-imports.js`

**Purpose:**

This is a simple utility to quickly check which files in the `web`, `desktop`, and `mobile` applications are importing code from the `@repo/shared` package. It's a good way to verify that the shared package is being correctly used across the monorepo.

**How to Use:**

```bash
node scripts/check-shared-imports.js
```

**Output:**

The script will print a list of files for each application that contains an import from `@repo/shared`.

---

## `scripts/audit-local-usage.js` (Recommended)

**Purpose:**

This is the most advanced and recommended script for auditing local file usage. It replaces the older `find-usage.js` and `find-service-usage.js` scripts. It intelligently checks for old, local files that should have been migrated to `@repo/shared`.

**Key Features:**
1.  **File Existence Check:** First, it verifies if the local file (e.g., `apps/web/src/utils/currency.jsx`) actually exists.
2.  **Broken Import Detection:** It finds "critical" errors where a file has been deleted, but other files are still trying to import it, which would cause the app to crash.
3.  **Usage Reporting:** It shows exactly which files are still using an old local file.
4.  **Clear Actionable Output:** It uses color-coded statuses to tell you exactly what to do.

**How to Use:**

Run the script from the project root. The list of files to audit is configured inside the script itself.

```bash
node scripts/audit-local-usage.js
```

**Output:**

The script will log a message for each file it's checking. If it finds a file where the target is imported, it will print the path to that file. If no usages are found, it will indicate that the file is likely safe to delete.

---

## `scripts/find-usage.ps1`

**Purpose:**

This is a PowerShell script that performs the same function as `find-usage.js`. It is designed to be run in a PowerShell terminal on Windows. It checks for the usage of a predefined list of files to help determine if they can be safely removed.

**How to Use:**

1.  Open a PowerShell terminal.
2.  Navigate to the project root.
3.  Run the script:

```powershell
./scripts/find-usage.ps1
```

**Output:**

Similar to the Node.js version, it will report where each file is being used or indicate that it's safe to delete.

---

## `scripts-all/check-imports.js`

**Purpose:**

This script is a diagnostic tool specifically for the **mobile app**. It scans for two common problems:

1.  **Broken Imports:** It checks if any `import` or `require` statements point to a file that does not exist.
2.  **Case Mismatches:** It verifies that the case (capitalization) of the imported file path matches the actual file system path, which is a common source of bugs in cross-platform development.

**How to Use:**

```bash
node scripts-all/check-imports.js
```

**Output:**

The script will log any broken links or case mismatches it finds. If no issues are detected, it will confirm that all imports look good.

---

## `scripts-all/find-duplicates.cjs`

**Purpose:**

This script scans the entire project to find files that are identical in content, even if they have different names or are in different locations. It does this by creating a hash of each file's content and grouping files with the same hash.

**How to Use:**

```bash
node scripts-all/find-duplicates.cjs
```

**Output:**

It will print sets of files that are duplicates of each other. This is useful for reducing code redundancy.

---

## `scripts-all/generate-full-tree.cjs` & `scripts-all/generate-tree.cjs`

**Purpose:**

These scripts generate a text-based representation of the project's directory structure. This is useful for getting a high-level overview of the project's layout.

*   `generate-full-tree.cjs`: Creates a more comprehensive tree, saved to `full_structure_tree.txt`.
*   `generate-tree.cjs`: Creates a tree while ignoring more temporary/build folders, saved to `project-tree.txt`.

**How to Use:**

```bash
# For the full tree
node scripts-all/generate-full-tree.cjs

# For the standard tree
node scripts-all/generate-tree.cjs
```

**Output:**

A `.txt` file containing the directory tree will be created in the project root.

---

## `scripts-all/run-diagnostics.js`

**Purpose:**

This is a wrapper script that executes a sequence of other diagnostic scripts. It can be configured to run diagnostics for specific applications (`web`, `desktop`, `mobile`).

**How to Use:**

You can edit the `targetApps` array in the script to select which apps to scan.

```bash
node scripts-all/run-diagnostics.js
```

**Output:**

This script will run the configured diagnostic scripts and log their output to the console.

---

## `scripts-all/scan-project.cjs`

**Purpose:**

This script scans the project for two types of potential issues:

1.  **Unused Imports:** It checks for variables that are imported into a file but never used.
2.  **Potentially Unused Files:** It identifies files that are not imported by any other file, making them candidates for deletion.

**How to Use:**

```bash
node scripts-all/scan-project.cjs
```

**Output:**

The script will log any unused imports it finds and then provide a list of files that appear to be unused.

---

## `scripts-all/show-ip.js`

**Purpose:**

A simple utility script that displays the local IPv4 addresses of your machine. This is very useful during mobile app development when you need to connect the mobile app to a locally running backend server.

**How to Use:**

```bash
node scripts-all/show-ip.js
```

**Output:**

It will print a list of your local IP addresses and a message reminding you to use one of them in the mobile app's configuration.
