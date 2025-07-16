#!/bin/bash

V="https://ls.c-e.group/yt/0/v"
YOUTUBE_BASE_URL="https://www.youtube.com/watch?v="

while true; do
    response=$(curl -s "$V")
    echo $response
    id=$(echo "$response" | grep -o '"videoId":"[^"]*"' | cut -d'"' -f4)
    seconds=$(echo "$response" | grep -o '"seconds":[0-9]*' | cut -d':' -f2)
    am start -a android.intent.action.VIEW -d "${YOUTUBE_BASE_URL}${id}" -n org.mozilla.firefox/.App
    echo "v: $id ($seconds)"
    sleep $((seconds + 5))
    echo "next"
done