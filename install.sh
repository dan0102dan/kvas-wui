#!/bin/sh

ARCHITECTURE=$(opkg print-architecture | tail -n 1 | cut -d ' ' -f 2 | cut -d '-' -f 1)

if [[ "$ARCHITECTURE" == "aarch64" ]]; then
    FILE_NAME="api-arm64"
elif [[ "$ARCHITECTURE" == "mipsel" ]]; then
    FILE_NAME="api-mipsel"
elif [[ "$ARCHITECTURE" == "mips" ]]; then
    FILE_NAME="api-mips"
else
    echo "Unsupported architecture: $ARCHITECTURE"
    exit 1
fi

rm -rf ./$FILE_NAME
curl -L https://github.com/dan0102dan/kvas-wui/releases/latest/download/$FILE_NAME -o ./$FILE_NAME
chmod +x ./$FILE_NAME

echo "Downloaded $FILE_NAME for architecture $ARCHITECTURE"

kill -9 $(netstat -tulpn | grep -E ':5000|:3000' | awk '{print $7}' | cut -d'/' -f1)
echo "Killed existing $FILE_NAME"
