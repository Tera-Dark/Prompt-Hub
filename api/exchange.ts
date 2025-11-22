/// <reference types="node" />

export const config = {
  runtime: 'edge',
}

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { code, redirect_uri } = body as { code?: string; redirect_uri?: string }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 从环境变量获取密钥
    const client_id = process.env.VITE_GITHUB_CLIENT_ID
    const client_secret = process.env.VITE_GITHUB_CLIENT_SECRET

    if (!client_id || !client_secret) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri,
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
