#!/usr/bin/env python3
"""
Expense Tracker CLI
Track daily expenses with categories and generate monthly reports.
"""

import sqlite3
import argparse
from datetime import datetime
from pathlib import Path
import sys

DB_PATH = Path(__file__).parent / "expenses.db"


def init_db():
    """Initialize SQLite database with expenses table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_date ON expenses(date)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_category ON expenses(category)
    """)
    conn.commit()
    conn.close()


def add_expense(date, category, amount, description=""):
    """Add a new expense entry."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO expenses (date, category, amount, description)
        VALUES (?, ?, ?, ?)
    """, (date, category, amount, description))
    conn.commit()
    expense_id = cursor.lastrowid
    conn.close()
    return expense_id


def list_expenses(limit=50, category=None, date_from=None, date_to=None):
    """List expenses with optional filters."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    query = "SELECT id, date, category, amount, description FROM expenses WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if date_from:
        query += " AND date >= ?"
        params.append(date_from)
    if date_to:
        query += " AND date <= ?"
        params.append(date_to)
    
    query += " ORDER BY date DESC, id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_monthly_report(year_month):
    """Get spending report for a specific month (YYYY-MM format)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total by category
    cursor.execute("""
        SELECT category, SUM(amount), COUNT(*)
        FROM expenses
        WHERE date LIKE ?
        GROUP BY category
        ORDER BY SUM(amount) DESC
    """, (f"{year_month}%",))
    by_category = cursor.fetchall()
    
    # Grand total
    cursor.execute("""
        SELECT SUM(amount), COUNT(*)
        FROM expenses
        WHERE date LIKE ?
    """, (f"{year_month}%",))
    total = cursor.fetchone()
    
    # All transactions for the month
    cursor.execute("""
        SELECT date, category, amount, description
        FROM expenses
        WHERE date LIKE ?
        ORDER BY date DESC
    """, (f"{year_month}%",))
    transactions = cursor.fetchall()
    
    conn.close()
    return by_category, total, transactions


def cmd_add(args):
    """Handle add command."""
    # Validate date format
    try:
        datetime.strptime(args.date, "%Y-%m-%d")
    except ValueError:
        print(f"❌ Invalid date format: {args.date}")
        print("   Use YYYY-MM-DD (e.g., 2026-04-22)")
        return 1
    
    # Validate amount
    if args.amount <= 0:
        print("❌ Amount must be positive")
        return 1
    
    expense_id = add_expense(args.date, args.category, args.amount, args.description)
    print(f"✅ Expense added (ID: {expense_id})")
    print(f"   {args.date} | {args.category} | ${args.amount:.2f}")
    if args.description:
        print(f"   Note: {args.description}")
    return 0


def cmd_list(args):
    """Handle list command."""
    expenses = list_expenses(
        limit=args.limit,
        category=args.category,
        date_from=args.from_date,
        date_to=args.to_date
    )
    
    if not expenses:
        print("📭 No expenses found")
        return 0
    
    print(f"\n📋 Last {len(expenses)} expense(s):\n")
    print(f"{'ID':<6} {'Date':<12} {'Category':<15} {'Amount':>10} {'Description'}")
    print("-" * 70)
    
    for exp in expenses:
        exp_id, date, category, amount, desc = exp
        desc_short = desc[:25] if desc else ""
        print(f"{exp_id:<6} {date:<12} {category:<15} ${amount:>8.2f} {desc_short}")
    
    return 0


def cmd_report(args):
    """Handle report command."""
    # Default to current month if not specified
    if args.month:
        year_month = args.month
    else:
        year_month = datetime.now().strftime("%Y-%m")
    
    # Validate format
    try:
        datetime.strptime(year_month, "%Y-%m")
    except ValueError:
        print(f"❌ Invalid month format: {year_month}")
        print("   Use YYYY-MM (e.g., 2026-04)")
        return 1
    
    by_category, total, transactions = get_monthly_report(year_month)
    
    if not transactions:
        print(f"📭 No expenses found for {year_month}")
        return 0
    
    month_name = datetime.strptime(year_month, "%Y-%m").strftime("%B %Y")
    
    print(f"\n📊 Monthly Report: {month_name}\n")
    
    # Summary by category
    print("By Category:")
    print(f"{'Category':<20} {'Amount':>12} {'Count':>8}")
    print("-" * 42)
    for cat, cat_total, count in by_category:
        print(f"{cat:<20} ${cat_total:>10.2f} {count:>8}")
    print("-" * 42)
    grand_total, total_count = total
    print(f"{'TOTAL':<20} ${grand_total:>10.2f} {total_count:>8}")
    
    # Detailed transactions (optional)
    if args.detailed:
        print(f"\n📄 All Transactions ({len(transactions)}):")
        print(f"{'Date':<12} {'Category':<15} {'Amount':>10} {'Description'}")
        print("-" * 65)
        for date, category, amount, desc in transactions:
            desc_short = desc[:20] if desc else ""
            print(f"{date:<12} {category:<15} ${amount:>8.2f} {desc_short}")
    
    return 0


def main():
    parser = argparse.ArgumentParser(
        prog="expense_tracker",
        description="Track daily expenses and generate reports"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Add command
    add_parser = subparsers.add_parser("add", help="Add a new expense")
    add_parser.add_argument("--date", "-d", required=True, help="Date (YYYY-MM-DD)")
    add_parser.add_argument("--category", "-c", required=True, help="Category (e.g., food, transport)")
    add_parser.add_argument("--amount", "-a", type=float, required=True, help="Amount spent")
    add_parser.add_argument("--description", "-desc", default="", help="Optional description")
    add_parser.set_defaults(func=cmd_add)
    
    # List command
    list_parser = subparsers.add_parser("list", help="List recent expenses")
    list_parser.add_argument("--limit", "-n", type=int, default=20, help="Number of entries (default: 20)")
    list_parser.add_argument("--category", help="Filter by category")
    list_parser.add_argument("--from-date", help="Filter from date (YYYY-MM-DD)")
    list_parser.add_argument("--to-date", help="Filter to date (YYYY-MM-DD)")
    list_parser.set_defaults(func=cmd_list)
    
    # Report command
    report_parser = subparsers.add_parser("report", help="Generate monthly report")
    report_parser.add_argument("--month", "-m", help="Month (YYYY-MM, default: current)")
    report_parser.add_argument("--detailed", action="store_true", help="Show all transactions")
    report_parser.set_defaults(func=cmd_report)
    
    args = parser.parse_args()
    
    # Initialize database
    init_db()
    
    # Execute command
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
