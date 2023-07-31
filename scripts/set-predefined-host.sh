#!/bin/sh

if [[ -n "$PREDEFINED_HOST" ]]; then
    echo $PREDEFINED_HOST > www/assets/settings/predefined-host.txt
else
    echo "PREDEFINED_HOST is not set."
fi