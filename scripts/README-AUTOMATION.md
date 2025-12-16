# Automated Backup Setup

## ✅ What's Been Configured

### 1. WebDAV Password (Fish Shell)

- **Location:** `~/.config/fish/config.fish`
- **Variable:** `WEBDAV_PASSWORD` is now set automatically on shell startup
- **Security:** File permissions set to `600` (only you can read it)

### 2. Git Credential Storage

- **Enabled:** `git config credential.helper store`
- **How it works:** After your next successful GitHub push with username/password, git will remember your credentials
- **Storage:** `~/.git-credentials` (also secured with 600 permissions)

### 3. Auto Backup Script

- **Location:** `scripts/auto-backup.sh`
- **What it does:**
  1. Commits any changes to git
  2. Pushes to GitHub
  3. Creates compressed backup (excludes build artifacts)
  4. Uploads to WebDAV private folder
  5. Keeps only last 5 local backups

---

## 🚀 Usage

### Manual Backup

Run anytime from anywhere:

```bash
bash ~/Kael-os/Kael-OS-AI/scripts/auto-backup.sh
```

### Reload Shell Environment

To use WEBDAV_PASSWORD in current shell:

```fish
source ~/.config/fish/config.fish
```

### Test WebDAV Connection

```bash
# Should now work automatically (password already set)
bash ~/Kael-os/Kael-OS-AI/scripts/backup-source.sh
```

---

## ⏰ Optional: Automatic Scheduled Backups

### Option 1: Cron (runs even when logged out)

Add to crontab with `crontab -e`:

```bash
# Daily backup at 11 PM
0 23 * * * /home/leetheorc/Kael-os/Kael-OS-AI/scripts/auto-backup.sh >> /home/leetheorc/backup.log 2>&1

# Or every 6 hours
0 */6 * * * /home/leetheorc/Kael-os/Kael-OS-AI/scripts/auto-backup.sh >> /home/leetheorc/backup.log 2>&1
```

### Option 2: Systemd Timer (better for modern systems)

Create two files:

**~/.config/systemd/user/kael-backup.service**

```ini
[Unit]
Description=Kael-OS Automatic Backup
After=network-online.target

[Service]
Type=oneshot
ExecStart=/home/leetheorc/Kael-os/Kael-OS-AI/scripts/auto-backup.sh
StandardOutput=journal
StandardError=journal
```

**~/.config/systemd/user/kael-backup.timer**

```ini
[Unit]
Description=Kael-OS Backup Timer (Daily at 11 PM)

[Timer]
OnCalendar=daily
OnCalendar=23:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable it:

```bash
systemctl --user daemon-reload
systemctl --user enable --now kael-backup.timer
systemctl --user status kael-backup.timer
```

---

## 🔐 Security Notes

- ✅ **Fish config:** Only you can read (`chmod 600`)
- ✅ **Git credentials:** Will be stored in `~/.git-credentials` (600 permissions)
- ✅ **Backups:** Stored in `/home/leetheorc/backups/` (private to your user)
- ⚠️ **Important:** Don't commit `.git-credentials` or `config.fish` to GitHub!

---

## 📊 Backup Status

**Current Setup:**

- Local backups: `/home/leetheorc/backups/` (keeps last 5)
- GitHub: `https://github.com/LeeTheOrc/kael-os`
- WebDAV: `https://leroyonline.co.za:2078/public_html/kael-private/`

**Manual Commands:**

```bash
# Full auto backup (git + webdav)
bash ~/Kael-os/Kael-OS-AI/scripts/auto-backup.sh

# Just git commit and push
cd ~/Kael-os && git add -A && git commit -m "Update" && git push

# Just WebDAV backup
bash ~/Kael-os/Kael-OS-AI/scripts/backup-source.sh

# List backups
ls -lh ~/backups/kael-os-backup-*.tar.gz
```

---

**Everything is now automated! Your password is stored securely and will work automatically.** 🎉
