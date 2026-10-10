import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { MAX_FILE_SIZE, isAllowedExtension } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const turnstileToken = formData.get('turnstileToken') as string | null;

    // 1. Validate file presence
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided.' },
        { status: 400 }
      );
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File exceeds the 25MB size limit.' },
        { status: 400 }
      );
    }

    // 3. Validate file extension
    if (!isAllowedExtension(file.name)) {
      return NextResponse.json(
        { success: false, error: 'File type is not supported.' },
        { status: 400 }
      );
    }

    // 4. Validate Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: 'Missing security verification token.' },
        { status: 400 }
      );
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    const turnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileValid) {
      return NextResponse.json(
        { success: false, error: 'Security verification failed.' },
        { status: 400 }
      );
    }

    // 5. Check upload eligibility before storing the file
    const supabase = getSupabaseAdmin();
    const { data: existingIpUpload, error: ipLookupError } = await supabase
      .from('uploads')
      .select('id')
      .eq('ip_address', clientIp)
      .limit(1)
      .maybeSingle();

    if (ipLookupError) {
      console.error('EditorSaves IP lookup error:', ipLookupError);
      return NextResponse.json(
        { success: false, error: 'Could not verify upload eligibility.' },
        { status: 500 }
      );
    }

    if (existingIpUpload) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already uploaded a file. Please share a different save file to help us.',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = createHash('sha256').update(buffer).digest('hex');
    const { data: existingHashUpload, error: hashLookupError } = await supabase
      .from('uploads')
      .select('id')
      .eq('file_hash', fileHash)
      .limit(1)
      .maybeSingle();

    if (hashLookupError) {
      console.error('EditorSaves file hash lookup error:', hashLookupError);
      return NextResponse.json(
        { success: false, error: 'Could not verify upload eligibility.' },
        { status: 500 }
      );
    }

    if (existingHashUpload) {
      return NextResponse.json(
        {
          success: false,
          error: 'This save file has already been uploaded. Thank you for trying!',
        },
        { status: 400 }
      );
    }

    // 6. Upload file to Supabase Storage
    const fileId = randomUUID();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${fileId}/${safeFilename}`;

    const { error: uploadError } = await supabase.storage
      .from('save-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('EditorSaves storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to store the uploaded file.' },
        { status: 500 }
      );
    }

    // 7. Insert metadata row into the uploads table
    const { error: databaseError } = await supabase
      .from('uploads')
      .insert([
        {
          id: fileId,
          original_filename: file.name,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          ip_address: clientIp,
          file_hash: fileHash,
        },
      ]);

    if (databaseError) {
      console.error('EditorSaves database insert error:', databaseError);
      // Clean up the orphaned storage file
      await supabase.storage.from('save-files').remove([storagePath]);
      return NextResponse.json(
        {
          success: false,
          error: 'The upload could not be recorded. Please try again.',
        },
        { status: 500 }
      );
    }

    // 8. Success
    return NextResponse.json({
      success: true,
      message: 'Thank you! Your file was uploaded successfully.',
      id: fileId,
    });
  } catch (error) {
    console.error('EditorSaves upload route error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
