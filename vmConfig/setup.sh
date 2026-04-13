#!/bin/bash
set -euo pipefail

############################################
#  ft_transcendence Provisioning Script
#  - Auto-elevates to root
#  - Idempotent
#  - Safe to re-run
############################################

echo "🔍 Checking privileges..."

# Auto-elevate to root if needed
if [ "$EUID" -ne 0 ]; then
    echo "🔐 Root privileges required. Switching to root..."
    exec su -c "$0 $*"
fi

echo "👑 Running as root."
echo "🚀 Starting environment provisioning..."

############################################
# 1. Update system
############################################

echo "📦 Updating package lists..."
apt update -y

############################################
# 2. Install required packages (idempotent)
############################################

REQUIRED_PACKAGES=(
    debian-archive-keyring
    ansible
    python3-pip
)

echo "📦 Installing required packages..."

for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if dpkg -s "$pkg" &>/dev/null; then
        echo "   ✅ $pkg already installed"
    else
        echo "   ➕ Installing $pkg..."
        apt install -y "$pkg"
    fi
done

############################################
# 3. Verify Ansible installation
############################################

if command -v ansible &>/dev/null; then
    echo "✅ Ansible is installed: $(ansible --version | head -n1)"
else
    echo "❌ Ansible installation failed."
    exit 1
fi

############################################
# 4. Run Ansible Playbook
############################################

if [ ! -f "playbook.yml" ]; then
    echo "❌ playbook.yml not found in current directory."
    exit 1
fi

echo "🛠️ Running Ansible playbook..."

echo "localhost ansible_connection=local" > local_inventory

ansible-playbook -i local_inventory playbook.yml

rm -f local_inventory

############################################
# 5. Done
############################################

echo "🎉 Provisioning complete!"

