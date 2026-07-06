import { NextResponse } from 'next/server';
import sqlite3 from 'better-sqlite3';

const DB_PATH = '/home/rmckellar/overlord/data/overlord.db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get('pipelineId');

  if (!pipelineId) {
    return NextResponse.json({ error: 'pipelineId is required' }, { status: 400 });
  }

  try {
    const db = new sqlite3(DB_PATH);
    const assets = db.prepare('SELECT * FROM content_assets WHERE pipeline_id = ?').all(pipelineId);
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Fetch Assets Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, pipeline_id, stage_id, asset_type, storage_url, metadata } = body;

    if (!id || !pipeline_id || !storage_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = new sqlite3(DB_PATH);
    const now = Date.now();
    const insertAsset = db.prepare(`
      INSERT INTO content_assets (id, pipeline_id, stage_id, asset_type, storage_url, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAsset.run(id, pipeline_id, stage_id, asset_type, storage_url, JSON.stringify(metadata), now, now);

    return NextResponse.json({ success: true, assetId: id });
  } catch (error) {
    console.error('Insert Asset Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
