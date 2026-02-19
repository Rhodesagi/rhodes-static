#!/usr/bin/env python3
"""
Rhodes Email CLI - Multi-provider email using App Passwords

Send and receive emails via SMTP/IMAP for local Rhodes sessions.
Supports Gmail, Yahoo, Outlook, and custom IMAP/SMTP servers.
Uses App Passwords (not OAuth) for simple authentication.

Setup:
1. Enable 2FA on your email account
2. Generate App Password
3. Run: rhodes-email config --provider gmail
   or:  rhodes-email config --provider yahoo

Usage:
  rhodes-email config [--provider P]       # Configure email credentials
  rhodes-email send <to> <subject>         # Send email (body from stdin or -m)
  rhodes-email check                       # Check inbox for new emails
  rhodes-email watch                       # Watch inbox and process emails
  rhodes-email list [--unread]             # List recent emails
  rhodes-email read <id>                   # Read specific email
  rhodes-email accounts                    # List configured accounts
"""

import argparse
import email
import imaplib
import json
import os
import smtplib
import sys
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from pathlib import Path
from typing import Optional, List, Dict, Any

# Config location
CONFIG_DIR = Path.home() / ".config" / "rhodes-email"
CONFIG_FILE = CONFIG_DIR / "config.json"
PROCESSED_FILE = CONFIG_DIR / "processed.json"

# Provider settings
PROVIDERS = {
    "gmail": {
        "name": "Gmail",
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "imap_server": "imap.gmail.com",
        "imap_port": 993,
        "app_password_url": "https://myaccount.google.com/apppasswords",
    },
    "yahoo": {
        "name": "Yahoo Mail",
        "smtp_server": "smtp.mail.yahoo.com",
        "smtp_port": 587,
        "imap_server": "imap.mail.yahoo.com",
        "imap_port": 993,
        "app_password_url": "https://login.yahoo.com/account/security/app-passwords",
    },
    "outlook": {
        "name": "Outlook/Hotmail",
        "smtp_server": "smtp-mail.outlook.com",
        "smtp_port": 587,
        "imap_server": "outlook.office365.com",
        "imap_port": 993,
        "app_password_url": "https://account.microsoft.com/security",
    },
    "icloud": {
        "name": "iCloud Mail",
        "smtp_server": "smtp.mail.me.com",
        "smtp_port": 587,
        "imap_server": "imap.mail.me.com",
        "imap_port": 993,
        "app_password_url": "https://appleid.apple.com/account/manage",
    },
}


def load_config() -> Dict[str, Any]:
    """Load configuration from file."""
    if not CONFIG_FILE.exists():
        return {"accounts": {}, "default": None}
    with open(CONFIG_FILE) as f:
        config = json.load(f)
    # Migration from old format
    if "accounts" not in config:
        if "email" in config:
            # Old single-account format
            old_email = config.get("email", "")
            provider = "gmail"
            if "yahoo" in old_email.lower():
                provider = "yahoo"
            elif "outlook" in old_email.lower() or "hotmail" in old_email.lower():
                provider = "outlook"

            new_config = {
                "accounts": {
                    old_email: {
                        "email": old_email,
                        "app_password": config.get("app_password", ""),
                        "from_name": config.get("from_name", "Rhodes"),
                        "provider": provider,
                    }
                },
                "default": old_email,
            }
            save_config(new_config)
            return new_config
        return {"accounts": {}, "default": None}
    return config


def save_config(config: Dict[str, Any]):
    """Save configuration to file."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    os.chmod(CONFIG_FILE, 0o600)  # Restrict permissions


def load_processed(account: str = None) -> set:
    """Load set of processed email IDs."""
    proc_file = PROCESSED_FILE
    if account:
        proc_file = CONFIG_DIR / f"processed_{account.replace('@', '_at_')}.json"
    if not proc_file.exists():
        return set()
    with open(proc_file) as f:
        return set(json.load(f))


def save_processed(processed: set, account: str = None):
    """Save processed email IDs."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    proc_file = PROCESSED_FILE
    if account:
        proc_file = CONFIG_DIR / f"processed_{account.replace('@', '_at_')}.json"
    with open(proc_file, "w") as f:
        json.dump(list(processed), f)


def decode_mime_header(header: str) -> str:
    """Decode MIME encoded header."""
    if not header:
        return ""
    decoded_parts = decode_header(header)
    result = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result.append(part.decode(encoding or "utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)


def get_email_body(msg) -> str:
    """Extract plain text body from email message."""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
        # Fallback to HTML if no plain text
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    # Basic HTML to text (strip tags)
                    import re
                    text = payload.decode(charset, errors="replace")
                    text = re.sub(r"<[^>]+>", "", text)
                    return text
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
    return ""


class RhodesEmail:
    """Multi-provider email client for Rhodes."""

    def __init__(self, account: str = None):
        config = load_config()

        # Determine which account to use
        if account:
            if account not in config.get("accounts", {}):
                raise ValueError(f"Account '{account}' not configured. Run: rhodes-email config")
            self.account_key = account
        else:
            self.account_key = config.get("default")
            if not self.account_key:
                if config.get("accounts"):
                    # Use first available account
                    self.account_key = list(config["accounts"].keys())[0]
                else:
                    raise ValueError("No email configured. Run: rhodes-email config")

        acc = config["accounts"][self.account_key]
        self.email = acc["email"]
        self.password = acc["app_password"]
        self.from_name = acc.get("from_name", "Rhodes")
        self.provider = acc.get("provider", "gmail")

        # Get server settings
        if self.provider in PROVIDERS:
            prov = PROVIDERS[self.provider]
            self.smtp_server = acc.get("smtp_server", prov["smtp_server"])
            self.smtp_port = acc.get("smtp_port", prov["smtp_port"])
            self.imap_server = acc.get("imap_server", prov["imap_server"])
            self.imap_port = acc.get("imap_port", prov["imap_port"])
        else:
            # Custom provider
            self.smtp_server = acc["smtp_server"]
            self.smtp_port = acc["smtp_port"]
            self.imap_server = acc["imap_server"]
            self.imap_port = acc["imap_port"]

    def send(self, to: str, subject: str, body: str, html: bool = False) -> bool:
        """Send an email via SMTP."""
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.email}>"
            msg["To"] = to
            msg["Subject"] = subject

            if html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)

            print(f"✓ Email sent to {to} (from {self.email})")
            return True

        except Exception as e:
            print(f"✗ Failed to send email: {e}", file=sys.stderr)
            return False

    def connect_imap(self) -> imaplib.IMAP4_SSL:
        """Connect to IMAP server."""
        imap = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
        imap.login(self.email, self.password)
        return imap

    def list_emails(self, folder: str = "INBOX", unread_only: bool = False,
                    limit: int = 10) -> List[Dict[str, Any]]:
        """List emails from inbox."""
        emails = []
        try:
            imap = self.connect_imap()
            imap.select(folder)

            criteria = "UNSEEN" if unread_only else "ALL"
            _, message_numbers = imap.search(None, criteria)

            msg_nums = message_numbers[0].split()
            # Get most recent emails
            msg_nums = msg_nums[-limit:] if len(msg_nums) > limit else msg_nums
            msg_nums = reversed(msg_nums)  # Newest first

            for num in msg_nums:
                _, msg_data = imap.fetch(num, "(RFC822)")
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                emails.append({
                    "id": num.decode(),
                    "from": decode_mime_header(msg.get("From", "")),
                    "to": decode_mime_header(msg.get("To", "")),
                    "subject": decode_mime_header(msg.get("Subject", "")),
                    "date": msg.get("Date", ""),
                    "message_id": msg.get("Message-ID", ""),
                })

            imap.close()
            imap.logout()

        except Exception as e:
            print(f"✗ Failed to list emails: {e}", file=sys.stderr)

        return emails

    def read_email(self, email_id: str, folder: str = "INBOX",
                   mark_read: bool = True) -> Optional[Dict[str, Any]]:
        """Read a specific email by ID."""
        try:
            imap = self.connect_imap()
            imap.select(folder)

            _, msg_data = imap.fetch(email_id.encode(), "(RFC822)")
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            result = {
                "id": email_id,
                "from": decode_mime_header(msg.get("From", "")),
                "to": decode_mime_header(msg.get("To", "")),
                "subject": decode_mime_header(msg.get("Subject", "")),
                "date": msg.get("Date", ""),
                "message_id": msg.get("Message-ID", ""),
                "in_reply_to": msg.get("In-Reply-To", ""),
                "references": msg.get("References", ""),
                "body": get_email_body(msg),
            }

            if mark_read:
                imap.store(email_id.encode(), "+FLAGS", "\\Seen")

            imap.close()
            imap.logout()
            return result

        except Exception as e:
            print(f"✗ Failed to read email: {e}", file=sys.stderr)
            return None

    def check_new(self, folder: str = "INBOX") -> List[Dict[str, Any]]:
        """Check for new unread emails."""
        processed = load_processed(self.email)
        new_emails = []

        try:
            imap = self.connect_imap()
            imap.select(folder)

            _, message_numbers = imap.search(None, "UNSEEN")

            for num in message_numbers[0].split():
                if not num:
                    continue

                email_id = num.decode()
                if email_id in processed:
                    continue

                _, msg_data = imap.fetch(num, "(RFC822)")
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                new_emails.append({
                    "id": email_id,
                    "from": decode_mime_header(msg.get("From", "")),
                    "to": decode_mime_header(msg.get("To", "")),
                    "subject": decode_mime_header(msg.get("Subject", "")),
                    "date": msg.get("Date", ""),
                    "message_id": msg.get("Message-ID", ""),
                    "in_reply_to": msg.get("In-Reply-To", ""),
                    "body": get_email_body(msg),
                })

            imap.close()
            imap.logout()

        except Exception as e:
            print(f"✗ Failed to check emails: {e}", file=sys.stderr)

        return new_emails

    def mark_processed(self, email_id: str):
        """Mark an email as processed."""
        processed = load_processed(self.email)
        processed.add(email_id)
        save_processed(processed, self.email)


def cmd_config(args):
    """Configure email credentials."""
    config = load_config()

    provider = args.provider or "gmail"

    if provider not in PROVIDERS and provider != "custom":
        print(f"Unknown provider: {provider}", file=sys.stderr)
        print(f"Available: {', '.join(PROVIDERS.keys())}, custom")
        return 1

    print("Rhodes Email Configuration")
    print("-" * 40)

    if provider in PROVIDERS:
        prov = PROVIDERS[provider]
        print(f"Provider: {prov['name']}")
        print(f"App Password URL: {prov['app_password_url']}")
    else:
        print("Provider: Custom IMAP/SMTP")
    print()

    email_addr = input("Email address: ").strip()
    if not email_addr:
        print("Email address required.", file=sys.stderr)
        return 1

    print("Enter App Password (will not echo): ", end="", flush=True)
    import getpass
    app_password = getpass.getpass("")

    if not app_password:
        print("App password required.", file=sys.stderr)
        return 1

    # Remove spaces from app password (some providers show it with spaces)
    app_password = app_password.replace(" ", "")

    from_name = input("From name [Rhodes]: ").strip() or "Rhodes"

    # Custom server settings
    if provider == "custom":
        smtp_server = input("SMTP server: ").strip()
        smtp_port = int(input("SMTP port [587]: ").strip() or "587")
        imap_server = input("IMAP server: ").strip()
        imap_port = int(input("IMAP port [993]: ").strip() or "993")
    else:
        prov = PROVIDERS[provider]
        smtp_server = prov["smtp_server"]
        smtp_port = prov["smtp_port"]
        imap_server = prov["imap_server"]
        imap_port = prov["imap_port"]

    # Test connection
    print("\nTesting connection...")
    try:
        # Test IMAP
        imap = imaplib.IMAP4_SSL(imap_server, imap_port)
        imap.login(email_addr, app_password)
        imap.logout()
        print("✓ IMAP connection successful")

        # Test SMTP
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_addr, app_password)
        print("✓ SMTP connection successful")

    except Exception as e:
        print(f"✗ Connection failed: {e}", file=sys.stderr)
        return 1

    # Save config
    account_config = {
        "email": email_addr,
        "app_password": app_password,
        "from_name": from_name,
        "provider": provider,
    }
    if provider == "custom":
        account_config.update({
            "smtp_server": smtp_server,
            "smtp_port": smtp_port,
            "imap_server": imap_server,
            "imap_port": imap_port,
        })

    config["accounts"][email_addr] = account_config

    # Set as default if first account or explicitly requested
    if not config.get("default") or args.default:
        config["default"] = email_addr

    save_config(config)

    print(f"\n✓ Account '{email_addr}' configured")
    if config["default"] == email_addr:
        print(f"✓ Set as default account")
    print(f"✓ Configuration saved to {CONFIG_FILE}")
    return 0


def cmd_accounts(args):
    """List configured accounts."""
    config = load_config()
    accounts = config.get("accounts", {})
    default = config.get("default")

    if not accounts:
        print("No accounts configured. Run: rhodes-email config")
        return 0

    print("Configured accounts:")
    print("-" * 50)
    for email_addr, acc in accounts.items():
        marker = "→" if email_addr == default else " "
        provider = acc.get("provider", "unknown")
        print(f"{marker} {email_addr} ({provider})")

    print()
    print(f"Default: {default}")
    print("\nUse --account <email> to specify account, or")
    print("rhodes-email config --provider <p> --default to change default")
    return 0


def cmd_send(args):
    """Send an email."""
    try:
        client = RhodesEmail(args.account)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 1

    # Get body from -m flag or stdin
    if args.message:
        body = args.message
    elif not sys.stdin.isatty():
        body = sys.stdin.read()
    else:
        print("Enter message (Ctrl+D to finish):")
        body = sys.stdin.read()

    if not body.strip():
        print("Empty message body.", file=sys.stderr)
        return 1

    success = client.send(args.to, args.subject, body, html=args.html)
    return 0 if success else 1


def cmd_list(args):
    """List emails."""
    try:
        client = RhodesEmail(args.account)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 1

    print(f"[{client.email}]")
    emails = client.list_emails(unread_only=args.unread, limit=args.limit)

    if not emails:
        print("No emails found.")
        return 0

    if args.json:
        print(json.dumps(emails, indent=2))
    else:
        for e in emails:
            status = "•" if args.unread else " "
            print(f"{status} [{e['id']:>5}] {e['date'][:22]}")
            print(f"         From: {e['from'][:50]}")
            print(f"         Subject: {e['subject'][:50]}")
            print()

    return 0


def cmd_read(args):
    """Read a specific email."""
    try:
        client = RhodesEmail(args.account)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 1

    email_data = client.read_email(args.id, mark_read=not args.peek)

    if not email_data:
        return 1

    if args.json:
        print(json.dumps(email_data, indent=2))
    else:
        print(f"From: {email_data['from']}")
        print(f"To: {email_data['to']}")
        print(f"Subject: {email_data['subject']}")
        print(f"Date: {email_data['date']}")
        print("-" * 60)
        print(email_data['body'])

    return 0


def cmd_check(args):
    """Check for new emails."""
    try:
        client = RhodesEmail(args.account)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 1

    print(f"[{client.email}]")
    new_emails = client.check_new()

    if not new_emails:
        print("No new emails.")
        return 0

    print(f"Found {len(new_emails)} new email(s):")

    if args.json:
        print(json.dumps(new_emails, indent=2))
    else:
        for e in new_emails:
            print(f"\n[{e['id']}] From: {e['from']}")
            print(f"    Subject: {e['subject']}")
            print(f"    Preview: {e['body'][:100]}...")

    if args.mark:
        for e in new_emails:
            client.mark_processed(e['id'])
        print(f"\n✓ Marked {len(new_emails)} email(s) as processed")

    return 0


def cmd_watch(args):
    """Watch for new emails and optionally process them."""
    try:
        client = RhodesEmail(args.account)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 1

    print(f"Watching {client.email} (checking every {args.interval}s)...")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            new_emails = client.check_new()

            for e in new_emails:
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"[{timestamp}] New email from {e['from']}")
                print(f"           Subject: {e['subject']}")

                if args.json:
                    print(json.dumps(e, indent=2))

                # If callback script specified, run it
                if args.callback:
                    import subprocess
                    env = os.environ.copy()
                    env["RHODES_EMAIL_ID"] = e["id"]
                    env["RHODES_EMAIL_FROM"] = e["from"]
                    env["RHODES_EMAIL_SUBJECT"] = e["subject"]
                    env["RHODES_EMAIL_BODY"] = e["body"]
                    env["RHODES_EMAIL_ACCOUNT"] = client.email

                    try:
                        result = subprocess.run(
                            args.callback,
                            shell=True,
                            env=env,
                            capture_output=True,
                            text=True
                        )
                        if result.returncode == 0:
                            print(f"           ✓ Callback executed")
                        else:
                            print(f"           ✗ Callback failed: {result.stderr}")
                    except Exception as ex:
                        print(f"           ✗ Callback error: {ex}")

                client.mark_processed(e["id"])
                print()

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nStopped watching.")

    return 0


def cmd_reply(args):
    """Reply to an email."""
    try:
        client = RhodesEmail(args.account)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 1

    # Get original email
    original = client.read_email(args.id, mark_read=True)
    if not original:
        return 1

    # Extract sender email
    from_addr = original["from"]
    if "<" in from_addr:
        import re
        match = re.search(r"<([^>]+)>", from_addr)
        if match:
            from_addr = match.group(1)

    # Get reply body
    if args.message:
        body = args.message
    elif not sys.stdin.isatty():
        body = sys.stdin.read()
    else:
        print("Enter reply (Ctrl+D to finish):")
        body = sys.stdin.read()

    # Format subject
    subject = original["subject"]
    if not subject.lower().startswith("re:"):
        subject = f"Re: {subject}"

    success = client.send(from_addr, subject, body)
    return 0 if success else 1


def cmd_default(args):
    """Set default account."""
    config = load_config()

    if args.email not in config.get("accounts", {}):
        print(f"Account '{args.email}' not configured.", file=sys.stderr)
        return 1

    config["default"] = args.email
    save_config(config)
    print(f"✓ Default account set to {args.email}")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Rhodes Email CLI - Multi-provider email using App Passwords"
    )
    parser.add_argument("--account", "-a", help="Account to use (email address)")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # config
    sub = subparsers.add_parser("config", help="Configure email credentials")
    sub.add_argument("--provider", "-p", default="gmail",
                     help="Provider: gmail, yahoo, outlook, icloud, custom")
    sub.add_argument("--default", "-d", action="store_true",
                     help="Set as default account")
    sub.set_defaults(func=cmd_config)

    # accounts
    sub = subparsers.add_parser("accounts", help="List configured accounts")
    sub.set_defaults(func=cmd_accounts)

    # default
    sub = subparsers.add_parser("default", help="Set default account")
    sub.add_argument("email", help="Email address to set as default")
    sub.set_defaults(func=cmd_default)

    # send
    sub = subparsers.add_parser("send", help="Send an email")
    sub.add_argument("to", help="Recipient email address")
    sub.add_argument("subject", help="Email subject")
    sub.add_argument("-m", "--message", help="Message body (or use stdin)")
    sub.add_argument("--html", action="store_true", help="Send as HTML")
    sub.add_argument("--account", "-a", help="Account to use")
    sub.set_defaults(func=cmd_send)

    # list
    sub = subparsers.add_parser("list", help="List recent emails")
    sub.add_argument("--unread", action="store_true", help="Only show unread")
    sub.add_argument("--limit", type=int, default=10, help="Number of emails")
    sub.add_argument("--json", action="store_true", help="Output as JSON")
    sub.add_argument("--account", "-a", help="Account to use")
    sub.set_defaults(func=cmd_list)

    # read
    sub = subparsers.add_parser("read", help="Read a specific email")
    sub.add_argument("id", help="Email ID")
    sub.add_argument("--peek", action="store_true", help="Don't mark as read")
    sub.add_argument("--json", action="store_true", help="Output as JSON")
    sub.add_argument("--account", "-a", help="Account to use")
    sub.set_defaults(func=cmd_read)

    # check
    sub = subparsers.add_parser("check", help="Check for new unread emails")
    sub.add_argument("--json", action="store_true", help="Output as JSON")
    sub.add_argument("--mark", action="store_true", help="Mark as processed")
    sub.add_argument("--account", "-a", help="Account to use")
    sub.set_defaults(func=cmd_check)

    # watch
    sub = subparsers.add_parser("watch", help="Watch inbox for new emails")
    sub.add_argument("--interval", type=int, default=30, help="Check interval (seconds)")
    sub.add_argument("--callback", help="Script to run for each new email")
    sub.add_argument("--json", action="store_true", help="Output email as JSON")
    sub.add_argument("--account", "-a", help="Account to use")
    sub.set_defaults(func=cmd_watch)

    # reply
    sub = subparsers.add_parser("reply", help="Reply to an email")
    sub.add_argument("id", help="Email ID to reply to")
    sub.add_argument("-m", "--message", help="Reply body (or use stdin)")
    sub.add_argument("--account", "-a", help="Account to use")
    sub.set_defaults(func=cmd_reply)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
