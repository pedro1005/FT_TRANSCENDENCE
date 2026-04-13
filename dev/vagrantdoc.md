# Standardized Development Environment (Vagrant)

This document explains how to use the pre-configured development environment provided with the **ft_transcendence** project. Using this environment ensures all developers work on the same virtualized stack, matched to the project's architectural requirements.

## 1. Prerequisites
Before starting, ensure you have the following installed on your host system:
- [VirtualBox](https://www.virtualbox.org/)
- [Vagrant](https://www.vagrantup.com/)

## 2. Usage Instructions

1. **Clone the repository** to your host machine.
2. **Navigate to the dev directory**:
   ```bash
   cd dev
   ```
3. **Start and provision the VM**:
   ```bash
   vagrant up
   ```
   *Note: On the first run, this will download the Debian box and run the Ansible provisioner to install Docker, Docker Compose, and Make. This may take a few minutes.*

4. **Access the VM via SSH**:
   ```bash
   vagrant ssh
   ```
   *Note: If you are prompted for a login on the VirtualBox GUI, the default credentials are **vagrant** for both the username and password.*

5. **Locate the project files**:
   Inside the VM, the project root is automatically synchronized to:
   ```bash
   cd /home/vagrant/ft_transcendence
   ```

## 3. How the Code Gets There (Synced Folders)

Vagrant uses **Synced Folders** to automatically map your project files between your host machine and the VM.

- **Automatic Link**: The project root on your host is mapped to `/home/vagrant/ft_transcendence` inside the VM.
- **Bi-directional**: Changes made in your host (using VS Code, Vim, etc.) are reflected **instantly** inside the VM, and vice-versa.
- **No Manual Copies**: You do not need to `scp` or `rsync` your `Dockerfile`, `Makefile`, or source code. They are always in sync.

## 4. Environment Features
- **OS**: Debian (Bookworm)
- **Pre-installed**: Docker Engine, Docker Compose plugin, GNU Make.
- **Group Permissions**: The `vagrant` user is automatically added to the `docker` group.

> [!IMPORTANT]
> Because group memberships are loaded at login, you must run `vagrant ssh` **after** the initial provisioning is finished for the permissions to take effect. If you were already logged in while Ansible was running, simply exit and log back in to refresh your permissions.

## 5. Port Forwarding
The following ports are forwarded from the VM to your `localhost`:
- `8080` (App Frontend)
- `8000` (App Backend)
- `8200` (Vault)
- `9090` (Prometheus)
- `3000` (Grafana)

## 6. Maintenance
- **Stop the VM**: `vagrant halt`
- **Delete the VM**: `vagrant destroy`
- **Re-run provisioning**: `vagrant provision` (Safe and idempotent).

---

## 7. Developer: VS Code Remote - SSH Workflow

To maintain a high-performance and professional development experience, we use the **VS Code Remote - SSH** workflow. This allows you to write code on your host OS while executing it directly inside the secure, standardized Vagrant VM.

### 7.1 Why this approach?
- **Consistency**: The code runs in the same environment (Debian) for everyone. No "it works on my machine" issues.
- **Performance**: You use your local VS Code interface (fast UI) while the VM handles the heavy lifting (compilation, Docker).
- **Security**: The VM isolates development dependencies from your host operating system.

### 7.2 Setup Guide

1.  **Host Side**: Install the **Remote - SSH** extension in your local VS Code.
2.  **Get VM Config**: navigate to your `dev/` folder and run:
    ```bash
    vagrant ssh-config
    ```
3.  **Configure SSH**: 
    - Copy the output of the command above.
    - In VS Code: `Ctrl + Shift + P` -> **Remote-SSH: Open SSH Configuration File...** -> Select your `~/.ssh/config`.
    - Paste the config (you can rename the `Host default` to something like `Host ft-dev`).
4.  **Connect**: 
    - `Ctrl + Shift + P` -> **Remote-SSH: Connect to Host...** -> Select `ft-dev`.
    - A new VS Code window will open. If prompted, select "Linux" as the platform.
5.  **Open Project**: Once connected, go to **File -> Open Folder** and select:
    `/home/vagrant/ft_transcendence`

### 7.3 Developing Inside the VM
Once connected via SSH, the VS Code terminal (`Ctrl + ~`) will be a terminal **inside the VM**. You can run:
- `make up` to start the containers.
- `docker logs -f [service]` to see real-time output.
- `git status` to manage code synced from your host.

> [!TIP]
> You can install extensions *directly inside the VM* through the VS Code sidebar. We recommend installing the **Docker** and **Mermaid** extensions inside the ssh session for better integration.
