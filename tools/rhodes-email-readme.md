# Rhodes Email CLI

Multi-provider email client using App Passwords (IMAP/SMTP).

## Quick Start

```bash
# Add to path (already done)
ln -sf /home/priv/gpt/rhodes-email-cli/rhodes_email.py ~/bin/rhodes-email

# Configure an account
rhodes-email config --provider gmail    # or yahoo, outlook, icloud
```

## Supported Providers

### Gmail
```bash
rhodes-email config --provider gmail
```
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → "Other" → name it "Rhodes"

### Yahoo
```bash
rhodes-email config --provider yahoo
```
1. Enable 2FA: https://login.yahoo.com/account/security
2. Generate App Password: https://login.yahoo.com/account/security/app-passwords
3. Select "Other App" → name it "Rhodes"

### Outlook / Hotmail
```bash
rhodes-email config --provider outlook
```
1. Enable 2FA: https://account.microsoft.com/security
2. Generate App Password: https://account.microsoft.com/security → "Advanced security options" → "App passwords"

### iCloud
```bash
rhodes-email config --provider icloud
```
1. Enable 2FA on Apple ID
2. Generate App Password: https://appleid.apple.com/account/manage → "App-Specific Passwords"

### Custom IMAP/SMTP
```bash
rhodes-email config --provider custom
```
Enter your own IMAP/SMTP server details.

## Commands

```bash
# Account management
rhodes-email accounts                    # List configured accounts
rhodes-email config --provider <p>       # Add new account
rhodes-email default <email>             # Set default account

# Reading emails
rhodes-email list                        # List recent emails
rhodes-email list --unread --limit 20    # List 20 unread emails
rhodes-email read <id>                   # Read specific email
rhodes-email check                       # Check for new emails

# Sending emails
rhodes-email send <to> <subject> -m "body"
echo "body" | rhodes-email send <to> <subject>

# Reply to email
rhodes-email reply <id> -m "reply body"

# Watch for new emails
rhodes-email watch --interval 60         # Check every 60s
rhodes-email watch --callback "echo \$RHODES_EMAIL_FROM"
```

## Multi-Account Usage

```bash
# Use specific account
rhodes-email list --account user@yahoo.com
rhodes-email send --account user@outlook.com to@example.com "Subject" -m "Body"

# Change default
rhodes-email default user@yahoo.com
```

## Environment Variables (for callbacks)

When using `--callback`, these are available:
- `RHODES_EMAIL_ID` - Email ID
- `RHODES_EMAIL_FROM` - Sender address
- `RHODES_EMAIL_SUBJECT` - Subject line
- `RHODES_EMAIL_BODY` - Email body text
- `RHODES_EMAIL_ACCOUNT` - Account that received it

## Config Location

Credentials stored in: `~/.config/rhodes-email/config.json` (chmod 600)
