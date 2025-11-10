# Testing the Cloudflare Worker

## Local Development Testing

### Start the Development Server

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`.

### Test with curl

#### 1. Test CORS Preflight

```bash
curl -X OPTIONS \
  -H "Origin: https://tera-dark.github.io" \
  -v \
  http://localhost:8787/exchange
```

Expected response headers:
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://tera-dark.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### 2. Test Missing Code

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://tera-dark.github.io" \
  -d '{"redirect_uri":"https://tera-dark.github.io/Prompt-Hub/auth/callback"}' \
  http://localhost:8787/exchange
```

Expected response:
```json
{
  "error": "missing_code",
  "error_description": "The \"code\" parameter is required"
}
```

#### 3. Test Missing Redirect URI

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://tera-dark.github.io" \
  -d '{"code":"test_code"}' \
  http://localhost:8787/exchange
```

Expected response:
```json
{
  "error": "missing_redirect_uri",
  "error_description": "The \"redirect_uri\" parameter is required"
}
```

#### 4. Test Invalid JSON

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://tera-dark.github.io" \
  -d 'not valid json' \
  http://localhost:8787/exchange
```

Expected response:
```json
{
  "error": "invalid_request",
  "error_description": "..."
}
```

#### 5. Test with Valid Parameters (Will fail without real credentials)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://tera-dark.github.io" \
  -d '{"code":"test_code","redirect_uri":"https://tera-dark.github.io/Prompt-Hub/auth/callback"}' \
  http://localhost:8787/exchange
```

Without real GitHub App secrets configured, this will return a GitHub error:
```json
{
  "error": "bad_verification_code",
  "error_description": "The code passed is incorrect or expired."
}
```

## Deployment Testing

After deployment, run the same curl commands but replace:
```
http://localhost:8787
```

with:
```
https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev
```

## Frontend Integration Testing

Once deployed, test from the frontend:

```typescript
const response = await fetch(
  'https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev/exchange',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'github_oauth_code',
      redirect_uri: 'https://tera-dark.github.io/Prompt-Hub/auth/callback',
    }),
  }
)

const data = await response.json()
if (data.access_token) {
  console.log('✅ Token exchange successful')
  console.log('Token:', data.access_token)
} else {
  console.error('❌ Token exchange failed')
  console.error('Error:', data.error)
}
```

## Checking Logs

### Local Development

Check the terminal running `npm run dev` for request logs.

### Deployed Worker

```bash
wrangler tail
```

This will stream logs from your deployed worker in real-time.

## Performance Testing

### Load Testing with Apache Bench

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "Origin: https://tera-dark.github.io" \
  -H "Content-Type: application/json" \
  -p request.json \
  https://prompt-hub-gh-app-oauth.YOUR_ACCOUNT.workers.dev/exchange
```

Create `request.json`:
```json
{"code":"test","redirect_uri":"https://tera-dark.github.io/Prompt-Hub/auth/callback"}
```

### Expected Results

- Cloudflare Workers free plan handles 100,000+ requests/day
- Average response time: < 100ms
- No rate limiting for valid requests

## Debugging

### Enable Request/Response Logging

The worker automatically logs:
- Request method and URL
- Response status code
- Any errors encountered

View logs with:
```bash
wrangler tail
```

### Test Secret Configuration

Verify secrets are properly set:

```bash
# This won't show the actual values (for security)
wrangler secret list
```

You should see:
```
CLIENT_ID
CLIENT_SECRET
```

### TypeScript Type Checking

```bash
npm run build
```

This compiles TypeScript and shows any type errors.

## Common Issues

### "Worker not found"

- Ensure deployment succeeded: `npm run deploy`
- Check worker is active in Cloudflare dashboard

### "CORS error in browser"

- Verify Origin header matches exactly: `https://tera-dark.github.io`
- Check Access-Control-Allow-Origin header in response

### "Unauthorized" or "bad_verification_code"

- Verify CLIENT_ID and CLIENT_SECRET are correct
- Ensure secrets are properly configured: `wrangler secret put`
- Check code hasn't expired (GitHub codes expire in 10 minutes)

### "Invalid redirect_uri"

- Ensure redirect_uri matches exactly what's registered in GitHub App
- No trailing slashes or query parameters

## Next Steps

1. ✅ Run tests locally with `npm run dev`
2. ✅ Deploy with `npm run deploy`
3. ✅ Test deployed worker with curl
4. ✅ Integrate with frontend
5. ✅ Monitor logs with `wrangler tail`

See [CF_WORKER_GH_APP_OAUTH.md](../../document/CF_WORKER_GH_APP_OAUTH.md) for detailed troubleshooting.
