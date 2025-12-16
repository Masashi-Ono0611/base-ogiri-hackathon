export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return Response.json({ ok: true, received: body });
}
