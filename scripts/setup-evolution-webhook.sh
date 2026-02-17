#!/bin/bash

# Evolution API Webhook Setup Script
# This script automates the configuration of Evolution API webhook for Odonto Chin CRM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EVOLUTION_API_URL="http://95.111.240.243:8080"
API_KEY="OdontoChinSecretKey2026"
INSTANCE_NAME="odonto-chin-crm"

# Get CRM domain from user or use default
echo -e "${YELLOW}=== Evolution API Webhook Setup ===${NC}"
echo ""
read -p "Enter your CRM domain (e.g., https://odonto-chin.manus.space): " CRM_DOMAIN

if [ -z "$CRM_DOMAIN" ]; then
  echo -e "${RED}Error: CRM domain is required${NC}"
  exit 1
fi

WEBHOOK_URL="${CRM_DOMAIN}/api/webhook/evolution"

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Evolution API: $EVOLUTION_API_URL"
echo "  Instance: $INSTANCE_NAME"
echo "  Webhook URL: $WEBHOOK_URL"
echo ""

# Step 1: Check if instance exists
echo -e "${YELLOW}Step 1: Checking instance status...${NC}"
INSTANCE_STATUS=$(curl -s -H "apikey: $API_KEY" \
  "$EVOLUTION_API_URL/instance/connectionState/$INSTANCE_NAME" || echo '{"error": true}')

if echo "$INSTANCE_STATUS" | grep -q '"state":"open"'; then
  echo -e "${GREEN}✓ Instance is connected and ready${NC}"
elif echo "$INSTANCE_STATUS" | grep -q '"state":"close"'; then
  echo -e "${YELLOW}⚠ Instance exists but is disconnected${NC}"
  echo "  You'll need to reconnect it manually"
elif echo "$INSTANCE_STATUS" | grep -q "error"; then
  echo -e "${RED}✗ Instance does not exist${NC}"
  echo ""
  echo -e "${YELLOW}Creating new instance...${NC}"
  
  CREATE_RESPONSE=$(curl -s -X POST \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"instanceName\": \"$INSTANCE_NAME\",
      \"qrcode\": true,
      \"integration\": \"WHATSAPP-BAILEYS\"
    }" \
    "$EVOLUTION_API_URL/instance/create")
  
  if echo "$CREATE_RESPONSE" | grep -q "instanceName"; then
    echo -e "${GREEN}✓ Instance created successfully${NC}"
    echo ""
    echo -e "${YELLOW}To connect WhatsApp:${NC}"
    echo "  1. Visit: $EVOLUTION_API_URL/instance/connect/$INSTANCE_NAME"
    echo "  2. Scan the QR code with WhatsApp (Linked Devices)"
    echo "  3. Wait for connection confirmation"
    echo ""
    read -p "Press Enter after connecting WhatsApp..."
  else
    echo -e "${RED}✗ Failed to create instance${NC}"
    echo "$CREATE_RESPONSE"
    exit 1
  fi
fi

# Step 2: Configure webhook
echo ""
echo -e "${YELLOW}Step 2: Configuring webhook...${NC}"

WEBHOOK_RESPONSE=$(curl -s -X POST \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"webhook_by_events\": false,
    \"webhook_base64\": false,
    \"events\": [
      \"MESSAGES_UPSERT\",
      \"MESSAGES_UPDATE\",
      \"CONNECTION_UPDATE\"
    ]
  }" \
  "$EVOLUTION_API_URL/webhook/set/$INSTANCE_NAME")

if echo "$WEBHOOK_RESPONSE" | grep -q "url"; then
  echo -e "${GREEN}✓ Webhook configured successfully${NC}"
else
  echo -e "${RED}✗ Failed to configure webhook${NC}"
  echo "$WEBHOOK_RESPONSE"
  exit 1
fi

# Step 3: Verify webhook configuration
echo ""
echo -e "${YELLOW}Step 3: Verifying webhook configuration...${NC}"

WEBHOOK_INFO=$(curl -s -H "apikey: $API_KEY" \
  "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME")

if echo "$WEBHOOK_INFO" | grep -q "$WEBHOOK_URL"; then
  echo -e "${GREEN}✓ Webhook verification successful${NC}"
  echo ""
  echo -e "${GREEN}=== Setup Complete ===${NC}"
  echo ""
  echo "Webhook URL: $WEBHOOK_URL"
  echo "Events: MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Send a test message from WhatsApp"
  echo "  2. Check CRM logs: tail -f .manus-logs/devserver.log"
  echo "  3. Verify appointment confirmations are detected"
  echo ""
else
  echo -e "${RED}✗ Webhook verification failed${NC}"
  echo "$WEBHOOK_INFO"
  exit 1
fi

# Step 4: Test webhook (optional)
echo ""
read -p "Do you want to send a test message? (y/n): " SEND_TEST

if [ "$SEND_TEST" = "y" ] || [ "$SEND_TEST" = "Y" ]; then
  echo ""
  read -p "Enter test phone number (with country code, e.g., 595981234567): " TEST_PHONE
  
  if [ -n "$TEST_PHONE" ]; then
    echo -e "${YELLOW}Sending test message...${NC}"
    
    TEST_RESPONSE=$(curl -s -X POST \
      -H "apikey: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"number\": \"$TEST_PHONE\",
        \"text\": \"🦷 Hola! Este es un mensaje de prueba del CRM Odonto Chin. Por favor responde 'Sí' para confirmar.\"
      }" \
      "$EVOLUTION_API_URL/message/sendText/$INSTANCE_NAME")
    
    if echo "$TEST_RESPONSE" | grep -q "key"; then
      echo -e "${GREEN}✓ Test message sent successfully${NC}"
      echo ""
      echo "Please respond 'Sí' from WhatsApp and check the CRM logs"
    else
      echo -e "${RED}✗ Failed to send test message${NC}"
      echo "$TEST_RESPONSE"
    fi
  fi
fi

echo ""
echo -e "${GREEN}Setup script completed!${NC}"
echo ""
echo -e "${YELLOW}Monitoring commands:${NC}"
echo "  Check instance status:"
echo "    curl -H 'apikey: $API_KEY' $EVOLUTION_API_URL/instance/connectionState/$INSTANCE_NAME"
echo ""
echo "  Check webhook config:"
echo "    curl -H 'apikey: $API_KEY' $EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME"
echo ""
echo "  Monitor CRM logs:"
echo "    tail -f .manus-logs/devserver.log | grep -E 'Webhook|Confirmation'"
echo ""
