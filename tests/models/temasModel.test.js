// Unit tests for models/temasModel.js

jest.mock('../../db', () => ({
  query: jest.fn()
}));

const db = require('../../db');
const { getTemasConSubtemas } = require('../../models/temasModel');

describe('getTemasConSubtemas', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns rows from the DB query', async () => {
    const fakeRows = [
      { id_tema: 1, tema: 'T1', descripcion: 'd1', icono: 'i1', id_subtema: 10, id_subtema_name: 'S1' },
      { id_tema: 1, tema: 'T1', descripcion: 'd1', icono: 'i1', id_subtema: 11, id_subtema_name: 'S2' }
    ];
    db.query.mockResolvedValue([fakeRows]);

    const rows = await getTemasConSubtemas();
    expect(db.query).toHaveBeenCalled();
    expect(rows).toBe(fakeRows);
  });
});
