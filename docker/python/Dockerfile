# Python Sandbox for Local Fragments
# Build: docker build -t local-sandbox-python ./docker/python

FROM python:3.11-slim

# Install fonts for matplotlib (including Korean fonts)
RUN apt-get update && apt-get install -y \
    fonts-nanum \
    fonts-nanum-coding \
    fonts-nanum-extra \
    fontconfig \
    && fc-cache -fv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install common data science packages
RUN pip install --no-cache-dir \
    matplotlib \
    pandas \
    numpy \
    seaborn \
    plotly \
    scipy \
    pillow

# Copy matplotlib config for Korean font support
COPY matplotlibrc /etc/matplotlibrc

# Security: Create non-root user
RUN useradd -m -s /bin/bash sandbox

# Set working directory
WORKDIR /code

# Create output directory
RUN mkdir -p /output && chown sandbox:sandbox /output

# Create matplotlib config directory and copy config
RUN mkdir -p /home/sandbox/.config/matplotlib && \
    cp /etc/matplotlibrc /home/sandbox/.config/matplotlib/matplotlibrc && \
    chown -R sandbox:sandbox /home/sandbox/.config

# Switch to non-root user
USER sandbox

# Set matplotlib to non-interactive backend
ENV MPLBACKEND=Agg
ENV MPLCONFIGDIR=/home/sandbox/.config/matplotlib

# Default command (will be overridden)
CMD ["python", "--version"]
