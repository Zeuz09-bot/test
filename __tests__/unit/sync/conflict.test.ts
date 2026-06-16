import { resolveConflict } from '../../../src/sync/conflict';

describe('Conflict Resolution', () => {
  it('should pick the version with the later updated_at', () => {
    const local = { id: '1', title: 'Local', updated_at: '2026-06-16T10:00:00Z' };
    const remote = { id: '1', title: 'Remote', updated_at: '2026-06-16T12:00:00Z' };
    expect(resolveConflict(local, remote)).toEqual(remote);
  });

  it('should pick local when timestamps are equal', () => {
    const local = { id: '1', title: 'Local', updated_at: '2026-06-16T10:00:00Z' };
    const remote = { id: '1', title: 'Remote', updated_at: '2026-06-16T10:00:00Z' };
    expect(resolveConflict(local, remote)).toEqual(local);
  });

  it('should pick local when local is newer', () => {
    const local = { id: '1', title: 'Local', updated_at: '2026-06-16T14:00:00Z' };
    const remote = { id: '1', title: 'Remote', updated_at: '2026-06-16T12:00:00Z' };
    expect(resolveConflict(local, remote)).toEqual(local);
  });
});
