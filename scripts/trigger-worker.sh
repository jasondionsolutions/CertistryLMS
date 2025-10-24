#!/bin/bash

# Manual Worker Trigger Script
# Tests the transcription worker endpoint directly

PRODUCTION_URL="https://certistrylms.vercel.app"
CRON_SECRET="tRIGGM2aB1Pe8ZMWZU7vJeNbalC0x6h4bUBMCqUrqA4="

echo "🚀 Manually triggering transcription worker..."
echo "URL: $PRODUCTION_URL/api/workers/transcription"
echo ""

curl -X GET "$PRODUCTION_URL/api/workers/transcription" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -v

echo ""
echo ""
echo "✅ Done! Check your video page - status should change to 'Processing'"
