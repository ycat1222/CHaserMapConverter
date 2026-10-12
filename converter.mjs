const WIDTH = 15;
const HEIGHT = 17;
const MAP_SIZE_ERROR = 'マップサイズは15列×17行である必要があります。';

function validateLayout(layout) {
  if (!Array.isArray(layout) || layout.length !== HEIGHT || layout.some((row) => typeof row !== 'string' || row.length !== WIDTH)) {
    throw new Error(MAP_SIZE_ERROR);
  }
  return layout;
}

function parsePosition(value, label) {
  const parts = value.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((part) => !Number.isInteger(part))) {
    throw new Error(`${label}の座標は「x,y」の整数で指定してください。`);
  }
  const [x, y] = parts;
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
    throw new Error(`${label}の座標がマップの範囲外です。`);
  }
  return [x, y];
}

export function convertMapToJson(source) {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('入力ファイルが空です。');

  let name;
  let size;
  let coolPosition;
  let hotPosition;
  const layout = [];

  for (const line of lines) {
    if (line.startsWith('N:')) {
      name = line.slice(2).trim();
    } else if (line.startsWith('S:')) {
      size = line.slice(2).split(',').map((value) => Number(value.trim()));
    } else if (line.startsWith('D:')) {
      const cells = line.slice(2).trim().split(',').map((cell) => cell.trim());
      if (cells.length !== WIDTH || cells.some((cell) => cell.length !== 1)) throw new Error(MAP_SIZE_ERROR);
      layout.push(cells.join(''));
    } else if (line.startsWith('C:')) {
      coolPosition = parsePosition(line.slice(2), 'Cool');
    } else if (line.startsWith('H:')) {
      hotPosition = parsePosition(line.slice(2), 'Hot');
    }
  }

  if (size && (size.length !== 2 || size[0] !== WIDTH || size[1] !== HEIGHT)) throw new Error(MAP_SIZE_ERROR);
  if (name === undefined || !coolPosition || !hotPosition) throw new Error('マップ名、Cool / Hot の位置など必須情報が不足しています。');
  if (coolPosition[0] === hotPosition[0] && coolPosition[1] === hotPosition[1]) throw new Error('Cool と Hot の位置が重複しています。');
  validateLayout(layout);

  const withPlayers = layout.map((row, y) => {
    const cells = [...row];
    if (coolPosition[1] === y) cells[coolPosition[0]] = 'C';
    if (hotPosition[1] === y) cells[hotPosition[0]] = 'H';
    return cells.join('');
  });

  return JSON.stringify({ id: 1, name, description: '', layout: validateLayout(withPlayers) }, null, 2);
}

export function convertJsonToMap(source) {
  let payload;
  try {
    payload = JSON.parse(source);
  } catch {
    throw new Error('JSONを解析できません。形式を確認してください。');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('JSONのルートはオブジェクトである必要があります。');

  const requiredKeys = ['id', 'name', 'description', 'layout'];
  if (requiredKeys.some((key) => !Object.hasOwn(payload, key))) {
    throw new Error('JSONには id、name、description、layout が必要です。');
  }
  if (typeof payload.name !== 'string') throw new Error('name は文字列である必要があります。');
  const layout = validateLayout(payload.layout);
  let coolPosition;
  let hotPosition;
  const normalizedLayout = layout.map((row, y) => [...row].map((cell, x) => {
    if (cell === 'C') {
      if (coolPosition) throw new Error('レイアウトには C マーカーを1つだけ含めてください。');
      coolPosition = [x, y];
      return '0';
    }
    if (cell === 'H') {
      if (hotPosition) throw new Error('レイアウトには H マーカーを1つだけ含めてください。');
      hotPosition = [x, y];
      return '0';
    }
    return cell;
  }).join(''));

  if (!coolPosition || !hotPosition) throw new Error('レイアウトには C と H の両方のマーカーが必要です。');
  const dataLines = normalizedLayout.map((row) => `D:${[...row].join(',')}`);
  return [
    `N:${payload.name}`,
    'T:100',
    `S:${WIDTH},${HEIGHT}`,
    ...dataLines,
    `C:${coolPosition[0]},${coolPosition[1]}`,
    `H:${hotPosition[0]},${hotPosition[1]}`,
  ].join('\n') + '\n';
}

export function detectFormat(source, filename = '') {
  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith('.map')) return 'map';
  if (lowerName.endsWith('.json')) return 'json';
  const trimmed = source.trimStart();
  if (trimmed.startsWith('{')) return 'json';
  if (/^(?:N|T|S|D|C|H):/m.test(source)) return 'map';
  throw new Error('入力形式を判定できません。.map か .json を選択してください。');
}
