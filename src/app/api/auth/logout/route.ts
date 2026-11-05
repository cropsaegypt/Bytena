import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('baytna_auth_user');
  response.cookies.delete('baytna_session');
  response.cookies.delete('baytna_pin_token');
  return response;
}
