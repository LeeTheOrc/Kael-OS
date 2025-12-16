# Discord Server Setup Guide for Kael-OS

## Recommended VS Code Extensions

Based on your needs for Discord server management and bot development, here are the best extensions:

```vscode-extensions
darkempire78.discord-tools,wasimaster.discord-py-snippets,jasonhaxstuff.discord-js-tools
```

### Extension Details:

1. **Discord Tools** (`darkempire78.discord-tools`)
   - Discord chat integration
   - Bot templates and snippets
   - Discord theme
   - Supports discord.js, discord.py, and more
   - 165K+ installs

2. **discord.py Code Snippets** (`wasimaster.discord-py-snippets`)
   - Python-focused snippets
   - Quick boilerplate for discord.py bots
   - 55K+ installs
   - Perfect if you want Python bots

3. **Discord.js Tools** (`jasonhaxstuff.discord-js-tools`)
   - JavaScript/TypeScript focused
   - Discord.js-commando boilerplate
   - 49K+ installs
   - Great for Node.js bots

## Discord Server Structure for Kael-OS

### Recommended Channels:

**📢 Information**
- `#announcements` - Release notes, updates
- `#welcome` - Server rules and intro
- `#roadmap` - Development plans

**💬 Community**
- `#general` - General discussion
- `#showcase` - Share your setups/screenshots
- `#feedback` - Feature requests and bugs
- `#beta-testing` - For beta testers

**🛠️ Support**
- `#help-installation` - Install issues
- `#help-configuration` - Settings and customization
- `#help-themes` - Wallpaper and GRUB theme help
- `#help-ai-setup` - Ollama and AI configuration

**💻 Development**
- `#development` - Code discussion
- `#pull-requests` - PR notifications
- `#issues` - Bug tracking
- `#contributions` - For contributors

**🎨 Themes & Customization**
- `#wallpapers` - Share custom wallpapers
- `#themes` - KDE/GNOME themes
- `#rice` - Show off your desktop setup

**🔐 Private/Staff**
- `#staff-chat` - Admin only
- `#mod-log` - Moderation logs

### Recommended Roles:

- **🏆 Founder** - You
- **⚙️ Admin** - Trusted admins
- **🛡️ Moderator** - Community moderators
- **🧪 Beta Tester** - Early adopters testing v0.5.0+
- **🌟 Contributor** - GitHub contributors
- **💎 Supporter** - Active helpers
- **🆕 New Member** - Auto-role for new joins
- **🐧 Arch User** - Self-assign
- **🪟 KDE Plasma** - Self-assign
- **🌊 GNOME** - Self-assign

### Discord Bot Recommendations:

#### 1. **MEE6** (Free + Premium)
- Auto-moderation
- Welcome messages
- Custom commands
- Level system for engagement
- Music bot

#### 2. **Dyno** (Free)
- Advanced moderation
- Auto-role assignment
- Announcement system
- Music and utilities

#### 3. **GitHub Bot** (Official, Free)
- Automatic PR/issue notifications to #pull-requests and #issues
- Inline code snippets
- Subscribe to repos
- **Setup:** `/github subscribe LeeTheOrc/kael-os`

#### 4. **Custom Kael-OS Bot** (Build Your Own)

Here's a simple Python bot using discord.py:

```python
# kael_bot.py
import discord
from discord.ext import commands
import os

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} is now online!')
    await bot.change_presence(activity=discord.Game(name="Kael-OS v0.5.0-beta"))

@bot.event
async def on_member_join(member):
    channel = discord.utils.get(member.guild.text_channels, name='welcome')
    if channel:
        await channel.send(
            f"🐉 Welcome to Kael-OS, {member.mention}! "
            f"Check <#announcements> for latest updates and <#help-installation> if you need help!"
        )
    # Auto-assign New Member role
    role = discord.utils.get(member.guild.roles, name='🆕 New Member')
    if role:
        await member.add_roles(role)

@bot.command(name='version')
async def version(ctx):
    """Get current Kael-OS version"""
    embed = discord.Embed(
        title="📦 Kael-OS Latest Version",
        description="v0.5.0-beta",
        color=0x8b5cf6
    )
    embed.add_field(name="Release Date", value="December 16, 2025", inline=False)
    embed.add_field(name="Download", value="[Get it here](https://leroyonline.co.za/kael/downloads/desktop/kael-os-0.5.0-x86_64.tar.gz)", inline=False)
    embed.add_field(name="SHA-256", value="`aaa04d8b18369d2a3c9a0f7ab52be464a590a8daedb7f43e887435786a7ba597`", inline=False)
    embed.set_thumbnail(url="https://leroyonline.co.za/kael/images/kael-icon-512.png")
    await ctx.send(embed=embed)

@bot.command(name='install')
async def install(ctx):
    """Installation instructions"""
    embed = discord.Embed(
        title="🔧 Installation Guide",
        description="How to install Kael-OS on Arch Linux",
        color=0xe040fb
    )
    embed.add_field(
        name="1. Download",
        value="`wget https://leroyonline.co.za/kael/downloads/desktop/kael-os-0.5.0-x86_64.tar.gz`",
        inline=False
    )
    embed.add_field(
        name="2. Extract",
        value="`tar -xzf kael-os-0.5.0-x86_64.tar.gz`",
        inline=False
    )
    embed.add_field(
        name="3. Install",
        value="`cd kael-os-0.5.0-x86_64 && sudo cp bin/kael-os /usr/bin/`",
        inline=False
    )
    embed.add_field(
        name="Need Help?",
        value="Ask in <#help-installation>!",
        inline=False
    )
    await ctx.send(embed=embed)

@bot.command(name='themes')
async def themes(ctx):
    """Theme installation info"""
    embed = discord.Embed(
        title="🎨 Kael-OS Dragon Themes",
        description="Install beautiful cyberpunk dragon wallpapers and GRUB themes",
        color=0xffcc00
    )
    embed.add_field(
        name="Wallpaper",
        value="Open Kael-OS → Settings → Themes → Install Wallpaper",
        inline=False
    )
    embed.add_field(
        name="GRUB Bootloader",
        value="Settings → Themes → Prepare GRUB Theme (requires sudo)",
        inline=False
    )
    embed.set_image(url="https://leroyonline.co.za/kael/images/kael-dragon-1024.png")
    await ctx.send(embed=embed)

@bot.command(name='docs')
async def docs(ctx):
    """Documentation links"""
    await ctx.send(
        "📚 **Kael-OS Documentation**\n"
        "• Website: https://leroyonline.co.za/kael/\n"
        "• GitHub: https://github.com/LeeTheOrc/kael-os\n"
        "• Download Page: https://leroyonline.co.za/kael/download.html"
    )

# Error handling
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        await ctx.send("❌ Command not found. Try `!help` to see available commands.")
    else:
        await ctx.send(f"❌ An error occurred: {error}")

# Run bot
TOKEN = os.getenv('DISCORD_BOT_TOKEN')  # Store token in .env file
bot.run(TOKEN)
```

**To run the bot:**

1. Install dependencies:
```bash
pip install discord.py python-dotenv
```

2. Create `.env` file:
```
DISCORD_BOT_TOKEN=your_bot_token_here
```

3. Run:
```bash
python kael_bot.py
```

#### 5. **GitHub Actions for Auto-Announcements**

Create `.github/workflows/discord-release.yml`:

```yaml
name: Discord Release Notification

on:
  release:
    types: [published]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send Discord Notification
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
        run: |
          curl -H "Content-Type: application/json" \
               -d '{
                 "embeds": [{
                   "title": "🚀 New Kael-OS Release!",
                   "description": "'"${{ github.event.release.name }}"' is now available!",
                   "url": "'"${{ github.event.release.html_url }}"'",
                   "color": 9055471,
                   "fields": [
                     {
                       "name": "Version",
                       "value": "'"${{ github.event.release.tag_name }}"'",
                       "inline": true
                     },
                     {
                       "name": "Download",
                       "value": "[Get it here]('"${{ github.event.release.html_url }}"')",
                       "inline": true
                     }
                   ],
                   "thumbnail": {
                     "url": "https://leroyonline.co.za/kael/images/kael-icon-512.png"
                   }
                 }]
               }' \
               "$DISCORD_WEBHOOK"
```

### Server Settings Recommendations:

1. **Verification Level:** Medium (verified email)
2. **Explicit Content Filter:** Scan all members
3. **2FA Requirement:** For moderators
4. **Default Notifications:** Only @mentions
5. **Community Features:** Enable for Discovery

### Moderation Tools:

- **AutoMod Rules:**
  - Block spam/excessive caps
  - Block common profanity
  - Block known scam links
  - Require minimum account age (7 days)

### Welcome Screen Setup:

1. Enable Community
2. Add Welcome Screen with:
   - 🎯 Read #welcome
   - 💬 Join #general
   - 🆘 Need help? #help-installation
   - 🎨 Show your setup in #showcase

### Server Icon & Banner:

Use the dragon icons:
- **Server Icon:** 512x512 dragon (already uploaded to Discord)
- **Server Banner:** Create a 960x540 banner with dragon wallpaper + "Kael-OS Community" text

### Useful Bot Commands:

Once bots are set up, create these commands:
- `!version` - Current Kael-OS version
- `!install` - Installation instructions
- `!themes` - Theme setup guide
- `!docs` - Documentation links
- `!support` - How to get help
- `!contribute` - Contribution guidelines

---

**Next Steps:**
1. Install recommended VS Code extensions
2. Set up server structure (channels & roles)
3. Add MEE6 or Dyno for moderation
4. Add GitHub bot for PR/issue tracking
5. Optionally build custom Kael-OS bot
6. Set up AutoMod rules
7. Create welcome screen
8. Invite community!

**Discord Developer Portal:**
https://discord.com/developers/applications

Your server: https://discord.gg/9mRjPxpShW
