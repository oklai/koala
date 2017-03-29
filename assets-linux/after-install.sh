#!/bin/bash

# Link to the binary
ln -sf /usr/share/koala/Koala /usr/local/bin/koala

# Launcher icon
desktop-file-install /usr/share/koala/koala.desktop
