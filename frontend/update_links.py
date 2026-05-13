import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

def map_to_file(text):
    text = text.lower()
    
    if "dashboard" in text:
        return "affiliate_dashboard.html"
    elif "market" in text or "show_chart" in text or "liquidity" in text:
        return "global_market_overview_terminal.html"
    elif "analytic" in text or "query_stats" in text or "ai insights" in text or "insight" in text or "signal" in text:
        return "institutional_analytics_performance_dashboard.html"
    elif "portfolio" in text or "wallet" in text or "deposit" in text or "withdraw" in text or "upgrade" in text or "account_balance_wallet" in text:
        return "institutional_wallet_fund_management.html"
    elif "trade" in text or "terminal" in text or "swap_horiz" in text or "psychology" in text or "platform" in text:
        return "professional_trading_terminal.html"
    elif "profile" in text or "account" in text or "person" in text or "manage_accounts" in text or "terms" in text or "privacy" in text or "risk" in text or "regulatory" in text or "legal" in text or "compliance" in text or "api" in text or "code" in text or "setting" in text or "settings" in text or "institutional" in text:
        return "institutional_profile_security_settings.html"
    elif "history" in text or "report" in text or "transaction" in text or "receipt_long" in text or "description" in text or "download" in text:
        return "transaction_history_financial_reports.html"
    elif "support" in text or "help" in text or "headset_mic" in text or "contact" in text or "academy" in text:
        return "institutional_support_help_center.html"
    elif "kyc" in text or "verif" in text or "verified_user" in text:
        return "unified_verification_hub.html"
    elif "login" in text or "sign in" in text or "logout" in text:
        return "secure_web_login.html"
    elif "register" in text or "sign up" in text or "create" in text or "start trading" in text:
        return "secure_web_registration.html"
    elif "forgot" in text or "recover" in text or "reset" in text:
        return "secure_password_recovery.html"
    elif "affiliate" in text:
        return "affiliate_dashboard.html"
    elif "group" in text or "copy trading" in text or "top traders" in text or "copy" in text or "view all" in text:
        return "copy_trading.html"
    elif "security" in text or "lock" in text or "shield" in text:
        return "institutional_profile_security_settings.html"
    elif "home" in text:
        return "emerald_obsidian_edition.html"
    return None

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update <a> tags
    pattern_a = re.compile(r'(<a\s+[^>]*?href=")([^"]*)("[^>]*>)(.*?)(</a>)', re.IGNORECASE | re.DOTALL)
    
    def replacer_a(m):
        start = m.group(1)
        href = m.group(2)
        end_start = m.group(3)
        inner = m.group(4)
        end = m.group(5)
        
        if href == "#" or href == "" or "affiliate_dashboard" in href:
            target = map_to_file(inner)
            if target:
                return f"{start}{target}{end_start}{inner}{end}"
        return m.group(0)

    new_content = pattern_a.sub(replacer_a, content)

    # 2. Update <button> tags without onclick
    pattern_b = re.compile(r'(<button\s+)([^>]*?)(>)(.*?)(</button>)', re.IGNORECASE | re.DOTALL)
    
    def replacer_b(m):
        start = m.group(1)
        attrs = m.group(2)
        end_start = m.group(3)
        inner = m.group(4)
        end = m.group(5)
        
        if 'onclick' not in attrs.lower():
            target = map_to_file(inner)
            if target:
                # Add onclick attribute
                return f"{start}{attrs} onclick=\"window.location.href='{target}'\"{end_start}{inner}{end}"
        return m.group(0)

    new_content = pattern_b.sub(replacer_b, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated links/buttons in {filepath}")

for f in html_files:
    process_file(f)
