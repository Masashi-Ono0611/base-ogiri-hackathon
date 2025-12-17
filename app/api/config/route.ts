import { NextResponse } from "next/server";

export function GET() {
  const htlcContractAddress = process.env.HTLC_CONTRACT_ADDRESS ?? "";
  return NextResponse.json({ htlcContractAddress });
}
