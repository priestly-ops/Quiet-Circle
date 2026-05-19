import { describe, expect, it } from 'vitest';
import { mapDbMessage } from '../services/roomService';

describe('roomService', () => {
  it('maps database messages into UI shape', () => {
    const mapped = mapDbMessage({
      id: '123',
      room_key: 'late-night',
      display_name: 'Nova',
      message: 'You are not alone.',
      created_at: '2026-05-19T00:00:00Z'
    });

    expect(mapped.id).toBe('123');
    expect(mapped.user).toBe('Nova');
    expect(mapped.roomKey).toBe('late-night');
    expect(mapped.text).toBe('You are not alone.');
    expect(mapped.source).toBe('supabase');
  });

  it('falls back to Anonymous display name', () => {
    const mapped = mapDbMessage({
      id: '321',
      room_key: 'healing',
      message: 'quiet message'
    });

    expect(mapped.user).toBe('Anonymous');
  });
});
