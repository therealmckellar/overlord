#!/usr/bin/env python3
"""
sync_x_to_hermes.py — Bridge Overlord X connection to Hermes (xurl).

Overlord performs the real X OAuth2 PKCE flow and stores the user-context
token in its SQLite DB (social_accounts). Hermes uses `xurl`, which reads
auth from ~/.xurl (primary) or ~/.config/xurl/config.yaml.

This script mirrors the live Overlord X token into xurl's `x-api` app
oauth2 section so that Hermes is "connected" to X exactly when Overlord is.

Requirements for token portability:
  - xurl's `x-api` app MUST use the SAME X client_id/client_secret as Overlord.
    (Set once by pointing ~/.xurl x-api.client_id to Overlord's X_CLIENT_ID.)
    An OAuth2 token minted by one X app is NOT valid for another app.

If Overlord has no connected X account, this script clears any stale oauth2
section so Hermes does not report a dead connection.

Usage:
  python3 sync_x_to_hermes.py
"""

import os
import re
import sqlite3
import yaml

OVERLORD_DB = os.path.expanduser("/home/rmckellar/overlord/data/overlord.db")
XURL_CONFIGS = [
    os.path.expanduser("/home/rmckellar/.xurl"),
    os.path.expanduser("/home/rmckellar/.config/xurl/config.yaml"),
]


def get_overlord_x_token():
    """Return (access_token, refresh_token, expires_at, account_name) or None."""
    if not os.path.exists(OVERLORD_DB):
        return None
    try:
        conn = sqlite3.connect(OVERLORD_DB)
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT access_token, refresh_token, token_expires_at, account_name, status "
            "FROM social_accounts WHERE platform='x' ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
        conn.close()
        if not row:
            return None
        if row["status"] != "connected":
            return None
        if not row["access_token"]:
            return None
        return (
            row["access_token"],
            row["refresh_token"],
            row["token_expires_at"],
            row["account_name"],
        )
    except Exception as e:
        print(f"[sync_x] DB read error: {e}")
        return None


def load_cfg(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except Exception:
        return {}


def write_cfg(path, cfg):
    with open(path, "w") as f:
        yaml.safe_dump(cfg, f, default_flow_style=False, sort_keys=False)


def apply_to_xurl(path, token):
    """Mirror token into an xurl config file. Supports both ~/.xurl and config.yaml formats."""
    cfg = load_cfg(path)
    if not cfg:
        return False

    # Detect format:
    #   ~/.xurl uses top-level `default_app` + `apps:<name>:oauth2_token`
    #   config.yaml uses `defaults.app` + `apps:<name>:oauth2`
    if "default_app" in cfg:
        app_name = cfg.get("default_app", "x-api")
    elif "defaults" in cfg and isinstance(cfg["defaults"], dict):
        app_name = cfg["defaults"].get("app", "x-api")
    else:
        app_name = "x-api"

    if "apps" not in cfg or app_name not in cfg.get("apps", {}):
        # No matching app — skip this file
        return False

    app = cfg["apps"][app_name]
    oauth2_block = {
        "type": "oauth2",
        "oauth2": {
            "access_token": token[0],
            "refresh_token": token[1] or "",
            "token_type": "Bearer",
        },
    }
    if token[2]:
        oauth2_block["oauth2"]["expires_at"] = int(token[2])

    # ~/.xurl format uses `oauth2_token:` key
    if "default_app" in cfg:
        app["oauth2_token"] = oauth2_block
    else:
        app["oauth2"] = oauth2_block

    write_cfg(path, cfg)
    return True


def clear_in_xurl(path):
    cfg = load_cfg(path)
    if not cfg or "apps" not in cfg:
        return False
    if "default_app" in cfg:
        app_name = cfg.get("default_app", "x-api")
    elif "defaults" in cfg and isinstance(cfg["defaults"], dict):
        app_name = cfg["defaults"].get("app", "x-api")
    else:
        app_name = "x-api"
    app = cfg.get("apps", {}).get(app_name, {})
    changed = False
    for key in ("oauth2_token", "oauth2"):
        if key in app:
            del app[key]
            changed = True
    if changed:
        write_cfg(path, cfg)
    return changed


def main():
    token = get_overlord_x_token()
    synced = []
    cleared = []

    for path in XURL_CONFIGS:
        if not os.path.exists(path):
            continue
        if token is None:
            if clear_in_xurl(path):
                cleared.append(path)
        else:
            if apply_to_xurl(path, token):
                synced.append(path)

    if token is None:
        if cleared:
            print(f"[sync_x] Overlord X not connected — cleared Hermes oauth2 in: {', '.join(cleared)}")
        else:
            print("[sync_x] Overlord X not connected — nothing to do.")
    else:
        print(f"[sync_x] Mirrored Overlord X token ({token[3] or 'unknown'}) -> Hermes: {', '.join(synced)}")


if __name__ == "__main__":
    main()
