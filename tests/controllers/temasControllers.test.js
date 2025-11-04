jest.mock('../../models/temasModel', () => ({
  getTemasConSubtemas: jest.fn()
}));

const { getTemasConSubtemas } = require('../../models/temasModel');
const { obtenerTemas } = require('../../controllers/temasControllers');

describe('obtenerTemas controller', () => {
  afterEach(() => jest.clearAllMocks());

  it('transforms rows into temas with subtemas and calls res.json', async () => {
    const rows = [
      { id_tema: 1, tema: 'T1', descripcion: 'd1', icono: 'i1', id_subtema: 10, id_subtema: 'S1' },
      { id_tema: 1, tema: 'T1', descripcion: 'd1', icono: 'i1', id_subtema: 11, id_subtema: 'S2' },
      { id_tema: 2, tema: 'T2', descripcion: 'd2', icono: 'i2', id_subtema: null, id_subtema: null }
    ];
    getTemasConSubtemas.mockResolvedValue(rows);

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };
    const req = {};

    await obtenerTemas(req, res);

    expect(getTemasConSubtemas).toHaveBeenCalled();
    expect(json).toHaveBeenCalled();

    const result = json.mock.calls[0][0];
    // Expect two temas
    expect(result).toHaveLength(2);
    const tema1 = result.find(t => t.id === 1);
    expect(tema1.subtemas).toHaveLength(2);
    const tema2 = result.find(t => t.id === 2);
    expect(tema2.subtemas).toHaveLength(0);
  });

  it('handles errors and returns 500', async () => {
    getTemasConSubtemas.mockRejectedValue(new Error('DB error'));
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };
    const req = {};

    await obtenerTemas(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Error fetching temas' });
  });
});
