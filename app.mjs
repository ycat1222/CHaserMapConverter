import { convertJsonToMap, convertMapToJson, detectFormat } from './converter.mjs';

const sourceText = document.querySelector('#source-text');
const resultText = document.querySelector('#result-text');
const inputFormat = document.querySelector('#input-format');
const fileInput = document.querySelector('#file-input');
const sourceFilename = document.querySelector('#source-filename');
const resultStatus = document.querySelector('#result-status');
const outputExtension = document.querySelector('#output-extension');
const errorMessage = document.querySelector('#error-message');
const convertButton = document.querySelector('#convert-button');
const copyButton = document.querySelector('#copy-button');
const downloadButton = document.querySelector('#download-button');
let loadedFilename = '';
let currentOutputExtension = 'json';

const syncTextareaHeight = () => {
  resultText.style.height = `${sourceText.getBoundingClientRect().height}px`;
};

new ResizeObserver(syncTextareaHeight).observe(sourceText);
syncTextareaHeight();

function resetResult() {
  resultText.value = '';
  outputExtension.textContent = '';
  outputExtension.hidden = true;
  resultStatus.textContent = '15 × 17 のマップに対応';
  copyButton.disabled = true;
  downloadButton.disabled = true;
}

function clearError() {
  errorMessage.textContent = '';
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  sourceText.value = await file.text();
  loadedFilename = file.name;
  sourceFilename.textContent = file.name;
  const extensionFormat = file.name.toLowerCase().endsWith('.map') ? 'map' : file.name.toLowerCase().endsWith('.json') ? 'json' : '';
  if (extensionFormat) inputFormat.value = extensionFormat;
  resetResult();
  clearError();
});

sourceText.addEventListener('input', () => {
  if (loadedFilename) {
    loadedFilename = '';
    sourceFilename.textContent = 'テキストを貼り付けて変換できます';
  }
  resetResult();
  clearError();
});

inputFormat.addEventListener('change', resetResult);

convertButton.addEventListener('click', () => {
  clearError();
  try {
    const format = inputFormat.value === 'auto' ? detectFormat(sourceText.value, loadedFilename) : inputFormat.value;
    currentOutputExtension = format === 'map' ? 'json' : 'map';
    resultText.value = format === 'map' ? convertMapToJson(sourceText.value) : convertJsonToMap(sourceText.value);
    outputExtension.textContent = `.${currentOutputExtension}`;
    outputExtension.hidden = false;
    resultStatus.textContent = `変換しました · ${format === 'map' ? 'JSON' : 'MAP'} 形式`;
    copyButton.disabled = false;
    downloadButton.disabled = false;
  } catch (error) {
    resetResult();
    errorMessage.textContent = error instanceof Error ? error.message : '変換に失敗しました。';
  }
});

document.querySelector('#clear-button').addEventListener('click', () => {
  sourceText.value = '';
  loadedFilename = '';
  sourceFilename.textContent = 'テキストを貼り付けて変換できます';
  fileInput.value = '';
  resetResult();
  clearError();
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    resultStatus.textContent = 'クリップボードにコピーしました';
  } catch {
    resultText.focus();
    resultText.select();
    resultStatus.textContent = '結果を選択しました。コピーしてください';
  }
});

downloadButton.addEventListener('click', () => {
  const baseName = (loadedFilename || 'map').replace(/\.(map|json)$/i, '');
  const blob = new Blob([resultText.value], { type: currentOutputExtension === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseName}.${currentOutputExtension}`;
  link.click();
  URL.revokeObjectURL(url);
});
