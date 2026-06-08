import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const storageDir = path.join(process.cwd(), "data");
const storagePath = path.join(storageDir, "product-updates.json");

async function ensureStorageFile() {
  await fs.mkdir(storageDir, { recursive: true });
  try {
    await fs.access(storagePath);
  } catch (error) {
    await fs.writeFile(storagePath, "[]", "utf8");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    await ensureStorageFile();

    const existingRaw = await fs.readFile(storagePath, "utf8");
    const parsed = JSON.parse(existingRaw);
    const existing = Array.isArray(parsed) ? parsed : [];

    const entry = { email, ts: new Date().toISOString() };
    existing.push(entry);

    await fs.writeFile(storagePath, JSON.stringify(existing, null, 2), "utf8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("product-updates store failed", error);
    return NextResponse.json({ error: "Failed to store email." }, { status: 500 });
  }
}

