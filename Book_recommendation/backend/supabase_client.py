from __future__ import annotations
from typing import Optional
from supabase import create_client, Client
from django.conf import settings

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """Return a singleton Supabase client using settings.SUPABASE_URL/KEY.
    Raises a clear error if configuration is missing.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = getattr(settings, 'SUPABASE_URL', None)
    key = getattr(settings, 'SUPABASE_KEY', None)
    if not url or not key:
        raise RuntimeError(
            'Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY in your .env.'
        )
    _supabase_client = create_client(url, key)
    return _supabase_client


def get_storage_bucket(name: Optional[str] = None):
    """Convenience accessor for a storage bucket. If name is omitted,
    uses settings.SUPABASE_BUCKET.
    """
    bucket_name = name or getattr(settings, 'SUPABASE_BUCKET', None)
    if not bucket_name:
        raise RuntimeError('No bucket name provided. Set SUPABASE_BUCKET in .env or pass name.')
    client = get_supabase()
    return client.storage.from_(bucket_name)
