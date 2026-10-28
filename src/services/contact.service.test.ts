import { describe, it, expect, beforeEach } from 'vitest';
import { contactService } from './contact.service';

describe('contactService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('successfully submits a contact message in offline/fallback mode', async () => {
    const result = await contactService.submitMessage({
      name: 'Ada Lovelace',
      email: 'ada@example.edu',
      subject: 'Inquiry',
      message: 'Need help with CS101 enrollment.',
    });

    expect(result.success).toBe(true);

    const stored = localStorage.getItem('recallloop_v2_contact_messages');
    expect(stored).not.toBeNull();
    const list = JSON.parse(stored!);
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Ada Lovelace');
    expect(list[0].email).toBe('ada@example.edu');
    expect(list[0].message).toBe('Need help with CS101 enrollment.');
  });
});
