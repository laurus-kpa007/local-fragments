# Node.js Sandbox for Local Fragments
# Build: docker build -t local-sandbox-node ./docker/node

FROM node:20-slim

# Security: Create non-root user
RUN useradd -m -s /bin/bash sandbox

# Set working directory
WORKDIR /code

# Create output directory
RUN mkdir -p /output && chown sandbox:sandbox /output

# Switch to non-root user
USER sandbox

# Default command (will be overridden)
CMD ["node", "--version"]
