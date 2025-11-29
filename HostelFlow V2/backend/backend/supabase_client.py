"""
Supabase Client Utility for HostelFlow

This module provides a singleton Supabase client for interacting with
Supabase REST API, Storage, and Realtime features.

Usage:
    from backend.supabase_client import get_supabase_client
    
    supabase = get_supabase_client()
    
    # Query data
    response = supabase.table('your_table').select('*').execute()
    
    # Upload file to storage
    supabase.storage.from_('bucket_name').upload('file/path', file_data)
    
    # Realtime subscriptions
    supabase.table('bookings').on('INSERT', callback).subscribe()
"""

from typing import Optional
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class SupabaseClient:
    """
    Singleton wrapper for Supabase client.
    Ensures only one instance is created and reused throughout the application.
    """
    _instance: Optional[Client] = None
    _initialized: bool = False

    @classmethod
    def get_client(cls) -> Client:
        """
        Get or create the Supabase client instance.
        
        Returns:
            Client: Supabase client instance
            
        Raises:
            ImproperlyConfigured: If Supabase credentials are not set or library not installed
        """
        if not SUPABASE_AVAILABLE:
            raise ImproperlyConfigured(
                'supabase-py is not installed. Install it with: pip install supabase'
            )

        if cls._instance is None or not cls._initialized:
            url = settings.SUPABASE_URL
            key = settings.SUPABASE_KEY

            if not url or not key:
                raise ImproperlyConfigured(
                    'SUPABASE_URL and SUPABASE_KEY must be set in settings. '
                    'Add them to your .env file:\n'
                    'SUPABASE_URL=https://your-project.supabase.co\n'
                    'SUPABASE_KEY=your-anon-key'
                )

            try:
                cls._instance = create_client(url, key)
                cls._initialized = True
            except Exception as e:
                raise ImproperlyConfigured(
                    f'Failed to initialize Supabase client: {str(e)}'
                )

        return cls._instance

    @classmethod
    def reset(cls):
        """Reset the client instance (useful for testing)"""
        cls._instance = None
        cls._initialized = False


def get_supabase_client() -> Client:
    """
    Convenience function to get the Supabase client.
    
    Returns:
        Client: Supabase client instance
    
    Example:
        >>> from backend.supabase_client import get_supabase_client
        >>> supabase = get_supabase_client()
        >>> data = supabase.table('services').select('*').execute()
    """
    return SupabaseClient.get_client()


# Storage Helper Functions

def upload_file(bucket: str, path: str, file_data: bytes, content_type: str = None) -> dict:
    """
    Upload a file to Supabase Storage.
    
    Args:
        bucket: Storage bucket name
        path: File path within the bucket
        file_data: File content as bytes
        content_type: MIME type of the file (optional)
        
    Returns:
        dict: Upload response with 'path' and 'url'
        
    Example:
        >>> response = upload_file('avatars', 'user123.jpg', image_bytes, 'image/jpeg')
        >>> print(response['url'])
    """
    supabase = get_supabase_client()
    options = {'content-type': content_type} if content_type else {}
    
    response = supabase.storage.from_(bucket).upload(path, file_data, options)
    
    # Get public URL
    public_url = supabase.storage.from_(bucket).get_public_url(path)
    
    return {
        'path': path,
        'url': public_url,
        'response': response
    }


def download_file(bucket: str, path: str) -> bytes:
    """
    Download a file from Supabase Storage.
    
    Args:
        bucket: Storage bucket name
        path: File path within the bucket
        
    Returns:
        bytes: File content
        
    Example:
        >>> content = download_file('avatars', 'user123.jpg')
    """
    supabase = get_supabase_client()
    return supabase.storage.from_(bucket).download(path)


def delete_file(bucket: str, path: str) -> dict:
    """
    Delete a file from Supabase Storage.
    
    Args:
        bucket: Storage bucket name
        path: File path within the bucket
        
    Returns:
        dict: Deletion response
        
    Example:
        >>> response = delete_file('avatars', 'user123.jpg')
    """
    supabase = get_supabase_client()
    return supabase.storage.from_(bucket).remove([path])


def get_public_url(bucket: str, path: str) -> str:
    """
    Get the public URL for a file in Supabase Storage.
    
    Args:
        bucket: Storage bucket name
        path: File path within the bucket
        
    Returns:
        str: Public URL
        
    Example:
        >>> url = get_public_url('avatars', 'user123.jpg')
    """
    supabase = get_supabase_client()
    return supabase.storage.from_(bucket).get_public_url(path)


# Database Helper Functions

def query_table(table_name: str, filters: dict = None, select: str = '*') -> dict:
    """
    Query a Supabase table with optional filters.
    
    Args:
        table_name: Name of the table
        filters: Dictionary of filters (column: value)
        select: Columns to select (default: '*')
        
    Returns:
        dict: Query response with data
        
    Example:
        >>> data = query_table('bookings', {'user_id': 123, 'status': 'Booked'})
        >>> print(data.data)
    """
    supabase = get_supabase_client()
    query = supabase.table(table_name).select(select)
    
    if filters:
        for column, value in filters.items():
            query = query.eq(column, value)
    
    return query.execute()


def insert_record(table_name: str, data: dict) -> dict:
    """
    Insert a record into a Supabase table.
    
    Args:
        table_name: Name of the table
        data: Dictionary of column: value pairs
        
    Returns:
        dict: Insert response with created record
        
    Example:
        >>> record = insert_record('notifications', {
        ...     'user_id': 123,
        ...     'message': 'New booking confirmed',
        ...     'read': False
        ... })
    """
    supabase = get_supabase_client()
    return supabase.table(table_name).insert(data).execute()


def update_record(table_name: str, record_id: int, data: dict) -> dict:
    """
    Update a record in a Supabase table.
    
    Args:
        table_name: Name of the table
        record_id: ID of the record to update
        data: Dictionary of column: value pairs to update
        
    Returns:
        dict: Update response
        
    Example:
        >>> response = update_record('notifications', 456, {'read': True})
    """
    supabase = get_supabase_client()
    return supabase.table(table_name).update(data).eq('id', record_id).execute()


def delete_record(table_name: str, record_id: int) -> dict:
    """
    Delete a record from a Supabase table.
    
    Args:
        table_name: Name of the table
        record_id: ID of the record to delete
        
    Returns:
        dict: Delete response
        
    Example:
        >>> response = delete_record('notifications', 456)
    """
    supabase = get_supabase_client()
    return supabase.table(table_name).delete().eq('id', record_id).execute()


# Realtime Helper Functions

def subscribe_to_table(table_name: str, event: str, callback):
    """
    Subscribe to realtime changes on a Supabase table.
    
    Args:
        table_name: Name of the table
        event: Event type ('INSERT', 'UPDATE', 'DELETE', or '*')
        callback: Function to call when event occurs
        
    Example:
        >>> def on_new_booking(payload):
        ...     print(f"New booking: {payload['new']}")
        >>> 
        >>> subscribe_to_table('bookings', 'INSERT', on_new_booking)
    """
    supabase = get_supabase_client()
    return supabase.table(table_name).on(event, callback).subscribe()
