# Environment Setup Guide

This document explains how to set up the **ft_transcendence** environment from scratch, build and run the project, manage containers and volumes, understand how data, secrets and observability are handled
and persisted.

---

## 1. Environment Setup from Scratch (Manual)

If you prefer not to use Vagrant, you can set up your environment manually on a Debian-based system.

### 1.1 Prerequisites

The project is designed to run inside a Linux-based VM.

Required software and access:
- Linux VM (Debian)
- Docker
- Docker Compose
- Make
- SSH access
- User with Docker permissions

---

### 1.2 Virtual Machine Setup

#### VirtualBox & Debian

1. Install VirtualBox
   https://www.virtualbox.org/

2. Download the Debian ISO
   https://www.debian.org/

3. Create a virtual machine using the Debian ISO and complete the OS installation.

---

### 1.3 SSH Installation and Access

Install and enable SSH on the VM:

```bash
sudo apt update
sudo apt install openssh-server
sudo systemctl start ssh
sudo systemctl enable ssh
```

#### VirtualBox Networking Configuration

1. Power off the VM
2. Settings → Network
3. Adapter: Bridged Adapter
4. Interface: your active network interface (e.g. eno2)
5. Start the VM

Retrieve the VM IP address:

```bash
hostname -I
```

Connect via SSH:

```bash
ssh <vm-user>@<vm-ip>
```

---

### 1.4 Docker Installation (Debian)

Remove old Docker versions:

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

Install dependencies:

```bash
sudo apt-get install \
  ca-certificates \
  apt-transport-https \
  curl \
  gnupg \
  lsb-release \
  software-properties-common
```

Add Docker GPG key:

```bash
sudo curl -fsSL https://download.docker.com/linux/debian/gpg \
| sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
```

Add Docker repository:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
https://download.docker.com/linux/debian trixie stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Install Docker Engine:

```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io
```

Verify installation:

```bash
docker -v
sudo systemctl is-active docker
```

---

### 1.5 Docker Permissions

Add user to Docker group:

```bash
sudo usermod -aG docker <username>
```

Reconnect:

```bash
exit
ssh <username>@<vm-ip>
```

Verify group membership:

```bash
groups
```

Expected output includes:

```text
<username> sudo docker
```

---

### 1.6 Docker Compose & Make

Install Docker Compose:

```bash
sudo apt install docker-compose
docker-compose version
```

Install Make:

```bash
sudo apt install make
make --version
```

---

### 1.7 Technical Configuration

#### Environment Variables
The `.env` file contains non-sensitive configuration only (ports, service names, feature flags).

Create it from the template:
```bash
cp .env.example .env
```
*Note: The `.env` file is not committed to version control.*

#### Platform Concepts
For deep-dives into our security and observability strategies, refer to the specialized guides:

- **[Secrets Management (Vault)](../cybersecurity/vault.md)**: How we protect credentials and sensitive data.
- **[Observability (Prometheus & Grafana)](../observability/prometheus-grafana.md)**: Real-time metrics and system health monitoring.
- **[WAF & Gateway](../cybersecurity/modsecurity-waf.md)**: Details on our first security layer.

---

### 1.8 Infrastructure Services (Summary)

The following services are managed within the containerized environment:

| Service    | Responsibility         | Reference Diagram | Detailed Guide |
|------------|------------------------|-------------------|----------------|
| WAF        | Web Security Filtering | [C4 Container](../architecture/3.c4-container.md) | [WAF Guide](../cybersecurity/modsecurity-waf.md) |
| Vault      | Secrets Management     | [C4 Container](../architecture/3.c4-container.md) | [Vault Guide](../cybersecurity/vault.md) |
| Prometheus | Metrics Storage        | [C4 Container](../architecture/3.c4-container.md) | [Observability](../observability/prometheus-grafana.md) |
| Grafana    | Visualization          | [C4 Container](../architecture/3.c4-container.md) | [Observability](../observability/prometheus-grafana.md) |

---

## 3. Build and Run the Project

All operations are managed via the Makefile.

Start the platform:

```bash
make up
```

This command:
- Builds Docker images
- Creates required networks and volumes
- Starts all containers (application, Vault, Prometheus, Grafana)

Stop containers:

```bash
make down
```

Full cleanup:

```bash
make fclean
```

---

## 4. Container & Volume Management

List running containers:

```bash
docker ps
```

View logs:

```bash
docker logs <container-name>
```

Shell access:

```bash
docker exec -it <container-name> /bin/sh
```

Volumes:

```bash
docker volume ls
docker volume inspect <volume-name>
```

---

## Conclusion

This guide enables:
- Full environment recreation
- Secure secrets handling with Vault
- Built-in observability with Prometheus and Grafana
- One-command project execution
- Clear separation of configuration, secrets, and code

The setup follows DevOps, security, and observability best practices.
