# ADR 004: Choice of Container Base Images (Debian vs. Alpine)

**Status**: Accepted

## 1. Context
The `ft_transcendence` project involves orchestrating multiple microservices with varying technical requirements. A critical decision in Docker architecture is selecting the base operating system (Base Image) for each container, as this impacts:
- **Image Size**: Efficient storage and faster deployments.
- **Security**: Minimizing the attack surface area.
- **Stability**: Ensuring compatibility with C-libraries (`glibc` vs `musl`).

## 2. Decision
We have adopted a **Hybrid Base Image Strategy** rather than a single global standard:

| Service Type | Base Image | Rationale |
| :--- | :--- | :--- |
| **Security Gateway** | `debian:bookworm-slim` | Required for stable compilation of ModSecurity v3 and Nginx connectors which assume `glibc` environment. |
| **Custom App Services** | `alpine:latest` | Optimized for size (~5MB) and security for Go/Python/Node applications. |
| **Infrastructure** | Official Images | Use maintainer-selected bases (Prometheus, Grafana, Vault) for expert-tuned performance. |

## 3. Rationale

### 3.1 Why Debian for the Gateway?
While Alpine is smaller, the **ModSecurity WAF engine** relies on complex C++ dependencies. 
- **Compatibility**: Debian uses `glibc`, the industry standard for Linux binaries.
- **Reliability**: Avoiding the common "segmentation faults" and runtime crashes that occur when complex C-based security modules are compiled against Alpine's `musl libc`.
- **Hardening**: `bookworm-slim` provides a balance, stripping away 80% of standard Debian while keeping the engine robust.

### 3.2 Why Alpine for Apps?
For our internal Authentication and Application API services:
- **Cybersecurity (IV.5)**: By using Alpine, we remove non-essential binaries (vulnerability vectors like `ssh`, `apt`, `python` if not needed), significantly hardening the container.
- **Efficiency**: Smaller images pull faster and consume less disk space on the host.

## 4. Consequences
- **Developer Awareness**: Developers must be aware of the `libc` difference when adding new C-extensions.
- **Evaluation Ready**: This approach provides a clear, technical answer when asked about "reasoned technical decisions" or "security hardening" during project defense.
- **Mixed Ecosystem**: We manage two package managers (`apt` and `apk`), a small trade-off for significantly better stability.
