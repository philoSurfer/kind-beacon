# Kind Beacon Example CSV Files

This directory contains example CSV files to help you get started with Kind Beacon.

## File Formats

### 1. basic-urls.csv

A simple CSV file with a header row and URLs:

```csv
url
https://example.com
https://www.google.com
https://www.github.com
```

**Usage**:
```bash
kind-beacon audit examples/basic-urls.csv
```

### 2. urls-with-descriptions.csv

CSV file with both URLs and descriptions:

```csv
url,description
https://example.com,Homepage
https://example.com/about,About Page
https://example.com/contact,Contact Page
```

The description column is optional and ignored by Kind Beacon, but useful for documentation.

**Usage**:
```bash
kind-beacon audit examples/urls-with-descriptions.csv --device desktop
```

### 3. plain-list.csv

Plain list of URLs without headers (also valid):

```csv
https://example.com
https://www.google.com
https://www.github.com
https://www.npmjs.com
https://nodejs.org
```

**Usage**:
```bash
kind-beacon audit examples/plain-list.csv --concurrency 5
```

## Creating Your Own CSV Files

### Supported Formats

Kind Beacon automatically detects whether your CSV has headers or is a plain list.

**With Headers**:
- Must include a column named `url`, `URL`, or `link` (case-insensitive)
- Can include other columns (they will be ignored)

**Without Headers**:
- Each line is treated as a URL
- Empty lines are ignored

### URL Requirements

All URLs must:
- Start with `http://` or `https://`
- Be valid, accessible URLs
- Follow standard URL format

### Invalid URLs

URLs that don't meet requirements will be:
- Logged as warnings during processing
- Skipped (won't halt the entire audit)
- Included in the failure count

## Tips

1. **Start Small**: Test with 3-5 URLs first
2. **Check Validity**: Ensure all URLs are accessible before running audits
3. **Organize by Purpose**: Create separate CSV files for different audit targets
   - `homepage-urls.csv` - Main landing pages
   - `product-pages.csv` - E-commerce product pages
   - `blog-posts.csv` - Content pages

## Example Workflows

### Quick Test
```bash
kind-beacon audit examples/basic-urls.csv
```

### Desktop Performance Audit
```bash
kind-beacon audit examples/urls-with-descriptions.csv --device desktop
```

### High-Concurrency Batch
```bash
kind-beacon audit examples/plain-list.csv --concurrency 5 --timeout 90
```

### With Custom Output Directories
```bash
kind-beacon audit examples/basic-urls.csv \
  --data-dir ./my-audits/data \
  --reports-dir ./my-audits/reports
```

## Need Help?

Run `kind-beacon --help` for full documentation.
