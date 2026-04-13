# Development VM Setup Guide

## 📦 Prerequisites

Make sure you have:

* A running Ubuntu/Debian-based VM
* `setup.sh`
* `playbook.yml`

---

## 📁 Step 1 – Copy Files Into the VM

Place the following files inside your VM (for example in your home directory):

```
setup.sh
playbook.yml
```

## 🔐 Step 2 – Make the Script Executable

Inside the VM:

```bash
chmod +x setup.sh
```

This gives execution permission to the script.

---

## 🚀 Step 3 – Run the Setup Script

Execute:

```bash
./setup.sh
```

This script will:

* Install required dependencies
* Install and configure Ansible
* Provision the VM automatically

---

## ✅ Step 4 – Verify Installation

After the script finishes, verify key components:

```bash
node -v
npm -v
docker -v
make --version
git --version
vim --version
```

---

## 🧠 Notes

* Do not interrupt the script during execution.
