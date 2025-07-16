#!/bin/bash

V="https://ls.c-e.group/yt/0/v"
YOUTUBE_BASE_URL="https://www.youtube.com/watch?v="

while true; do
    response=$(curl -s "$V")
    echo $response
    id=$(echo "$response" | grep -o '"videoId":"[^"]*"' | cut -d'"' -f4)
    seconds=$(echo "$response" | grep -o '"seconds":[0-9]*' | cut -d':' -f2)
    am start -a android.intent.action.VIEW -d "${YOUTUBE_BASE_URL}${youtube_id}" org.mozilla.firefox
    echo "v: $id ($seconds)"
    sleep 5
    input tap 500 500
    sleep $((seconds + 5))
    echo "next"
done